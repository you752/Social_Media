import { useState } from "react";
import { Check, X } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { displayName, resolveUser } from "@/utils/getUser";
import * as friendApi from "@/api/friend.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import type { FriendRequest } from "@/types/friend";

interface FriendRequestCardProps {
  request: FriendRequest;
  onHandled: (requestId: string) => void;
}

export function FriendRequestCard({ request, onHandled }: FriendRequestCardProps) {
  const sender = resolveUser(request.sender);
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const { showToast } = useToast();

  async function handleAccept() {
    setBusy("accept");
    try {
      await friendApi.acceptFriendRequest(request._id);
      onHandled(request._id);
      showToast(`You are now friends with ${displayName(sender)}`, "success");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not accept request"), "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleReject() {
    setBusy("reject");
    try {
      await friendApi.rejectFriendRequest(request._id);
      onHandled(request._id);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not reject request"), "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card friend-row">
      <Avatar user={sender} size="md" />
      <div className="friend-row-meta">
        <strong>{displayName(sender)}</strong>
        <span className="friend-status">wants to be friends</span>
      </div>
      <div className="friend-row-actions">
        <Button variant="primary" size="sm" loading={busy === "accept"} disabled={!!busy} onClick={handleAccept}>
          <Check size={14} /> Accept
        </Button>
        <Button variant="ghost" size="sm" loading={busy === "reject"} disabled={!!busy} onClick={handleReject}>
          <X size={14} /> Reject
        </Button>
      </div>
    </div>
  );
}
