import { api } from "./axios";
import { unwrap } from "@/types/api";
import type { LoginPayload, SignupPayload, User } from "@/types/user";

// Endpoints and field names follow the spec exactly. Do not rename.

export async function login(payload: LoginPayload) {
  const res = await api.post("/auth/login", payload);
  return unwrap<{ token?: string; accessToken?: string; user?: User } & Record<string, unknown>>(
    res.data
  );
}

export async function googleLogin(payload: { credential?: string; idToken?: string }) {
  const res = await api.post("/auth/google", payload);
  return unwrap<{ token?: string; accessToken?: string; user?: User } & Record<string, unknown>>(
    res.data
  );
}

export async function signup(payload: SignupPayload) {
  const formData = new FormData();
  formData.append("username", payload.username);
  formData.append("unique_name", payload.uniqueName);
  formData.append("email", payload.email);
  formData.append("password", payload.password);
  formData.append("age", String(payload.age));
  formData.append("phoneNumber", payload.phoneNumber);
  formData.append("gender", payload.gender);
  if (payload.profileImage) {
    formData.append("profileImage", payload.profileImage);
  }
  const res = await api.post("/auth/signup", formData);
  return unwrap(res.data);
}

export async function verifyAccount(payload: { email: string; otp: string }) {
  const res = await api.post("/auth/verifyAccount", payload);
  return unwrap(res.data);
}

export async function resendOtp(payload: { email: string }) {
  const res = await api.post("/auth/resendOtp", payload);
  return unwrap(res.data);
}

export async function forgotPassword(payload: { email: string }) {
  const res = await api.post("/auth/forgot-password", payload);
  return unwrap(res.data);
}

export async function verifyResetOtp(payload: { email: string; otp: string }) {
  const res = await api.post("/auth/verify-reset-otp", payload);
  return unwrap<{ success: boolean; message: string; resetToken?: string }>(res.data);
}

export async function resetPassword(payload: { email: string; resetToken: string; newPassword: string; confirmPassword: string }) {
  const res = await api.post("/auth/reset-password", payload);
  return unwrap(res.data);
}

export async function logout() {
  const res = await api.post("/auth/logout");
  return unwrap(res.data);
}
