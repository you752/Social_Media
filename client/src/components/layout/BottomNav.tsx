import { NavLink } from "react-router-dom";
import { Bell, Compass, Home, PlusSquare, User } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

const links = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/", label: "Create Post", icon: PlusSquare, action: "create" },
  { to: "/", label: "Notifications", icon: Bell, action: "notifications" },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const { unreadCount } = useNotifications();

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {links.map(({ to, label, icon: Icon, end, action }) => (
        <NavLink
          key={label}
          to={to}
          end={end}
          state={action ? { [`open${action === "create" ? "CreatePost" : "Notifications"}`]: true } : undefined}
          className={({ isActive }) =>
            `bottom-nav-link${isActive && !action ? " bottom-nav-link-active" : ""}`
          }
          aria-label={label}
        >
          <span className="bottom-nav-icon-wrap">
            <Icon size={22} />
            {label === "Notifications" && unreadCount > 0 && (
              <span className="badge badge-dot" aria-label={`${unreadCount} unread notifications`} />
            )}
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
