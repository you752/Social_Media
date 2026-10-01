import { useCallback, useEffect, useState } from "react";
import { Search, Bell } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useNotifications } from "@/hooks/useNotifications";
import { WaveBrand } from "@/components/common/WaveBrand";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function Navbar() {
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const isSmallMobile = useMediaQuery("(max-width: 480px)");
  const location = useLocation();
  const navigate = useNavigate();
  const closeNotifications = useCallback(() => setNotifOpen(false), []);

  useEffect(() => {
    const routeState = location.state as { openNotifications?: boolean } | null;
    if (!routeState?.openNotifications) return;
    setNotifOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

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
          placeholder={isSmallMobile ? "Search..." : "Search posts or people..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search people"
        />
        <kbd className="navbar-search-shortcut">⌘K</kbd>
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
        <ThemeToggle />
      </div>
    </header>
  );
}
