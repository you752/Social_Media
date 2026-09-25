import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { NexaBrand } from "@/components/common/NexaBrand";
import { getApiErrorMessage } from "@/api/axios";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      await forgotPassword({ email: email.trim() });
      setSuccess(true);
      showToast("A reset code has been sent to your email", "success");
      window.setTimeout(() => {
        navigate("/verify-reset-otp", { state: { email: email.trim() } });
      }, 600);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to send a reset code right now."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card otp-card">
        <NexaBrand className="auth-brand" />

        {success ? (
          <div className="otp-success-state" aria-live="polite">
            <div className="otp-success-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5 9.5 17 19 7.5" />
              </svg>
            </div>
            <h1>Reset Link Sent</h1>
            <p className="auth-subtitle">We’ve sent a 6-digit reset code to your email.</p>
          </div>
        ) : (
          <>
            <h1>Forgot password</h1>
            <p className="auth-subtitle">Enter the email tied to your Nexa account.</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />

              {error && <p className="form-error">{error}</p>}

              <Button type="submit" fullWidth loading={loading}>
                {loading ? "Sending..." : "Send reset code"}
              </Button>
            </form>

            <div className="auth-footer auth-link-row">
              <Link className="auth-link" to="/login">Back to login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
