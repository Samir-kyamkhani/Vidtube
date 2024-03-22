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

export default app