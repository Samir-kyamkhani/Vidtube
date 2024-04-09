import DB_CONNECTION from "./db/index.js";
import {app} from "./app.js";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env"  // path to config file
});

const port = process.env.PORT || 5000;

DB_CONNECTION()
.then(() => {
    app.on("error", (error) => {
        console.log("Server listening error:: ",error);
        throw error;
    })
    app.listen(port, () => {
        console.log(`Server running at port:: ${port}`);
    })
})
.catch((error) => {
    console.log("Server Connection failed:: ",error);
    throw error
})