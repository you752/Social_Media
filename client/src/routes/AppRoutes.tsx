import { Routes, Route } from "react-router-dom";
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from "./ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { VerifyAccountPage } from "@/pages/auth/VerifyAccountPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { VerifyResetOtpPage } from "@/pages/auth/VerifyResetOtpPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { HomePage } from "@/pages/home/HomePage";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { UsersPage } from "@/pages/users/UsersPage";
import { FriendsPage } from "@/pages/friends/FriendsPage";
import { FriendRequestsPage } from "@/pages/friends/FriendRequestsPage";
import { ChatPage } from "@/pages/chat/ChatPage";
import { NotFoundPage } from "@/pages/not-found/NotFoundPage";
import { AdminShell } from "@/components/admin/AdminShell";
import { BookmarksPage } from "@/pages/bookmarks/BookmarksPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { AdminDashboardPage, AdminResourcePage } from "@/pages/admin/AdminPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-account" element={<VerifyAccountPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminShell />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminResourcePage resource="users" />} />
          <Route path="/admin/posts" element={<AdminResourcePage resource="posts" />} />
          <Route path="/admin/comments" element={<AdminResourcePage resource="comments" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/friend-requests" element={<FriendRequestsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:userId" element={<ChatPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
