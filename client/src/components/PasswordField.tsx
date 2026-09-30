import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
}

export function PasswordField({ label, value, onChange, autoComplete }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = `password-${label.toLowerCase().replace(/ /g, "-")}`;

  return (
    <div className="password-field">
      <label className="field-label" htmlFor={inputId}>{label}</label>
      <div className="password-field-input-wrap">
        <input
          id={inputId}
          className="field-input password-field-input"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          className="password-field-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
