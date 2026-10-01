import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";

  return (
    <button
      className="side-theme-toggle"
      role="switch"
      aria-checked={darkMode}
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <span className={`theme-switch${darkMode ? " theme-switch-on" : ""}`} aria-hidden="true">
        <span className="theme-switch-knob">
          {darkMode ? <Moon size={15} /> : <Sun size={15} />}
        </span>
      </span>
    </button>
  );
}
