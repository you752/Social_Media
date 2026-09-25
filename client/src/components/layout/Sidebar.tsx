import { NavLink } from "react-router-dom";
import { Home, Users, UserPlus, MessageCircle, User, LogOut, UsersRound, Bookmark, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar } from "@/components/common/Avatar";
import { displayName } from "@/utils/getUser";
import { NexaBrand } from "@/components/common/NexaBrand";

const links = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/users", label: "Discover", icon: Users },
  { to: "/friends", label: "Friends", icon: UsersRound },
  { to: "/friend-requests", label: "Requests", icon: UserPlus, badgeKey: "friendRequestCount" as const },
  { to: "/chat", label: "Messages", icon: MessageCircle, badgeKey: "unreadMessageCount" as const },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { friendRequestCount, unreadMessageCount } = useNotifications();

  const badges = { friendRequestCount, unreadMessageCount };

  return (
    <aside className="sidebar">
      <NexaBrand className="sidebar-brand" />

      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon, end, badgeKey }) => {
          const count = badgeKey ? badges[badgeKey] : 0;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link${isActive ? " sidebar-link-active" : ""}`}
            >
              <Icon size={20} />
              <span>{label}</span>
              {count > 0 && <span className="badge">{count > 9 ? "9+" : count}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <Avatar user={user} size="sm" />
          <span className="sidebar-user-name">{displayName(user)}</span>
        </div>
        <button className="sidebar-link sidebar-logout" onClick={() => logout()}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
