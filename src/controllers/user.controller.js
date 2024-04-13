import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Cookie options for JWT
const cookieOptions = {
  httpOnly: true,
  secure: true,
};

// generate Tokens
const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken =  user.generateAccessToken();
    const refreshToken =  user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

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
  const { username, fullName, email, password } = req.body;

  // Validation of user details
  if (
    [username, fullName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill all fields");
  }

  // Check for avatar or coverImage
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload avatar");
  }

  // if avatar or cover image is present, upload to cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

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

// Controller to login user
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

// Controller to logout user
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
    .json(new ApiResponse(200, "User logged out successfully", {}));
});
export { userSignup, userLogin, userLogout };
