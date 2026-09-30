import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";

  return (
    <button
      className="side-theme-toggle"
      role="switch"
      aria-checked={darkMode}
      onClick={toggleTheme}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="side-theme-toggle-label">{darkMode ? "Dark" : "Light"}</span>
      <span className={`theme-switch${darkMode ? " theme-switch-on" : ""}`} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}
