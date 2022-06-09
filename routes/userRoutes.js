import express from 'express';
import con from '../models/db.js';
import { authorizeUser } from '../middlewares/authorize.js';
import { getCurrentDate, getDayMode } from '../utils/calendar.js';
import { EveningAppointmentTimings, MorningAppointmentTimings } from '../controllers/Appointments/Timings.js';
import { bookEmergencyAppointment, bookNormalAppointment } from '../controllers/Appointments/BookAppointments.js';
const userRouter = express.Router();


// GET DOCTORS
userRouter.get("/getDoctors", authorizeUser, (req, res) => {
    const sql = "select * from doctors";

    con.query(sql, function (err, result) {
        if (err) return res.json({ success: false, msg: "Unexpected problem occurred while getting doctors" });

        else if (result.length > 0) return res.json({ success: true, data: result })

        else return res.json({ success: false, msg: "No Doctors Found" });
    })
});

//Get all of my appointments
userRouter.get("/getAllMyAppointments", authorizeUser, async (req, res) => {
    const sql = "select * from appointments where pemail = ?";

    con.query(sql, [[req.user.email]], function (err, myAllAppointments) {
        if (err) {
            return res.json({ success: false, msg: "Unexpected problem occurred while fetching appointments" });
        }
        else if (myAllAppointments.length > 0) {
            return res.status(200).json({ success: true, data: myAllAppointments })
        }
        else
            return res.json({ success: false, msg: "No Appointments Found" });
    })
});

// GET APPOINTMENTS
userRouter.get("/getAppointments", authorizeUser, async (req, res) => {
    const sql = "select * from appointments where pemail = ? and appointmentDate = ?";
    // and appointmentDate = ?
    const sql2 = "select * from appointments";
    const date = await getCurrentDate();


    con.query(sql, [[req.user.email], [date]], function (err, myAllAppointments) {
        if (err) {
            return res.json({ success: false, msg: "Unexpected problem occurred while fetching appointments" });
        }
        else if (myAllAppointments.length > 0) {
            con.query(sql2, function (err, AllAppointments) {
                getAppointmentTimings(res, myAllAppointments, req.user.email, AllAppointments);
            });
            //return res.status(200).json({ success: true, data: myAllAppointments })
        }
        else
            return res.json({ success: false, msg: "No Appointments Today" });
    })
});

// *****GET ESTIMATE APPOINTMENT TIMING FOR USER*******
const getAppointmentTimings = async (res, myAllAppointments, myEmail, AllAppointments) => {
    const getCheckedInDocs = `select check_in_time, id, slot , email from check_in`;

    con.query(getCheckedInDocs, async function (err, checked_in_docs) {

        if (err) res.status(500).json({ success: false, msg: "Unexpected problem occurred" });

        // ids of doctors of all my appointments
        const docIdsFromMyAppoitments = AllAppointments.map(appointment => appointment.doctorID);

        let myMorningLastToken;
        for (let i = myAllAppointments.length - 1; i >= 0; i--) {
            if (myAllAppointments[i].slot === "morning") {
                myMorningLastToken = myAllAppointments[i].token;
                break;
            }
        }

        let myEveningLastToken;
        for (let i = myAllAppointments.length - 1; i >= 0; i--) {
            if (myAllAppointments[i].slot === "evening") {
                myEveningLastToken = myAllAppointments[i].token;
                break;
            }
        }

        // checking if doctors with whom patients has booked the appointment are checked in or not id's
        const getCheckedInDoctorsQuery = `SELECT COUNT(*) 
                                FROM check_in
                                WHERE id IN (?) and slot IN ('morning', 'evening')`;
        try {
            con.query(getCheckedInDoctorsQuery, [[...docIdsFromMyAppoitments]], async function (err, result) {
                if (err) res.status(500).json({ success: false, msg: "Unexpected problem occurred" });

                // sending all apps to a function and assigning a object of estimated time there to apps
                else if (result[0][Object.keys(result[0])[0]] > 0) {
                    const MorningApp = await MorningAppointmentTimings(myMorningLastToken, myEmail, AllAppointments, checked_in_docs);
                    const EveningApp = await EveningAppointmentTimings(myEveningLastToken, myEmail, AllAppointments, checked_in_docs);

                    return res.status(200).json({ success: true, data: [...MorningApp, ...EveningApp], timings:true })
                }
                // return the appointments booked by patient
                else {
                    return res.status(200).json({ success: true, data: myAllAppointments })
                }
            })
        }
        catch (error) {
            return res.status(500).json({ success: false, msg: "Unexpected problem occurred" });
        }
    })
}




//UPDATE APPOINTMENT
userRouter.post("/updateAppointment", authorizeUser, (req, res) => {
    const { pname, phone, appointmentType, id } = req.body.data;
    // const date = getCurrentDate(appointmentDate);

    const sql = `update appointments set pname = '${pname}', phone = '${phone}', appointmentType = '${appointmentType}' where id = '${id}'`;

    if (pname && phone && appointmentType && id) {
        con.query(sql, function (err, result) {
            if (err) return res.json({ success: false, msg: "Unexpected error occurred while updating appointment" });

            else if (result.affectedRows >= 1) return res.json({ success: true })

            else return res.json({ success: false, msg: "No Appointments Found" });
        })
    }
});




// BOOK AN APPOINTMENT
userRouter.post("/bookAppointment", authorizeUser, (req, res) => {
    const { pname, phone, slot, AppointmentType, date } = req.body.data;
    const doctorID = req.body.id;
    const currentDate = getCurrentDate(date);

    if (pname, req.user?.email, phone, slot, AppointmentType, doctorID, date) {

        // check if patient is registered
        //now not checking if the email is in db or not which is netered by patient
        // const sql = `select * from users where name = '${pname}' && email = '${pemail}'`;
        // con.query(sql , async function (err, result) {
        //     if (err) return res.json({ success: false, msg: "Unexpected problem occurred while recognizing user",err });

        //     else if (result.length > 0) 
        //     {
        switch (AppointmentType) {
            case "emergency":
                bookEmergencyAppointment(req, res, currentDate, pname, req.user.email, phone, slot, doctorID);
                break;

            case "normal":
                bookNormalAppointment(req, res, currentDate, pname, req.user.email, phone, slot, doctorID, "normal");
                break;

            case "vaccination":
                bookNormalAppointment(req, res, currentDate, pname, req.user.email, phone, slot, doctorID, "vaccination");
                //passing type as vaccination but will be considered as normal, i.e passing in normalAppointment function as of now because normal and vaccination are same begin with token 6 if we do not pass normal vaccination considers itself as different and starts again with 6 even if apps are already present for a day
                break;

            default:
                return res.json({ success: false, msg: "Invalid Appointment" });
        }
        //         }

        //         else return res.json({ success: false, msg: "Please Sign Up to continue" });
        //     })
    }
    else return res.json({ success: false, msg: "Invalid Details" });
});



export default userRouter;