import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ShieldBan } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { displayName } from "@/utils/getUser";
import * as friendApi from "@/api/friend.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import type { User } from "@/types/user";

interface FriendCardProps {
  friend: User;
  onBlocked: (userId: string) => void;
}

export function FriendCard({ friend, onBlocked }: FriendCardProps) {
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  async function handleBlock() {
    setBusy(true);
    try {
      await friendApi.blockUser(friend._id);
      onBlocked(friend._id);
      showToast(`${displayName(friend)} was blocked`, "success");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not block user"), "error");
    } finally {
      setBusy(false);
      setConfirmBlock(false);
    }
  }

  return (
    <div className="card friend-row">
      <Avatar user={friend} size="md" online={friend.isOnline} />
      <div className="friend-row-meta">
        <strong>{displayName(friend)}</strong>
        {friend.isOnline !== undefined && (
          <span className="friend-status">{friend.isOnline ? "Online" : "Offline"}</span>
        )}
      </div>
      <div className="friend-row-actions">
        <Link to={`/chat/${friend._id}`}>
          <Button variant="secondary" size="sm"><MessageCircle size={14} /> Chat</Button>
        </Link>
        <button className="icon-btn" onClick={() => setConfirmBlock(true)} aria-label="Block user">
          <ShieldBan size={16} />
        </button>
      </div>

      <ConfirmDialog
        open={confirmBlock}
        title={`Block ${displayName(friend)}?`}
        description="They will no longer be able to message you or see your posts as a friend."
        confirmLabel="Block"
        loading={busy}
        onConfirm={handleBlock}
        onCancel={() => setConfirmBlock(false)}
      />
    </div>
  );
}
