import { useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import { FriendCard } from "@/components/friends/FriendCard";
import { EmptyState } from "@/components/common/EmptyState";
import { PageSpinner } from "@/components/common/Spinner";
import * as friendApi from "@/api/friend.api";
import { useToast } from "@/hooks/useToast";
import { getApiErrorMessage } from "@/api/axios";
import type { User } from "@/types/user";

export function FriendsPage() {
  const { showToast } = useToast();
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    friendApi
      .getFriends()
      .then((data) => setFriends(Array.isArray(data) ? data : []))
      .catch((err) => showToast(getApiErrorMessage(err, "Could not load friends"), "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="friends-page">
      <h2 className="section-title">Friends</h2>
      {loading ? (
        <PageSpinner />
      ) : friends.length === 0 ? (
        <EmptyState icon={<UsersRound size={28} />} title="No friends yet" description="Send friend requests from the Discover page." />
      ) : (
        <div className="friend-list">
          {friends.map((f) => (
            <FriendCard key={f._id} friend={f} onBlocked={(id) => setFriends((prev) => prev.filter((x) => x._id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}
