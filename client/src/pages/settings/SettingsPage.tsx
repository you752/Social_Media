import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { PageSpinner } from "@/components/common/Spinner";
import { getApiErrorMessage } from "@/api/axios";
import * as userApi from "@/api/user.api";
import { useToast } from "@/hooks/useToast";

interface Settings {
  notifications: boolean;
  privateAccount: boolean;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

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

  if (!settings && !error) return <PageSpinner />;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <div className="settings-page">
      <h2 className="section-title">Settings</h2>
      <div className="card settings-section">
        <h3>Notifications</h3>
        <label className="settings-option">
          <input type="checkbox" checked={settings?.notifications ?? false} onChange={(e) => setSettings((current) => current && ({ ...current, notifications: e.target.checked }))} />
          <span>Allow notifications</span>
        </label>
      </div>
      <div className="card settings-section">
        <h3>Privacy</h3>
        <label className="settings-option">
          <input type="checkbox" checked={settings?.privateAccount ?? false} onChange={(e) => setSettings((current) => current && ({ ...current, privateAccount: e.target.checked }))} />
          <span>Private account</span>
        </label>
      </div>
      <Button onClick={saveSettings} loading={saving}>Save settings</Button>
    </div>
  );
}
