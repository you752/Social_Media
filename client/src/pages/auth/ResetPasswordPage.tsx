import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { NexaBrand } from "@/components/common/NexaBrand";
import { getApiErrorMessage } from "@/api/axios";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const state = location.state as { email?: string; resetToken?: string } | null;
  const [email, setEmail] = useState(state?.email ?? "");
  const [resetToken, setResetToken] = useState(state?.resetToken ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email || !resetToken) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate, resetToken]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !resetToken || loading) return;

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword({
        email,
        resetToken,
        newPassword,
        confirmPassword,
      });

      showToast("Password reset successfully. Please log in.", "success");
      navigate("/login", {
        replace: true,
        state: { message: "Password reset successfully. Please login with your new password." },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to reset your password right now."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <NexaBrand className="auth-brand" />
        <h1>Set new password</h1>
        <p className="auth-subtitle">Create a strong password for your Nexa account.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="password-field">
            <Input
              label="New password"
              type={showNewPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowNewPassword((value) => !value)}
              tabIndex={-1}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="password-field">
            <Input
              label="Confirm password"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((value) => !value)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="form-error">{error}</p>}

          <Button type="submit" fullWidth loading={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </form>

        <div className="auth-footer auth-link-row">
          <Link className="auth-link" to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
