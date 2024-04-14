import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserCurrentProfile,
  getWatchHistory,
  refreshAccessToken,
  updateUserAvatar,
  updateUserCoverImage,
  updateUserDetails,
  userLogin,
  userLogout,
  userSignup,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/signup").post(
  //file handling middleware for multer, we can add multiple fields to the array. before userSignup Save
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  userSignup,
);

router.route("/login").post(userLogin);

// Secure logout route, we are using verifyJwt middleware to verify the jwt token.
router.route("/logout").post(verifyJwt, userLogout);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/update-account").patch(verifyJwt, updateUserDetails);

router
  .route("/update-avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-cover-image")
  .patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJwt, getUserCurrentProfile);
router.route("/history").get(verifyJwt, getWatchHistory);

export default router;
