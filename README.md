# Vidtube 
online video platform

## Description
Creating a vidtube app a online video platform

### Steps
###### 1. Folder structer setup ✔
1. Run comand for install backend
```
$ npm init
```
2. Run command for install devDependencies nodemon, prettier
```
$ npm i -D prettier
$ npm i -D nodemon
```
3. Create a .env file
4. Create a public/temp/.gitkeep file
5. Create a .gitignore, .prettierrc, .prettierignore file
###### .prettierrc
```
{
    "singleQuote": false,
    "bracketSpacing": true,
    "tabWidth": 2,
    "trailingComa": "es5",
    "semi": true
}
```
###### .prettierignore
```
/.vscode
/node_modules
./dist

*.env
.env
.env.*
```
6. Create a src folder
7. In the src folder
    
    Create javaScript files
        
        app.js
        constants.js
        index.js

    Create Folders

        controllers
        db
        middlewares
        models
        routes
        utils

###### 2. Connect to database ✔
Write a code to create const DB_NAME in constants.js file
```
export const DB_NAME = "vidtube"
```
Create index.js file in db folder and write a methode for connect database
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
Write a code in app.js file for import express js and export default ap
```
import express from "express"; 

const app = express();

export default app
```
Write a code in root index.js file for configure dotenv pkg, or import app for configure server to start and Import Db connection methode() to connect the database 
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
Write a code for configure cookieParser(), Cors() middlewares or params (urlencoded), json formate
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

Create a High-oreder function in Utils folder for handle request or anync function code
```
const asyncHandler = (requestHandler) => (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error.message))
}

export {asyncHandler}
```
Create a custom class Method for ApiError handling in Utlis folder
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
Create a custom class method for ApiResponse handling in Utils folder
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
###### 4. Create User and Video models
Write a code for User Model data modling
```
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
        lowercase: true,
        
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        
    },
    fullName: {
        type: String,
        required: true,

    },
    password: {
        type: String, // Password will be hashed in the bcrypt middleware
        required: true,
    },
    refreshToken: {
        type: String,
    },
    avatar: {
        type: String, //letter on cloudinary
        required: true,
    },
    coverImage: {
        type: String, //letter on cloudinary

    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video" //video model ref here
        }
    ]

}, {timestamps: true})

```
Write a code for Video Model data modling || import mongoose-aggregate-paginate-v2

```
const videoSchema = new Schema({
    title: {
        type: String,
        required: true,
    }, 
    description: {
        type: String,
        required: true,
    },
    videoFile: {
        type: String, // middelware
        required: true,
    },
    thumbnail: {
        type: String, // middelware
        required: true,
    },
    duration: {
        type: Number,
    },
    views: {
        type: Number,
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    isPublished: {
        type: Boolean,
        required: true,
        default: true,
    }
}, {timestamps: true});

videoSchema.plugin(aggregatePaginate); //pagination plugin

```
Create a method for passwprd hasing with the help of bcrypt middleware
```
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
}); // dont use callbacke function becose callback does'nt have "this" access
```
Create a method for comaprePassword with the help of bcrypt middleware
```
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};
```
Create a method for AccessTokenGenerator with the help of jsonwebtoken middleware
```
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    //payload || data
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      fullName: this.fullName,
    },

    // Secret key
    // Access token env key
    process.env.ACCESS_TOKEN_SECRET,

    // expire key
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
    },
  );
}; // generate access token for user
```
Create a method for RefreshTokenGenerator with the help of jsonwebtoken middleware
```
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE },
  );
};
```
###### 5. Create Cloudinary and multer middleware methods for file uploading
Create a Cloudinary method to upload file on cloudinary or configure
```
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {  
    try {
        if(!localFilePath) return;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        return response.url;

    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the local save file as upload operation failed
        return null; // return null as upload operation failed
    }
}

```

Create a multer middlewae for uplodaing file on localy system
```
import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/temp")
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

export const upload = multer({
    storage,
})
```
##### 6. Write a Controllers methods

Creating a user controller to signup
```
const userSignup = asyncHandler(async (req, res) => {
  // Algorithem to signup user
  // 1. Get user details from request body
  // 2. Validation of user details !isEmpty
  // 3. Check for avatar or coverImage
  // 4. if avatar or cover image is present, upload to cloudinary
  // 5. Check If user exists, return error
  // 6. If user does not exist, create user
  // 7. Check for user Creation
  // 7. Return user remove password and refreshToken from response

  // Start here

  // user data handling
  const { username, fullName, email, password } = req.body;

  // Validation of user details
  if (
    [username, fullName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill all fields");
  }

  // Check for avatar or coverImage
  const avatarLocalPath = req.files?.avatar[0]?.path
  const coverImageLocalPath =  req.files?.coverImage[0]?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload avatar");
  }

  // if avatar or cover image is present, upload to cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400, "Error uploading avatar");
  }

  // Check If user exists, return error
  const exitedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (exitedUser) {
    throw new ApiError(409, "User already exists");
  }

  // 6. If user does not exist, create user
  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    email: email.toLowerCase() && email.trim(),
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    password: password.trim(),
  });
  // Check for user Creation remove password and refreshToken from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Error creating user");
  }
  // Return user
  return res
    .status(201)
    .json(new ApiResponse(201, "User created successfully", createdUser));
});

```

Creating a user controller to login user
```
const userLogin = asyncHandler(async (req, res) => {
  // Algorithem to login user

  // get login details from request body
  // validation of login details
  // check if user exists
  // check if password correct
  // generate tokens || remove password and refreshToken and send cookies
  // return user and token

  // Start here

  // user data handling
  const { email, password, username} = req.body;

  // validation of login details
  if (!email && !password) {
    throw new ApiError(400, "Please fill all fields");
  }

  // check if user exists
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // check if password correct
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }

  // generate tokens || remove password and refreshToken and send cookies
  const { refreshToken, accessToken } = await generateTokens(user?._id);

  // logedInUser
  const logedInUser = await User.findById(user?._id).select(
    "-password -refreshToken",
  );

  // return user and token
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: logedInUser,
        accessToken,
        refreshToken, // if user want to save manualy tokens
      }),
    );
});
```

Creating a auth middleware
```
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";



export const verifyJwt = asyncHandler( async (req, _, next) => {
    try {
        const accessToken = await req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer ", "");
        if(!accessToken) {
            throw new ApiError(401, "Unauthorized request")
        }
        const verifyToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(verifyToken?._id).select("-password -refreshToken")

        if(!user) {
            throw new ApiError(401, "Unauthorized accessToken")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalidk accessToken")
    }
})
```

Creating a user controller to logout user
```
const userLogout = asyncHandler(async (req, res) => {
  // Algorithem to logout user

  // remove refreshToken from user
  // remove cookies from response

  // remove refreshToken from user
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );

  // remove cookies from response
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully", null));
});
```