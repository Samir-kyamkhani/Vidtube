import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
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
        ref: "Video", //video model ref here
      },
    ],
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
}); // dont use callbacke function becose callback does'nt have "this" access

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

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

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE },
  );
};

export const User = mongoose.model("User", userSchema);
