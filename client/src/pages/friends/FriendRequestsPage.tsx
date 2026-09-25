import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { FriendRequestCard } from "@/components/friends/FriendRequestCard";
import { EmptyState } from "@/components/common/EmptyState";
import { PageSpinner } from "@/components/common/Spinner";
import { useNotifications } from "@/hooks/useNotifications";
import * as friendApi from "@/api/friend.api";
import { useToast } from "@/hooks/useToast";
import { getApiErrorMessage } from "@/api/axios";
import type { FriendRequest } from "@/types/friend";

export function FriendRequestsPage() {
  const { showToast } = useToast();
  const { bumpFriendRequestCount } = useNotifications();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    friendApi
      .getFriendRequests()
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch((err) => showToast(getApiErrorMessage(err, "Could not load friend requests"), "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleHandled(requestId: string) {
    setRequests((prev) => prev.filter((r) => r._id !== requestId));
    bumpFriendRequestCount(-1);
  }

  return (
    <div className="friends-page">
      <h2 className="section-title">Friend requests</h2>
      {loading ? (
        <PageSpinner />
      ) : requests.length === 0 ? (
        <EmptyState icon={<UserPlus size={28} />} title="No pending requests" description="You are all caught up." />
      ) : (
        <div className="friend-list">
          {requests.map((r) => (
            <FriendRequestCard key={r._id} request={r} onHandled={handleHandled} />
          ))}
        </div>
      )}
    </div>
  );
}
