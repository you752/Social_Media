import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar } from "@/components/common/Avatar";
import { displayName } from "@/utils/getUser";
import { EmptyState } from "@/components/common/EmptyState";
import { MessagesSquare } from "lucide-react";
import * as friendApi from "@/api/friend.api";
import type { User } from "@/types/user";

// The backend does not expose a dedicated "conversation list" endpoint in
// the given spec, so we build the chat sidebar from the friends list
// (chatting with a friend is the primary flow) as a reasonable default.
// ASSUMPTION: adjust if a conversations endpoint becomes available.
export function ConversationList() {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useParams();

  useEffect(() => {
    friendApi
      .getFriends()
      .then((data) => setFriends(Array.isArray(data) ? data : []))
      .catch(() => setFriends([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="conversation-list-loading">Loading...</div>;

  if (friends.length === 0) {
    return (
      <EmptyState
        icon={<MessagesSquare size={28} />}
        title="No conversations yet"
        description="Add friends to start chatting."
      />
    );
  }

  return (
    <div className="conversation-list">
      {friends.map((f) => (
        <Link key={f._id} to={`/chat/${f._id}`} className={`conversation-item${userId === f._id ? " conversation-item-active" : ""}`}>
          <Avatar user={f} size="md" online={f.isOnline} />
          <div className="conversation-item-meta">
            <strong>{displayName(f)}</strong>
          </div>
        </Link>
      ))}
    </div>
  );
}
