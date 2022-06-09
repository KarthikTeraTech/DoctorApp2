import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// importing routes
import userRouter from './routes/userRoutes.js';
import adminRouter from "./routes/adminRoutes.js";
import authRouter from "./routes/auth.js";
import doctorRouter from './routes/doctorRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
app.use(express.json("limit: 100mb"));
app.use(cors());

// using routes
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/doctor", doctorRouter);

app.get("/", (req,res)=>{
    res.send("<h1>Hello from App</h1>")
    res.end();
})





app.listen(PORT, (err)=>{
    if(err) process.exit(0);
    console.log("Listening on PORT", PORT);
})