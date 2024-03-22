# Vidtube 
online video platform

## Description
Creating a vidtube app a online video platform

### Steps
###### 1. Folder structer setup ✔
###### 2. Connect to database
1. Write a code to create const DB_NAME in constants.js file
```
export const DB_NAME = "vidtube"
```
2. Create index.js file in db folder and write a methode for connect database
```
const DB_CONNECTION = async () => {
    try {
        const connectionInctence = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`CONNECTION SUCCESSFULLY:: ${connectionInctence.connection.host}`);
    } catch (error) {
        console.log("DB CONNECTION FAILED:: ",error.message);
        process.exit(1);
    }
}

export default DB_CONNECTION;
```
3. Write a code in app.js file for import express js and export default ap
```
import express from "express"; 

const app = express();

export default app
```
4. Write a code in root index.js file for configure dotenv pkg, or import app for configure server to start and Import Db connection methode() to connect the database 
```
//Configure dotenv
dotenv.config({
    path: "./.env"
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
```