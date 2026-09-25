import crypto from "crypto";

import { OAuth2Client } from "google-auth-library";

import { sendEmail } from "../../common/email/sendMail";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/exception/error.responce";
import {
  compareWord,
  hashWord,
} from "../../common/middleware/security/HashWord";
import { otpGenerator } from "../../common/otp/otp";
import { env } from "../../config/env.service";
import { IUser, providerEnum } from "../../common";
import { authRepository } from "./authRepo";
import { redisService } from "../../common/redis/redis.service";
import { TokenService } from "../../common/middleware/auth/auth";

const OTP_TTL_SECONDS = 600;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

class AuthService {
  private userRepository: authRepository;

  constructor() {
    this.userRepository = new authRepository();
  }

  private sanitizeUser(user: any) {
    const plain =
      typeof user?.toObject === "function" ? user.toObject() : { ...user };
    delete plain.password;
    return plain;
  }

  private otpKey(email: string) {
    return `otp:${email.trim().toLowerCase()}`;
  }

  private otpAttemptsKey(email: string) {
    return `otp_attempts:${email.trim().toLowerCase()}`;
  }

  private otpCooldownKey(email: string) {
    return `otp_cooldown:${email.trim().toLowerCase()}`;
  }

  private forgotOtpKey(email: string) {
    return `FORGOT_PASSWORD_OTP:${email.trim().toLowerCase()}`;
  }

  private forgotOtpAttemptsKey(email: string) {
    return `FORGOT_PASSWORD_OTP_ATTEMPTS:${email.trim().toLowerCase()}`;
  }

  private forgotResetTokenKey(email: string) {
    return `FORGOT_PASSWORD_RESET:${email.trim().toLowerCase()}`;
  }

  private async issueOtp(email: string, name?: string) {
    const otp = otpGenerator();
    const hashedOtp = await hashWord(String(otp));
    const normalizedEmail = email.trim().toLowerCase();

    await redisService.setData(this.otpKey(normalizedEmail), hashedOtp, OTP_TTL_SECONDS);
    await redisService.deleteData(this.otpAttemptsKey(normalizedEmail));
    await redisService.setData(
      this.otpCooldownKey(normalizedEmail),
      "1",
      OTP_RESEND_COOLDOWN_SECONDS,
    );

    await sendEmail({
      to: normalizedEmail,
      subject: "Verify your Nexa account",
      text: `${name ? `Hello ${name},\n\n` : ""}Your Nexa verification code is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`,
      html: `
        <div style="margin:0; padding:40px 20px; background:#0f172a; font-family:Arial, Helvetica, sans-serif;">
          <div style="max-width:520px; margin:0 auto;">
            <div style="text-align:center; margin-bottom:20px;">
              <h1 style="margin:0; color:#6366f1; font-size:32px; font-weight:800;">Nexa</h1>
              <p style="margin:8px 0 0; color:#94a3b8; font-size:14px;">Connect. Share. Stay Nexa.</p>
            </div>

            <div style="background:#1e293b; border:1px solid #334155; border-radius:20px; padding:40px 35px; box-shadow:0 20px 50px rgba(0,0,0,0.35);">
              ${name ? `<h2 style="margin:0 0 12px; color:#f8fafc; font-size:24px;">Hello ${name} 👋</h2>` : `<h2 style="margin:0 0 12px; color:#f8fafc; font-size:24px;">Verify your account</h2>`}
              <p style="margin:0 0 28px; color:#94a3b8; font-size:15px; line-height:1.7;">Use the verification code below to verify your Nexa account.</p>

              <div style="background:#0f172a; border:1px solid #4f46e5; border-radius:14px; padding:22px 15px; text-align:center; margin:0 0 25px;">
                <div style="color:#a5b4fc; font-size:12px; text-transform:uppercase; letter-spacing:3px; margin-bottom:10px;">Verification Code</div>
                <div style="color:#ffffff; font-size:34px; font-weight:800; letter-spacing:10px;">${otp}</div>
              </div>

              <p style="margin:0; text-align:center; color:#94a3b8; font-size:14px;">This code will expire in <strong style="color:#a5b4fc;">10 minutes</strong>.</p>

              <div style="height:1px; background:#334155; margin:30px 0;"></div>

              <p style="margin:0; color:#64748b; font-size:12px; line-height:1.6; text-align:center;">If you didn't request this code, you can safely ignore this email.</p>
            </div>

            <p style="margin:20px 0 0; text-align:center; color:#475569; font-size:12px;">© Nexa. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  }

  private async issueResetPasswordOtp(email: string) {
    const otp = otpGenerator();
    const hashedOtp = await hashWord(String(otp));
    const normalizedEmail = email.trim().toLowerCase();

    await redisService.setData(this.forgotOtpKey(normalizedEmail), hashedOtp, OTP_TTL_SECONDS);
    await redisService.deleteData(this.forgotOtpAttemptsKey(normalizedEmail));
    await redisService.setData(
      this.otpCooldownKey(normalizedEmail),
      "1",
      OTP_RESEND_COOLDOWN_SECONDS,
    );

    await sendEmail({
      to: normalizedEmail,
      subject: "Reset your Nexa password",
      text: `Your Nexa password reset OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request a password reset, you can safely ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 32px 28px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; color: #0f172a;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
            <div style="width: 28px; height: 28px; border-radius: 8px; background: #2563eb; display: inline-flex; align-items: center; justify-content: center; color: #ffffff; font-size: 14px; font-weight: 700;">N</div>
            <span style="font-size: 20px; font-weight: 800; color: #2563eb; letter-spacing: -0.4px;">Nexa</span>
          </div>
          <h2 style="margin: 0 0 12px; color: #0f172a;">Reset your password</h2>
          <p style="margin: 0 0 18px; color: #475569;">Your Nexa password reset OTP is:</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; margin: 20px 0 24px; color: #2563eb;">${otp}</div>
          <p style="margin: 0 0 10px; color: #475569;">This OTP will expire in <strong>10 minutes</strong>.</p>
          <p style="margin: 0; color: #64748b; font-size: 13px;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });
  }

  async signUp(data: IUser, profileImage?: string) {
    const {
      username,
      firstName,
      unique_name,
      email,
      password,
      phoneNumber,
      age,
      gender,
    } = data;

    const normalizedUsername = username?.trim() || firstName?.trim();
    const normalizedUniqueName =
      unique_name?.trim() || normalizedUsername?.replace(/\s+/g, "_");

    if (!normalizedUsername || !normalizedUniqueName || !email || !password) {
      throw new BadRequestException("Missing required fields");
    }

    const isUserExist = await this.userRepository.findOne({
      filter: {
        $or: [{ email }, { unique_name: normalizedUniqueName }],
      },
    });

    if (isUserExist) {
      throw new ConflictException("User already exists");
    }

    const [first, ...rest] = normalizedUsername.split(/\s+/);
    const hashedPassword = await hashWord(password);

    const user = await this.userRepository.create({
      username: normalizedUsername,
      firstName: first || "",
      lastName: rest.join(" "),
      email,
      password: hashedPassword,
      phoneNumber,
      age,
      unique_name: normalizedUniqueName,
      gender,
      profileImage,
      confirmEmail: false,
    } as IUser);

    await this.issueOtp(email, normalizedUsername);

    return {
      success: true,
      message: "Account created successfully. Please verify your email.",
      user: this.sanitizeUser(user),
    };
  }

  async login(data: any): Promise<any> {
    const { email, password } = data;

    if (!email || !password) {
      throw new BadRequestException("Please enter all data");
    }

    const user = await this.userRepository.findOne({
      filter: { email },
    });

    if (!user || !user.password) {
      throw new BadRequestException("Invalid email");
    }

    const isPasswordMatch = await compareWord(password, user.password);

    if (!isPasswordMatch) {
      throw new BadRequestException("Invalid password");
    }

    if (!user.confirmEmail) {
      throw new BadRequestException("User not verified");
    }

    const tokens = await TokenService.generateToken(
      {
        id: user._id.toString(),
        email: user.email,
      },
      user.role,
    );

    return {
      success: true,
      message: "Login success",
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async verifyUser(data: any) {
    const { email, otp } = data;

    if (!email || !otp) {
      throw new BadRequestException("Please enter all data");
    }

    const user = await this.userRepository.findOne({
      filter: { email },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const storedOtp = await redisService.getData(this.otpKey(email));

    if (!storedOtp) {
      throw new BadRequestException("OTP has expired or is invalid");
    }

    const attemptsKey = this.otpAttemptsKey(email);
    const attempts = Number((await redisService.getData(attemptsKey)) || 0);

    if (attempts >= OTP_MAX_ATTEMPTS) {
      await redisService.deleteData(this.otpKey(email));
      await redisService.deleteData(attemptsKey);
      throw new BadRequestException(
        "Too many failed attempts. Please request a new OTP",
      );
    }

    const isOtpMatch = await compareWord(String(otp), storedOtp);

    if (!isOtpMatch) {
      await redisService.setData(
        attemptsKey,
        String(attempts + 1),
        OTP_TTL_SECONDS,
      );
      throw new BadRequestException("Invalid OTP");
    }

    await this.userRepository.findOneAndUpdate({
      filter: { email },
      data: { confirmEmail: true },
    });

    await redisService.deleteData(this.otpKey(email));
    await redisService.deleteData(attemptsKey);

    return {
      success: true,
      message: "Account verified successfully",
    };
  }

  async resendOtp(data: any) {
    const { email } = data;

    if (!email) {
      throw new BadRequestException("Email is required");
    }

    const user = await this.userRepository.findOne({
      filter: { email },
    });

    if (!user) {
      throw new NotFoundException("Account does not exist");
    }

    if (user.confirmEmail) {
      throw new BadRequestException("Account already verified");
    }

    const onCooldown = await redisService.getData(this.otpCooldownKey(email));

    if (onCooldown) {
      throw new BadRequestException(
        "Please wait a minute before requesting another OTP",
      );
    }

    await this.issueOtp(email, user.username || user.firstName || undefined);

    return {
      success: true,
      message: "OTP resent successfully",
    };
  }

  async forgotPassword(data: any) {
    const email = String(data?.email || "").trim().toLowerCase();

    if (!email) {
      throw new BadRequestException("Email is required");
    }

    const user = await this.userRepository.findOne({
      filter: { email },
    });

    if (user) {
      const cooldown = await redisService.getData(this.otpCooldownKey(email));
      if (!cooldown) {
        await this.issueResetPasswordOtp(email);
      }
    }

    return {
      success: true,
      message: "If an account exists for this email, a reset code has been sent.",
    };
  }

  async verifyResetOtp(data: any) {
    const email = String(data?.email || "").trim().toLowerCase();
    const otp = String(data?.otp || "").trim();

    if (!email || !otp) {
      throw new BadRequestException("Please enter all data");
    }

    const user = await this.userRepository.findOne({
      filter: { email },
    });

    if (!user) {
      throw new BadRequestException("Invalid or expired reset code");
    }

    const storedOtpHash = await redisService.getData(this.forgotOtpKey(email));
    if (!storedOtpHash) {
      throw new BadRequestException("Invalid or expired reset code");
    }

    const attemptsKey = this.forgotOtpAttemptsKey(email);
    const attempts = Number((await redisService.getData(attemptsKey)) || 0);

    if (attempts >= OTP_MAX_ATTEMPTS) {
      await redisService.deleteData(this.forgotOtpKey(email));
      await redisService.deleteData(attemptsKey);
      throw new BadRequestException(
        "Too many failed attempts. Please request a new reset code.",
      );
    }

    const isOtpMatch = await compareWord(otp, storedOtpHash);
    if (!isOtpMatch) {
      await redisService.setData(attemptsKey, String(attempts + 1), OTP_TTL_SECONDS);
      throw new BadRequestException("Invalid OTP");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = await hashWord(resetToken);

    await redisService.setData(
      this.forgotResetTokenKey(email),
      hashedResetToken,
      OTP_TTL_SECONDS,
    );
    await redisService.deleteData(this.forgotOtpKey(email));
    await redisService.deleteData(attemptsKey);

    return {
      success: true,
      message: "OTP verified successfully",
      resetToken,
    };
  }

  async resetPassword(data: any) {
    const email = String(data?.email || "").trim().toLowerCase();
    const resetToken = String(data?.resetToken || "").trim();
    const newPassword = String(data?.newPassword || "");
    const confirmPassword = String(data?.confirmPassword || "");

    if (!email || !resetToken || !newPassword || !confirmPassword) {
      throw new BadRequestException("Please enter all data");
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    const user = await this.userRepository.findOne({
      filter: { email },
    });

    if (!user) {
      throw new BadRequestException("This reset link is invalid or has expired");
    }

    const storedHash = await redisService.getData(this.forgotResetTokenKey(email));
    if (!storedHash) {
      throw new BadRequestException("This reset link is invalid or has expired");
    }

    const isTokenMatch = await compareWord(resetToken, storedHash);
    if (!isTokenMatch) {
      throw new BadRequestException("This reset link is invalid or has expired");
    }

    const hashedPassword = await hashWord(newPassword);
    await this.userRepository.findOneAndUpdate({
      filter: { email },
      data: { password: hashedPassword },
    });

    await redisService.deleteData(this.forgotResetTokenKey(email));

    return {
      success: true,
      message: "Password reset successfully",
    };
  }

  async googleAuth(body: any) {
    if (!env.googleClientId) {
      throw new BadRequestException("GOOGLE_CLIENT_ID is not defined");
    }

    const token = body.credential || body.idToken;

    if (!token) {
      throw new BadRequestException("Google credential is required");
    }

    const client = new OAuth2Client();

    let payload: any;

    try {
      // Try as ID token first
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: env.googleClientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      // If it fails, assume it's an access token and fetch userinfo
      try {
        const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new BadRequestException("Invalid Google token");
        }
        payload = await response.json();
      } catch (fetchErr) {
        throw new BadRequestException("Invalid Google token");
      }
    }

    if (!payload) {
      throw new BadRequestException("Invalid Google token");
    }

    // Google's userinfo endpoint returns `email_verified` as boolean
    if (payload.email_verified === false || payload.email_verified === "false") {
      throw new BadRequestException("Email not verified");
    }

    const { email, name, picture, given_name, family_name } = payload;

    if (!email) {
      throw new BadRequestException("Google account email not found");
    }

    const existUser = await this.userRepository.findOne({
      filter: { email },
    });

    if (existUser) {
      if (existUser.provider === providerEnum.SYSTEM) {
        throw new ConflictException("Email is already registered with email/password authentication");
      }

      const tokens = await TokenService.generateToken(
        {
          id: (existUser as IUser & { _id: string })._id.toString(),
          email: existUser.email,
        },
        existUser.role,
      );

      return {
        success: true,
        message: "Google login successful",
        ...tokens,
        user: this.sanitizeUser(existUser),
      };
    }

    const username = name?.trim() || email.split("@")[0] || "Google User";
    const first = given_name || username.split(/\s+/)[0] || "Google";
    const rest = family_name || username.split(/\s+/).slice(1).join(" ");
    
    let unique_name = `${email.split("@")[0] || "google-user"}_${Math.floor(Math.random() * 10000)}`;
    
    while (await this.userRepository.findOne({ filter: { unique_name } })) {
      unique_name = `${email.split("@")[0] || "google-user"}_${Math.floor(Math.random() * 100000)}`;
    }

    const addUser = await this.userRepository.create({
      username,
      firstName: first,
      lastName: rest,
      unique_name,
      email,
      password: "",
      profileImage: picture,
      provider: providerEnum.GOOGLE,
      confirmEmail: true,
    } as IUser);

    const tokens = await TokenService.generateToken(
      {
        id: (addUser as IUser & { _id: string })._id.toString(),
        email: addUser.email,
      },
      addUser.role,
    );

    return {
      success: true,
      message: "Google authentication successful",
      ...tokens,
      user: this.sanitizeUser(addUser),
    };
  }

  async logout(req: any): Promise<any> {
    await TokenService.revokeToken(req.token);

    return {
      success: true,
      message: "Logout successfully",
    };
  }
}

export default new AuthService();
