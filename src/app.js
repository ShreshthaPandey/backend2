import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
})) // use for middle ware

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser());


// routes import

import userRouter from "./routes/user.routes.js";   


// routes declaration
app.use("/api/v1/users" , userRouter)


// http:localhost:8000//api/v1/users/register => it will redirect the register ... as it will redirect to userRoutes and further things are define there


export{app}
