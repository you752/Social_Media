import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserRound } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/api/axios";
import { NexaBrand } from "@/components/common/NexaBrand";
import { ImagePicker } from "@/components/common/ImagePicker";

// Custom Google SVG icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export function SignupPage() {
  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    uniqueName: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    phoneNumber: "",
    gender: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (googleLoading) return;
      setGoogleLoading(true);
      setError("");
      try {
        await googleLogin({ credential: tokenResponse.access_token });
        navigate("/", { replace: true });
      } catch (err) {
        setError(getApiErrorMessage(err, "Google authentication failed"));
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError("Google authentication failed");
    },
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.gender) {
      setError("Please select a gender.");
      return;
    }

    setLoading(true);
    try {
      // confirmPassword is intentionally never sent to the backend.
      const result = await signup({
        username: form.username,
        uniqueName: form.uniqueName,
        email: form.email,
        password: form.password,
        age: form.age,
        phoneNumber: form.phoneNumber,
        gender: form.gender,
        profileImage,
      });
      navigate("/verify-account", { state: { email: result.email } });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create your account"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <NexaBrand className="auth-brand" />
        <h1>Join Nexa</h1>
        <p className="auth-subtitle">Create your account and start connecting.</p>

        <Button 
          type="button" 
          variant="secondary" 
          fullWidth 
          loading={googleLoading} 
          onClick={() => loginWithGoogle()}
          className="google-auth-btn"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px", background: "#fff", color: "#333", border: "1px solid #ccc" }}
        >
          {!googleLoading && <GoogleIcon />}
          Continue with Google
        </Button>

        <div style={{ display: "flex", alignItems: "center", color: "#888", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "#334155" }}></div>
          <span style={{ padding: "0 10px", fontSize: "14px" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "#334155" }}></div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <ImagePicker onSelected={(file, imagePreview) => {
            setProfileImage(file);
            setPreview(imagePreview);
          }}>
            {preview ? <img src={preview} alt="Profile preview" /> : <UserRound size={28} />}
            <span>Upload photo</span>
          </ImagePicker>

          <div className="form-grid">
            <Input label="Username" required value={form.username} onChange={(e) => update("username", e.target.value)} hint="e.g. Youssef Ahmed" />
            <Input label="Unique username" required value={form.uniqueName} onChange={(e) => update("uniqueName", e.target.value)} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
            <Input label="Phone number" type="tel" required value={form.phoneNumber} onChange={(e) => update("phoneNumber", e.target.value)} />
            <Input label="Age" type="number" required min={1} value={form.age} onChange={(e) => update("age", e.target.value)} />
            <div className="field">
              <label className="field-label">Gender</label>
              <select className="field-input" required value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="password-field">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Input
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            required
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
          />

          {error && <p className="form-error">{error}</p>}

          <Button type="submit" fullWidth loading={loading}>Sign up</Button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
