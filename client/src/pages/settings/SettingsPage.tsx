import { useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { PageSpinner } from "@/components/common/Spinner";
import { getApiErrorMessage } from "@/api/axios";
import * as userApi from "@/api/user.api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

interface Settings {
  notifications: boolean;
  privateAccount: boolean;
}

export function SettingsPage() {
  const { changePassword } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState([false, false, false]);
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const { showToast } = useToast();

  const passwordMessages = [
    ...(newPassword.length > 0 && newPassword.length < 8
      ? ["Use at least 8 characters."]
      : []),
    ...(newPassword.length > 0 && !/[A-Za-z]/.test(newPassword)
      ? ["Include at least one letter."]
      : []),
    ...(newPassword.length > 0 && !/\d/.test(newPassword)
      ? ["Include at least one number."]
      : []),
    ...(newPassword.length > 0 && newPassword === currentPassword
      ? ["New password must differ from your current password."]
      : []),
    ...(confirmNewPassword.length > 0 && newPassword !== confirmNewPassword
      ? ["Passwords do not match."]
      : []),
  ];
  const passwordValid =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    /[A-Za-z]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    newPassword !== currentPassword &&
    newPassword === confirmNewPassword;

  useEffect(() => {
    userApi.getUserSettings()
      .then((data) => setSettings({
        notifications: Boolean(data.notifications),
        privateAccount: Boolean(data.privateAccount),
      }))
      .catch((err) => setError(getApiErrorMessage(err, "Could not load settings")));
  }, []);

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await userApi.updateUserSettings(settings);
      setSettings({ notifications: Boolean(updated.notifications), privateAccount: Boolean(updated.privateAccount) });
      showToast("Settings updated", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not update settings"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function submitPasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordValid || changingPassword) return;

    setChangingPassword(true);
    setPasswordError("");
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      showToast("Password changed successfully", "success");
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, "Could not change password"));
    } finally {
      setChangingPassword(false);
    }
  }

  function togglePasswordVisibility(index: number) {
    setShowPasswords((current) => current.map((shown, item) => item === index ? !shown : shown));
  }

  if (!settings && !error) return <PageSpinner />;

  return (
    <div className="settings-page">
      <h2 className="section-title">Settings</h2>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="card settings-section">
        <h3>Notifications</h3>
        <label className="settings-option">
          <input type="checkbox" checked={settings?.notifications ?? false} disabled={!settings} onChange={(e) => setSettings((current) => current && ({ ...current, notifications: e.target.checked }))} />
          <span>Allow notifications</span>
        </label>
      </div>
      <div className="card settings-section">
        <h3>Privacy</h3>
        <label className="settings-option">
          <input type="checkbox" checked={settings?.privateAccount ?? false} disabled={!settings} onChange={(e) => setSettings((current) => current && ({ ...current, privateAccount: e.target.checked }))} />
          <span>Private account</span>
        </label>
      </div>
      <Button onClick={saveSettings} loading={saving} disabled={!settings}>Save settings</Button>
      <section className="card settings-section settings-security">
        <div className="settings-security-heading">
          <ShieldCheck size={20} />
          <div>
            <h3>Security</h3>
            <p>Change your password to keep your account secure.</p>
          </div>
        </div>
        <form className="settings-password-form" onSubmit={submitPasswordChange}>
          {[
            {
              label: "Current password",
              value: currentPassword,
              setValue: setCurrentPassword,
              autoComplete: "current-password",
            },
            {
              label: "New password",
              value: newPassword,
              setValue: setNewPassword,
              autoComplete: "new-password",
            },
            {
              label: "Confirm new password",
              value: confirmNewPassword,
              setValue: setConfirmNewPassword,
              autoComplete: "new-password",
            },
          ].map((field, index) => (
            <div className="settings-password-field" key={field.label}>
              <Input
                label={field.label}
                type={showPasswords[index] ? "text" : "password"}
                value={field.value}
                onChange={(event) => {
                  field.setValue(event.target.value);
                  setPasswordError("");
                }}
                autoComplete={field.autoComplete}
                required
              />
              <button
                type="button"
                className="password-toggle settings-password-toggle"
                onClick={() => togglePasswordVisibility(index)}
                aria-label={`${showPasswords[index] ? "Hide" : "Show"} ${field.label.toLowerCase()}`}
                aria-pressed={showPasswords[index]}
              >
                {showPasswords[index] ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          ))}
          {passwordMessages.length > 0 && (
            <ul className="settings-password-validation" aria-live="polite">
              {passwordMessages.map((message) => <li key={message}>{message}</li>)}
            </ul>
          )}
          {passwordError && <p className="form-error" role="alert">{passwordError}</p>}
          <Button type="submit" loading={changingPassword} disabled={!passwordValid || changingPassword}>
            {changingPassword ? "Changing password..." : "Change password"}
          </Button>
        </form>
      </section>
    </div>
  );
}
