import { NextFunction, Router } from "express";
import { Request, Response } from "express";
import authService from "./auth.service";
import { SuccessResponse } from "../../common/exception/success.responce";
import {
  loginRateLimit,
  sendOtpRateLimit,
} from "../../common/middleware/rateLimit/rateLimit";
import { auth } from "../../common/middleware/auth/auth";
import { validate } from "../../common/vaildation/vaildation";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  verifyResetOtpSchema,
} from "./auth.validation";
import { upload } from "../../common/utils/multer/multer";
import { catchAsync } from "../../common/utils/catchAsync";
import { uploadImage } from "../../common/service/cloudinary.service";

const authRouter = Router();

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
  validate(resetPasswordSchema),
  catchAsync(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body);
    SuccessResponse({
      res,
      message: "Password reset successfully",
      data: result,
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
