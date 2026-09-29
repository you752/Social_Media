import { useEffect, useRef } from "react";
import { BellOff, CheckCheck, MessageCircle, UserCheck, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/common/Avatar";
import { useNotifications } from "@/hooks/useNotifications";
import type { AppNotification } from "@/types/notification";
import { displayName } from "@/utils/getUser";
import { timeAgo } from "@/utils/date";

function notificationText(notification: AppNotification) {
  const name = displayName(notification.sender);
  if (notification.type === "friend_request") return `${name} sent you a friend request`;
  if (notification.type === "friend_accepted") return `${name} accepted your friend request`;
  return `${name} sent you a message`;
}

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const {
    notifications,
    markRead,
    markAllRead,
    unreadCount,
  } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  async function handleMarkAllRead() {
    try {
      await markAllRead();
    } catch {
      // NotificationProvider already reports the failure to the user.
    }
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  async function openNotification(notification: AppNotification) {
    if (!notification.isRead) {
      try {
        await markRead(notification._id);
      } catch {
        return;
      }
    }

    onClose();
    if (notification.type === "friend_request") {
      navigate("/friend-requests");
    } else if (notification.type === "message") {
      navigate(`/chat/${notification.sender._id}`);
    } else {
      navigate(`/profile/${notification.sender._id}`);
    }
  }

  return (
    <div className="dropdown notification-dropdown" ref={ref}>
      <div className="notification-dropdown-header">
        <strong>Notifications</strong>
        {unreadCount > 0 && (
          <button className="notification-mark-all" onClick={() => void handleMarkAllRead()}>
            <CheckCheck size={15} /> Mark all as read
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="dropdown-empty">
          <BellOff size={20} />
          <span>No notifications yet</span>
        </div>
      ) : (
        <div className="dropdown-list">
          {notifications.map((notification) => {
            const Icon = notification.type === "friend_request"
              ? UserPlus
              : notification.type === "friend_accepted"
                ? UserCheck
                : MessageCircle;
            return (
              <button
                type="button"
                key={notification._id}
                className={`notification-item${notification.isRead ? "" : " notification-item-unread"}`}
                onClick={() => void openNotification(notification)}
              >
                <Avatar user={notification.sender} size="sm" />
                <span className="notification-item-icon"><Icon size={15} /></span>
                <span className="notification-item-copy">
                  <span className="notification-item-text">{notificationText(notification)}</span>
                  <span className="notification-time">{timeAgo(notification.createdAt)}</span>
                </span>
                {!notification.isRead && <span className="notification-unread-dot" aria-label="Unread" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
