
import { z } from "zod";

export const signupSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(2, "Username must be at least 2 characters")
      .max(100, "Username must be at most 100 characters")
      .optional(),

    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(100, "First name must be at most 100 characters")
      .optional(),

    unique_name: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .optional(),

    email: z.string().trim().email("Invalid email format"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/,
        "Password must contain at least one uppercase letter, one number, and one special character (@$!%*?&)",
      ),

    age: z.coerce
      .number()
      .min(18, "You must be at least 18 years old")
      .optional(),

    phoneNumber: z
      .string()
      .trim()
      .min(10, "Phone number must be at least 10 characters")
      .optional(),

    gender: z
      .enum(["male", "female"])
      .optional(),
  })
  .superRefine((data, ctx) => {
    const username = data.username?.trim() ?? data.firstName?.trim();
    const uniqueName = data.unique_name?.trim();

    if (!username) {
      ctx.addIssue({
        path: ["username"],
        code: "custom",
        message: "Username is required",
      });
    }

    if (!uniqueName) {
      ctx.addIssue({
        path: ["unique_name"],
        code: "custom",
        message: "Unique username is required",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: strongPassword,
  confirmNewPassword: z.string().min(1, "Please confirm your new password"),
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmNewPassword) {
    ctx.addIssue({
      path: ["confirmNewPassword"],
      code: "custom",
      message: "Passwords do not match",
    });
  }
  if (data.newPassword === data.currentPassword) {
    ctx.addIssue({
      path: ["newPassword"],
      code: "custom",
      message: "New password must be different from your current password",
    });
  }
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
});

export const verifyResetOtpSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  otp: z.string().trim().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  resetToken: z.string().trim().min(1, "Reset token is required"),
  newPassword: strongPassword,
  confirmPassword: z
    .string()
    .min(6, "Password confirmation must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});
