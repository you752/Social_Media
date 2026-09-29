import { NextFunction, Router } from "express";
import { Request, Response } from "express";
import authService from "./auth.service";
import { SuccessResponse } from "../../common/exception/success.responce";
import {
  changePasswordRateLimit,
  loginRateLimit,
  sendOtpRateLimit,
} from "../../common/middleware/rateLimit/rateLimit";
import { auth } from "../../common/middleware/auth/auth";
import { validate } from "../../common/vaildation/vaildation";
import {
  forgotPasswordSchema,
  changePasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  verifyResetOtpSchema,
} from "./auth.validation";
import { upload } from "../../common/utils/multer/multer";
import { catchAsync } from "../../common/utils/catchAsync";
import { uploadImage } from "../../common/service/cloudinary.service";
import { realtimeModule } from "../realtime/realtime.module";

const authRouter = Router();

authRouter.patch(
  "/change-password",
  auth(),
  changePasswordRateLimit,
  validate(changePasswordSchema),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await authService.changePassword(
      req.user.id,
      req.body,
    );
    realtimeModule.disconnectUserSockets(req.user.id);
    SuccessResponse({
      res,
      message: "Password changed successfully",
      data: result,
    });
  }),
);

authRouter.post(
  "/login",
  loginRateLimit,
  validate(loginSchema),
  catchAsync(async (req: Request, res: Response) => {
    let loginAccount = await authService.login(req.body);
    SuccessResponse({
      res,
      message: "user login successflly",
      data: loginAccount,
    });
  }),
);

authRouter.post(
  "/signup",
  upload().single("profileImage"),
  validate(signupSchema),
  catchAsync(async (req: Request, res: Response) => {
    const uploadedImage = req.file
      ? await uploadImage(req.file.buffer, "nexa/profile-images")
      : undefined;
    let data = await authService.signUp(req.body, uploadedImage?.secure_url);
    SuccessResponse({
      res,
      message: "user added successflly",
      data: data,
    });
  }),
);

authRouter.post(
  "/verifyAccount",
  catchAsync(async (req: Request, res: Response) => {
    let userData = await authService.verifyUser(req.body);
    SuccessResponse({
      res,
      message: "user verify is successfully",
      data: userData,
    });
  }),
);

authRouter.post(
  "/resendOtp",
  sendOtpRateLimit,
  catchAsync(async (req: Request, res: Response) => {
    let userData = await authService.resendOtp(req.body);
    SuccessResponse({
      res,
      message: "user verify is successfully",
      data: userData,
    });
  }),
);

authRouter.post(
  "/forgot-password",
  sendOtpRateLimit,
  validate(forgotPasswordSchema),
  catchAsync(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body);
    SuccessResponse({
      res,
      message: "If an account exists for this email, a reset code has been sent.",
      data: result,
    });
  }),
);

authRouter.post(
  "/verify-reset-otp",
  sendOtpRateLimit,
  validate(verifyResetOtpSchema),
  catchAsync(async (req: Request, res: Response) => {
    const result = await authService.verifyResetOtp(req.body);
    SuccessResponse({
      res,
      message: "OTP verified successfully",
      data: result,
    });
  }),
);

authRouter.post(
  "/reset-password",
  sendOtpRateLimit,
  validate(resetPasswordSchema),
  catchAsync(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body);
    realtimeModule.disconnectUserSockets(result.userId);
    const { userId: _userId, ...response } = result;
    SuccessResponse({
      res,
      message: "Password reset successfully",
      data: response,
    });
  }),
);

authRouter.post(
  "/logout",
  auth(),
  catchAsync(async (req: Request, res: Response) => {
    const result = await authService.logout(req);
    SuccessResponse({
      res,
      message: "logout successfully",
      data: result,
    });
  }),
);

authRouter.post(
  "/google",
  catchAsync(async (req: Request, res: Response) => {
    const result = await authService.googleAuth(req.body);
    SuccessResponse({
      res,
      message: "Google authentication successful",
      data: result,
    });
  }),
);

export default authRouter;
