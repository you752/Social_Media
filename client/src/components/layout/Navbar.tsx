import { useCallback, useState } from "react";
import { Search, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useNotifications } from "@/hooks/useNotifications";
import { WaveBrand } from "@/components/common/WaveBrand";

export function Navbar() {
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const closeNotifications = useCallback(() => setNotifOpen(false), []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/users?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="navbar">
      <WaveBrand className="navbar-brand" />

      <form className="navbar-search" onSubmit={handleSearch}>
        <Search size={16} />
        <input
          placeholder="Search posts or people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search people"
        />
      </form>

      <div className="navbar-actions">
        <button
          className="icon-btn"
          onClick={() => setNotifOpen((v) => !v)}
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
          aria-expanded={notifOpen}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="badge navbar-badge notification-count-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        {notifOpen && <NotificationDropdown onClose={closeNotifications} />}
      </div>
    </header>
  );
}
