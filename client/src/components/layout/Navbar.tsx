import { useState } from "react";
import { Search, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useNotifications } from "@/hooks/useNotifications";
import { NexaBrand } from "@/components/common/NexaBrand";

export function Navbar() {
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/users?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="navbar">
      <NexaBrand className="navbar-brand" />

      <form className="navbar-search" onSubmit={handleSearch}>
        <Search size={16} />
        <input
          placeholder="Search Nexa..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search people"
        />
      </form>

      <div className="navbar-actions">
        <button className="icon-btn" onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications">
          <Bell size={20} />
          {unreadCount > 0 && <span className="badge badge-dot navbar-badge" />}
        </button>
        {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
      </div>
    </header>
  );
}
