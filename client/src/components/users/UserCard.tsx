import { useEffect, useState } from "react";
import { UserPlus, Clock, MessageCircle, Users as UsersIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { displayName } from "@/utils/getUser";
import * as friendApi from "@/api/friend.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import type { User } from "@/types/user";

interface UserCardProps {
  user: User;
  onRequestStarted: (userId: string) => void;
  onRequestFailed: (user: User) => void;
}

export function UserCard({ user, onRequestStarted, onRequestFailed }: UserCardProps) {
  const [status, setStatus] = useState(user.friendshipStatus ?? "none");
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setStatus(user.friendshipStatus ?? "none");
  }, [user.friendshipStatus]);

  async function handleSendRequest() {
    onRequestStarted(user._id);
    setSending(true);
    try {
      await friendApi.sendFriendRequest(user._id);
      setStatus("pending-sent");
      showToast("Friend request sent", "success");
    } catch (err) {
      onRequestFailed(user);
      showToast(getApiErrorMessage(err, "Could not send request"), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card user-card">
      <div className="user-card-identity">
        <Avatar user={user} size="md" />
        <div className="user-card-info">
          <strong className="user-card-name">{displayName(user)}</strong>
          {(user.uniqueName || user.username) && (
            <span className="user-card-sub">@{user.uniqueName || user.username}</span>
          )}
        </div>
      </div>

      <div className="user-card-actions">
        {status === "friends" ? (
          <Button variant="secondary" size="sm" disabled>
            <UsersIcon size={14} /> Friends
          </Button>
        ) : status === "pending" || status === "pending-sent" ? (
          <Button variant="secondary" size="sm" disabled>
            <Clock size={14} /> Request Sent
          </Button>
        ) : status === "pending-received" ? (
          <Link className="user-card-request-link" to="/friend-requests">
            <Button variant="secondary" size="sm">
              <Clock size={14} /> Respond
            </Button>
          </Link>
        ) : status === "blocked" ? (
          <Button variant="secondary" size="sm" disabled>
            Blocked
          </Button>
        ) : (
          <Button variant="primary" size="sm" loading={sending} onClick={handleSendRequest}>
            <UserPlus size={14} /> Add Friend
          </Button>
        )}
        <Link className="user-card-chat-link" to={`/chat/${user._id}`}>
          <Button variant="ghost" size="sm">
            <MessageCircle size={14} /> Chat
          </Button>
        </Link>
      </div>
    </div>
  );
}
