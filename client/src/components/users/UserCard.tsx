import { useState } from "react";
import { UserPlus, Clock, MessageCircle, Users as UsersIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { displayName } from "@/utils/getUser";
import * as friendApi from "@/api/friend.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import type { User } from "@/types/user";

export function UserCard({ user }: { user: User }) {
  const [status, setStatus] = useState(user.friendshipStatus ?? "none");
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  async function handleSendRequest() {
    setSending(true);
    try {
      await friendApi.sendFriendRequest(user._id);
      setStatus("pending");
      showToast("Friend request sent", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not send request"), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card user-card">
      <Avatar user={user} size="lg" />
      <strong className="user-card-name">{displayName(user)}</strong>
      {user.username && <span className="user-card-sub">@{user.uniqueName || user.username}</span>}

      <div className="user-card-actions">
        {status === "friends" ? (
          <Button variant="secondary" size="sm" disabled>
            <UsersIcon size={14} /> Friends
          </Button>
        ) : status === "pending" ? (
          <Button variant="secondary" size="sm" disabled>
            <Clock size={14} /> Pending
          </Button>
        ) : status === "blocked" ? (
          <Button variant="secondary" size="sm" disabled>
            Blocked
          </Button>
        ) : (
          <Button variant="primary" size="sm" loading={sending} onClick={handleSendRequest}>
            <UserPlus size={14} /> Add friend
          </Button>
        )}
        <Link to={`/chat/${user._id}`}>
          <Button variant="ghost" size="sm">
            <MessageCircle size={14} /> Chat
          </Button>
        </Link>
      </div>
    </div>
  );
}
