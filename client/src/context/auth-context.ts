import { createContext } from "react";
import type { LoginPayload, SignupPayload, User } from "@/types/user";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  googleLogin: (payload: { credential?: string; idToken?: string }) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<{ email?: string }>;
  verifyAccount: (payload: { email: string; otp: string }) => Promise<void>;
  resendOtp: (payload: { email: string }) => Promise<void>;
  forgotPassword: (payload: { email: string }) => Promise<void>;
  verifyResetOtp: (payload: { email: string; otp: string }) => Promise<{ resetToken?: string }>;
  resetPassword: (payload: { email: string; resetToken: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
