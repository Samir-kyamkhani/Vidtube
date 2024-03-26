import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";

// Controller to signup user
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
    const {username, fullName ,email, password} = req.body

    // Validation of user details
    if([
        username,
        fullName,
        email,
        password   
    ].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "Please fill all fields")
    }

    // Check for avatar or coverImage
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Please upload avatar")
    }

    // if avatar or cover image is present, upload to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Error uploading avatar")
    }
   
    // Check If user exists, return error
    const exitedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(exitedUser){
        throw new ApiError(409, "User already exists")
    }

    // 6. If user does not exist, create user
    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        email: email.toLowerCase() && email.trim(),
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        password: password.trim(),

    })
    // Check for user Creation remove password and refreshToken from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "Error creating user")
    }
    // Return user 
    return res
    .status(201)
    .json(
        new ApiResponse(201, "User created successfully", createdUser)
    )
})

export {userSignup}