import { Router, Request, Response } from "express";
import UserService from "./user.service";
import { SuccessResponse } from "../../common/exception/success.responce";
import { auth } from "../../common/middleware/auth/auth.js";
import { upload } from "../../common/utils/multer/multer.js";
import { uploadImage } from "../../common/service/cloudinary.service.js";
import multer from "multer";

const router = Router();

const coverUpload = upload({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Cover must be an image file"));
      return;
    }
    callback(null, true);
  },
}).single("cover");

router.patch(
  "/me/cover",
  auth(),
  (req: Request, res: Response, next) => {
    coverUpload(req, res, (error) => {
      if (!error) {
        next();
        return;
      }
      const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
        ? "Cover image must be 5MB or smaller"
        : error instanceof Error
          ? error.message
          : "Could not upload cover image";
      return res.status(400).json({ success: false, message });
    });
  },
  async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Cover image is required" });
    }
    const uploadedCover = await uploadImage(req.file.buffer, "wave/cover-images");
    const result = await UserService.updateCover(req.user.id, uploadedCover.secure_url);
    return SuccessResponse({ res, message: "Cover updated", data: result });
  },
);

router.get("/settings", auth(), async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const settings = await UserService.getSettings(req.user.id);
  return SuccessResponse({ res, message: "Settings retrieved", data: settings });
});

router.patch("/settings", auth(), async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const settings = await UserService.updateSettings(req.user.id, req.body);
  return SuccessResponse({ res, message: "Settings updated", data: settings });
});

router.get("/profile/:userId", auth(), async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const profile = await UserService.getProfile(req.params.userId as string, req.user.id);
  return SuccessResponse({ res, message: "Profile retrieved", data: profile });
});

router.get("/profile/username/:username", auth(), async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const profile = await UserService.getProfileByUsername(
    req.params.username as string,
    req.user.id,
  );
  return SuccessResponse({ res, message: "Profile retrieved", data: profile });
});

router.get("/suggestions", auth(), async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(10, Math.max(1, Math.floor(requestedLimit)))
    : 10;
  const suggestions = await UserService.getSuggestions(req.user.id, limit);
  return SuccessResponse({ res, message: "Suggestions retrieved", data: suggestions });
});

router.get("/", auth(), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const discoverableOnly = req.query.discoverable === "true";
  const users = await UserService.getUsers(req.user.id, discoverableOnly);
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
      ? await uploadImage(req.file.buffer, "wave/profile-images")
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
