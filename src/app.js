import express from "express"; 
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const data = "1mb";

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use(express.json({limit: data}))
app.use(express.urlencoded({extended: true, limit: data}))
app.use(cookieParser())

//Import router
import userSignup from "./routes/user.routes.js";

//Router decleration
app.use("/api/v1/users", userSignup)


export {app}