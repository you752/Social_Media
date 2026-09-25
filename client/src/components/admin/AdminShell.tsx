import { BarChart3, FileText, MessageSquare, Moon, ShieldCheck, Sun, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/admin", label: "Overview", icon: BarChart3, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/posts", label: "Posts", icon: FileText },
  { to: "/admin/comments", label: "Comments", icon: MessageSquare },
];

export function AdminShell() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><ShieldCheck size={25} /> Nexa <span>ADMIN</span></div>
        <nav>{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? "active" : ""}><Icon size={18} />{label}</NavLink>)}</nav>
        <button className="admin-theme" onClick={toggleTheme}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />} {theme === "dark" ? "Light mode" : "Dark mode"}</button>
        <div className="admin-user"><strong>{user?.username || user?.email || "Administrator"}</strong><button onClick={() => void logout()}>Sign out</button></div>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}
