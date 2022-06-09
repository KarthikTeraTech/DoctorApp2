import express from "express";
import { EditToken } from "../controllers/doctor/EditToken.js";
import { authorizeAdmin } from "../middlewares/authorize.js";
import con from "../models/db.js";
const doctorRouter =  express.Router();

doctorRouter.patch("/editToken", authorizeAdmin , async(req, res)=>{
   EditToken(req, res, con);
})

export default doctorRouter;