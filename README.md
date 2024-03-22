# Vidtube 
online video platform

## Description
Creating a vidtube app a online video platform

### Steps
###### 1. Folder structer setup ✔
###### 2. Connect to database ✔
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
###### 3. Setup custome ApiError, ApiResponse and async function handling ✔
1. Write a code for configure cookieParser(), Cors() middlewares or params (urlencoded), json formate
```
const data = "1mb";

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use(express.json({limit: data}))
app.use(express.urlencoded({extended: true, limit: data}))
app.use(cookieParser())
```

2. Create a High-oreder function in Utils folder for handle request or anync function code
```
const asyncHandler = (requestHandler) => (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error.message))
}

export {asyncHandler}
```
3. Create a custom class Method for ApiError handling in Utlis folder
```
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Somthing went wrong !",
    errorStack = "",
    errors = [],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.data = null;
    this.success = false;

    if (errorStack) {
      this.errorStack = errorStack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export {ApiError}
```
4. Create a custom class method for ApiResponse handling in Utils folder
```
class ApiResponse {
    constructor(
        statusCode,
        message = "Success",
        data,
    ) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode > 400;
    }
}

export {ApiResponse}
```
