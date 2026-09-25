import { Router, Request, Response } from "express";
import UserService from "./user.service";
import { SuccessResponse } from "../../common/exception/success.responce";
import { auth } from "../../common/middleware/auth/auth.js";
import { upload } from "../../common/utils/multer/multer.js";
import { uploadImage } from "../../common/service/cloudinary.service.js";

const router = Router();

router.get("/", auth(), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const users = await UserService.getUsers(req.user.id);
  return SuccessResponse({
    res,
    message: "Users retrieved successfully",
    data: users,
  });
});

router.get("/profile", auth(), async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error("User not found");
  }

  const user = await UserService.getData(req.user.id);

  SuccessResponse({
    res,
    message: "Your Data",
    data: user,
  });
});

router.put(
  "/UpDateUserProfile",
  auth(),
  upload().single("profileImage"),
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("User not found");
    }

    const uploadedImage = req.file
      ? await uploadImage(req.file.buffer, "nexa/profile-images")
      : undefined;
    const user = await UserService.updateData(
      req.user.id,
      req.body,
      uploadedImage?.secure_url,
    );

    SuccessResponse({
      res,
      message: "Your Data Updated",
      data: user,
    });
  },
);

export default router;
