import { NavLink } from "react-router-dom";
import { Home, Users, UsersRound, MessageCircle, User } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

const links = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/users", label: "Discover", icon: Users },
  { to: "/friends", label: "Friends", icon: UsersRound },
  { to: "/chat", label: "Messages", icon: MessageCircle, badgeKey: "unreadMessageCount" as const },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const { unreadMessageCount } = useNotifications();
  const badges = { unreadMessageCount };

  return (
    <nav className="bottom-nav">
      {links.map(({ to, label, icon: Icon, end, badgeKey }) => {
        const count = badgeKey ? badges[badgeKey] : 0;
        return (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `bottom-nav-link${isActive ? " bottom-nav-link-active" : ""}`}>
            <div className="bottom-nav-icon-wrap">
              <Icon size={22} />
              {count > 0 && <span className="badge badge-dot" />}
            </div>
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
