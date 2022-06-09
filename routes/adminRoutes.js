import express from "express";
import { authorizeAdmin } from "../middlewares/authorize.js";
import con from "../models/db.js";
import { Mail } from "../utils/mail.js";
const adminRouter =  express.Router();

adminRouter.get("/getAppointments", authorizeAdmin ,(req,res)=>{
    const sql = "select * from appointments";

    con.query(sql, function (err, result) {
        if (err) return res.json({ success: false, msg: "Unexpected problem occurred while getting doctors" });

        else if (result.length > 0) return res.json({ success: true, data: result })

        else return res.json({ success: false, msg: "No Appointments Found" });
    })
})


adminRouter.post("/operation", authorizeAdmin , (req,res)=>{
    const {ids, emails,  op} = req.body;

    let status = op === "approve" ? 1 : -1;
    let sql = `update appointments set status = ${status} where id = `;

    // query to update multiple ids at same time with help of appending the string with OR in sql
    ids.map((id, index)=>{
        if(index==0)
            sql += `${id}`

        else
            sql += ` or id=${id}`
    })

    con.query(sql, function(err, result){
        if(err)
            return res.json({success:false, msg:"Internal Server Error Occurred"});

        else if(result.affectedRows>0)
        {
            let msg;
            if(result.affectedRows==1 && status==-1)
                msg=`1 Appointment Rejected`
            else if(result.affectedRows>1 && status==-1)
                msg=`${result.affectedRows} Appointments Rejected`
            else if(result.affectedRows==1 && status==1)
                msg=`1 Appointment Approved`
            else if(result.affectedRows>1 && status==1)
                msg=`${result.affectedRows} Appointments Approved`
            
            // sending mails to users
            // let appointmentStatus = status==1 ? "Approved": "Rejected";
            // emails.forEach(email => {
            //     if(email && email!==null && email!=="")
            //     {
            //         Mail(email, appointmentStatus);
            //     }
            // });

            return res.json({success:true, msg})
        }
        else
            return res.json({success:false, msg:"Internal Server Error Occurred"});
    })
})

export default adminRouter;