import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import { PageSpinner } from "@/components/common/Spinner";
import { PasswordField } from "@/components/PasswordField";
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
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={(value) => { setCurrentPassword(value); setPasswordError(""); }}
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={(value) => { setNewPassword(value); setPasswordError(""); }}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm new password"
            value={confirmNewPassword}
            onChange={(value) => { setConfirmNewPassword(value); setPasswordError(""); }}
            autoComplete="new-password"
          />
          {passwordMessages.length > 0 && (
            <ul className="settings-password-validation" aria-live="polite">
              {passwordMessages.map((message) => <li key={message}>{message}</li>)}
            </ul>
          )}
          {passwordError && <p className="form-error" role="alert">{passwordError}</p>}
          {confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && (
            <p className="password-match-error" role="alert">Passwords do not match.</p>
          )}
          <Button type="submit" fullWidth loading={changingPassword} disabled={!passwordValid || changingPassword}>
            {changingPassword ? "Changing password..." : "Change password"}
          </Button>
        </form>
      </section>
    </div>
  );
}
