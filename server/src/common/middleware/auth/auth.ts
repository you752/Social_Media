import jwt from "jsonwebtoken";
import { env } from "../../../config/env.service";
import { userModel } from "../../../database/model/user.model";
import { clientRedius } from "../../../database/connenctionRedius";
import { NextFunction, Request, Response } from "express";
import { UserRoleEnum } from "../../index";
import { ApplicationException, ForbiddenException } from "../../exception/error.responce";

type Role = (typeof UserRoleEnum)[keyof typeof UserRoleEnum];

interface ITokenPayload {
  id: string;
  email: string;
}

type VerifiedPayload = jwt.JwtPayload & ITokenPayload;

export class TokenService {
  private static readonly ACCESS_EXPIRES_IN = "1h";
  private static readonly REFRESH_EXPIRES_IN = "1y";
  private static readonly BLACKLIST_PREFIX = "BL:";

  private static readonly SIGNATURES: Record<Role, string | undefined> = {
    [UserRoleEnum.USER]: env.userSignature,
    [UserRoleEnum.ADMIN]: env.adminSignature,
  };

  private static readonly REFRESH_SIGNATURES: Record<Role, string | undefined> =
    {
      [UserRoleEnum.USER]: env.userRefreshSignature,
      [UserRoleEnum.ADMIN]: env.adminRefreshSignature,
    };

  // ---------- helpers ----------

  private static getAccessSignature(role: Role): string {
    const signature = this.SIGNATURES[role];
    if (!signature) throw new Error("Invalid role or missing signature");
    return signature;
  }

  private static getRefreshSignature(role: Role): string {
    const signature = this.REFRESH_SIGNATURES[role];
    if (!signature) throw new Error("Invalid role or missing signature");
    return signature;
  }

  // ---------- token creation ----------

  static async generateToken(
    payload: ITokenPayload,
    role: Role = UserRoleEnum.USER,
  ) {
    const accessSignature = this.getAccessSignature(role);
    const refreshSignature = this.getRefreshSignature(role);

    const accessToken = jwt.sign(payload, accessSignature, {
      expiresIn: this.ACCESS_EXPIRES_IN,
      audience: String(role),
    });

    const refreshToken = jwt.sign(payload, refreshSignature, {
      expiresIn: this.REFRESH_EXPIRES_IN,
      audience: String(role),
    });

    return { accessToken, refreshToken };
  }

  static async generateAccessToken(refreshToken: string) {
    const decoded = jwt.decode(refreshToken);

    if (!decoded || typeof decoded === "string" || decoded.aud === undefined) {
      throw new Error("Invalid refresh token");
    }

    const role = Number(decoded.aud) as Role;

    if (role !== UserRoleEnum.USER && role !== UserRoleEnum.ADMIN) {
      throw new Error("Invalid role");
    }

    const verified = await this.verifyRefreshToken(refreshToken, role);
    const signature = this.getAccessSignature(role);

    const accessToken = jwt.sign(
      { id: verified.id, email: verified.email },
      signature,
      {
        expiresIn: this.ACCESS_EXPIRES_IN,
        audience: String(role),
      },
    );

    return { accessToken };
  }

  // ---------- token verification ----------

  static async verifyAccessToken(
    token: string,
    role: Role = UserRoleEnum.USER,
  ): Promise<VerifiedPayload> {
    const signature = this.getAccessSignature(role);
    return jwt.verify(token, signature) as VerifiedPayload;
  }

  static async verifyRefreshToken(
    token: string,
    role: Role = UserRoleEnum.USER,
  ): Promise<VerifiedPayload> {
    const signature = this.getRefreshSignature(role);
    return jwt.verify(token, signature) as VerifiedPayload;
  }

  // ---------- revocation ----------

  static async revokeToken(token: string) {
    const decoded = jwt.decode(token);

    if (!decoded || typeof decoded === "string" || !decoded.exp) {
      throw new Error("Invalid token");
    }

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      await clientRedius.set(`${this.BLACKLIST_PREFIX}${token}`, "revoked", {
        EX: ttl,
      });
    }

    return true;
  }

  static async isRevoked(token: string): Promise<boolean> {
    const result = await clientRedius.get(`${this.BLACKLIST_PREFIX}${token}`);
    return Boolean(result);
  }

  // ---------- middleware ----------

  static auth(role: Role = UserRoleEnum.USER) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { authorization } = req.headers;

        if (!authorization) {
          throw new Error("Authorization header is required");
        }

        const [bearer, token] = authorization.split(" ");

        if (bearer !== "Bearer" || !token) {
          throw new Error("Invalid authorization format");
        }

        if (await TokenService.isRevoked(token)) {
          throw new Error("Token has been revoked");
        }

        const decoded = await TokenService.verifyAccessToken(token, role);

        const user = await userModel.findById(decoded.id);

        if (!user) {
          throw new Error("User not found");
        }

        if (user.isBlocked) {
          throw new ForbiddenException("Your account is blocked");
        }

        req.user = user;
        req.token = token;

        next();
      } catch (error) {
        const status = error instanceof ApplicationException ? error.status : 401;
        return res.status(status).json({
          success: false,
          message: error instanceof Error ? error.message : "Unauthorized",
        });
      }
    };
  }
}

export const auth = TokenService.auth.bind(TokenService);

export const admin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== UserRoleEnum.ADMIN) {
    return res.status(403).json({
      success: false,
      message: "Administrator access is required",
    });
  }
  next();
};
