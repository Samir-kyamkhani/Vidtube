import { Router } from "express";
import { userSignup } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

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

export default router;
