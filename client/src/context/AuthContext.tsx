import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@/api/auth.api";
import * as userApi from "@/api/user.api";
import { registerUnauthorizedHandler, getApiErrorMessage } from "@/api/axios";
import { tokenStorage } from "@/utils/storage";
import { connectSocket, disconnectSocket } from "@/services/socket";
import type { LoginPayload, SignupPayload, User } from "@/types/user";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await userApi.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
      tokenStorage.clear();
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = tokenStorage.get();
      if (token) {
        await refreshProfile();
        connectSocket();
      }
      setLoading(false);
    })();
  }, [refreshProfile]);

  const handleUnauthorized = useCallback(() => {
    tokenStorage.clear();
    disconnectSocket();
    setUser(null);
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(handleUnauthorized);
  }, [handleUnauthorized]);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authApi.login(payload);
    const token =
      (result as Record<string, unknown>)?.token ||
      (result as Record<string, unknown>)?.accessToken;
    if (typeof token === "string") {
      tokenStorage.set(token);
    }
    if ((result as Record<string, unknown>)?.user) {
      setUser((result as { user: User }).user);
    } else {
      await refreshProfile();
    }
    connectSocket();
  }, [refreshProfile]);

  const googleLogin = useCallback(async (payload: { credential?: string; idToken?: string }) => {
    const result = await authApi.googleLogin(payload);
    const token =
      (result as Record<string, unknown>)?.token ||
      (result as Record<string, unknown>)?.accessToken;
    if (typeof token === "string") {
      tokenStorage.set(token);
    }
    if ((result as Record<string, unknown>)?.user) {
      setUser((result as { user: User }).user);
    } else {
      await refreshProfile();
    }
    connectSocket();
  }, [refreshProfile]);

  const signup = useCallback(async (payload: SignupPayload) => {
    const result = await authApi.signup(payload);
    return { email: (result as Record<string, unknown>)?.email as string | undefined || payload.email };
  }, []);

  const verifyAccount = useCallback(async (payload: { email: string; otp: string }) => {
    await authApi.verifyAccount(payload);
  }, []);

  const resendOtp = useCallback(async (payload: { email: string }) => {
    await authApi.resendOtp(payload);
  }, []);

  const forgotPassword = useCallback(async (payload: { email: string }) => {
    await authApi.forgotPassword(payload);
  }, []);

  const verifyResetOtp = useCallback(async (payload: { email: string; otp: string }) => {
    const result = await authApi.verifyResetOtp(payload);
    return { resetToken: (result as Record<string, unknown>)?.resetToken as string | undefined };
  }, []);

  const resetPassword = useCallback(async (payload: { email: string; resetToken: string; newPassword: string; confirmPassword: string }) => {
    await authApi.resetPassword(payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Even if the server call fails, clear local state so the user is
      // not stuck logged in on the client.
      console.warn(getApiErrorMessage(err));
    } finally {
      tokenStorage.clear();
      disconnectSocket();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      googleLogin,
      signup,
      verifyAccount,
      resendOtp,
      forgotPassword,
      verifyResetOtp,
      resetPassword,
      logout,
      refreshProfile,
      setUser,
    }),
    [user, loading, login, googleLogin, signup, verifyAccount, resendOtp, forgotPassword, verifyResetOtp, resetPassword, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
