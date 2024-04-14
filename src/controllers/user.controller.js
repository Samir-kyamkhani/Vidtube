import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { use } from "bcrypt/promises.js";
import mongoose from "mongoose";

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

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    )
  
    const user = await User.findById(decodedToken?._id)
  
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
  
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh and access token expired");
    }
  
    const {accessToken, newRefreshToken} = await generateTokens(user?._id);
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(new ApiResponse(200, "Access token refreshed sucessfully", {accessToken, refreshToken: newRefreshToken}))
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token!");
  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const {oldPassword, newPassword} = req.body;

  const user  = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.comparePassword(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false});

  return res
  .status(200)
  .json(new ApiResponse(200, "Password changed successfully", {}));

})

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user

  return res
  .status(200)
  .json(
    new ApiResponse(200, "User fetched successfully", user)
  )
})

const updateUserDetails = asyncHandler(async (req, res) => {
  const {fullName, username, email} = req.body;

  if (!fullName && !username && !email) {
    throw new ApiError(400, "Please fill all fields");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        username,
        email,
      }
    },
    {
      new: true,
    }
  ).select("-password");

  return res
  .status(200) 
  .json(new ApiResponse(200, "User details updated successfully", user))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalFilePath = req.file.path

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);

  if (!avatar) {
    throw new ApiError(400, "Error while updating avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      }
    },
    {
      new: true,
    }
  ).select("-password");

  return res
  .status(200)
  .json(new ApiResponse(200, "User avatar updated successfully", user))

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(400, "Error while updating cover image");
  }
  
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      }
    },
    {
      new: true,
    }
  )/select("-password");

  return res
  .status(200)
  .json(new ApiResponse(200, "User cover image updated successfully", user))
})

const getUserCurrentProfile = asyncHandler(async (req, res) => {
  const {username} = req.params;

  if(!username?.trim()) {
    throw new ApiError(400, "Username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()?.trim()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        subscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1

      }
    }
  ])

  if(!channel?.length) {
    throw new ApiError(404, "Channel not found")
  }

  return res
  .status(200)
  .json(new ApiResponse(200, "Channel fetched successfully", channel))

})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    },
    
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(200, "Watch history fetched successfully", user[0].watchHistory)
  )
})

export { 
  userSignup, 
  userLogin, 
  userLogout, 
  refreshAccessToken, 
  changeCurrentPassword, 
  getCurrentUser, 
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserCurrentProfile,
  getWatchHistory
};
