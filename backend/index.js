import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectToMongo from "./utils/db.js";
import dotenv from "dotenv";
import userRoute from "./routes/user.route.js"
dotenv.config({});
const app= express();

app.get("/",(req,res)=>{
    return res.status(200).json({
        message:"I am coming from backend",
        success:true
    })
})


app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({extended:true}));
const corsOptions={
    origin:'http://localhost:5173',
    credentials:true
}

app.use(cors(corsOptions));

app.use("/api/v1/user",userRoute);

const PORT=process.env.PORT;

app.listen(PORT,()=>{
    connectToMongo();
    console.log(`Server is running on port ${PORT}`);

})