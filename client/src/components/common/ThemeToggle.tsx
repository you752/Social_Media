import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";

  return (
    <button
      className="side-theme-toggle"
      onClick={toggleTheme}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="side-theme-toggle-icon" key={theme}>
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </span>
      <span className="side-theme-toggle-label">{darkMode ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}
