import { useEffect, useRef } from "react";
import { UserPlus, UserCheck, UserX, MessageCircle, MessageSquare, BellOff } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type { AppNotification } from "@/context/notification-context";
import { timeAgo } from "@/utils/date";

const ICONS: Record<AppNotification["type"], typeof UserPlus> = {
  "friend:request": UserPlus,
  "friend:accepted": UserCheck,
  "friend:rejected": UserX,
  message: MessageCircle,
  comment: MessageSquare,
};

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markAllRead();
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [markAllRead, onClose]);

  return (
    <div className="dropdown notification-dropdown" ref={ref}>
      <div className="dropdown-header">Notifications</div>
      {notifications.length === 0 ? (
        <div className="dropdown-empty">
          <BellOff size={20} />
          <span>No notifications yet</span>
        </div>
      ) : (
        <div className="dropdown-list">
          {notifications.map((n) => {
            const Icon = ICONS[n.type];
            return (
              <div key={n.id} className="notification-item">
                <Icon size={16} />
                <div>
                  <p>{n.message}</p>
                  <span className="notification-time">{timeAgo(n.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
