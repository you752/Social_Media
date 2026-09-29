import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { AuthLayout } from "@/components/common/AuthLayout";
import { getApiErrorMessage } from "@/api/axios";
import { useAuth } from "@/hooks/useAuth";
import { UserRoleEnum } from "@/types/user";

export function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    try {
      const user = await login({ email, password });
      if (Number(user.role) !== UserRoleEnum.ADMIN) {
        setError("Admin access required");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card auth-split-card">
        <h1>Admin sign in</h1>
        <p className="auth-subtitle">Sign in with an administrator account.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
          />
          <div className="password-field">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <Button type="submit" fullWidth loading={loading}>
            Sign in to admin
          </Button>
        </form>

        <p className="auth-footer">
          Not an administrator? <Link to="/login">Go to user login</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
