import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users } from "lucide-react";
import { UserCard } from "@/components/users/UserCard";
import { EmptyState } from "@/components/common/EmptyState";
import * as friendApi from "@/api/friend.api";
import * as userApi from "@/api/user.api";
import { useToast } from "@/hooks/useToast";
import { getApiErrorMessage } from "@/api/axios";
import { displayName } from "@/utils/getUser";
import type { User } from "@/types/user";

export function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").toLowerCase();

  useEffect(() => {
    const loadUsers = () => {
      userApi
        .getUsers({ discoverableOnly: true })
        .then((data) => setUsers(Array.isArray(data) ? data : []))
        .catch((err) => showToast(getApiErrorMessage(err, "Could not load users"), "error"))
        .finally(() => setLoading(false));
    };
    const onFriendshipChanged = () => loadUsers();

    loadUsers();
    window.addEventListener(friendApi.FRIENDSHIP_CHANGED_EVENT, onFriendshipChanged);
    window.addEventListener("focus", onFriendshipChanged);
    return () => {
      window.removeEventListener(friendApi.FRIENDSHIP_CHANGED_EVENT, onFriendshipChanged);
      window.removeEventListener("focus", onFriendshipChanged);
    };
  }, [showToast]);

  const filtered = useMemo(() => {
    const seen = new Set<string>();
    const discoverableUsers = users.filter((user) => {
      if (
        !user._id ||
        user.friendshipStatus === "friends" ||
        user.friendshipStatus === "blocked" ||
        seen.has(user._id)
      ) {
        return false;
      }
      seen.add(user._id);
      return true;
    });
    if (!query) return discoverableUsers;
    return discoverableUsers.filter((u) => displayName(u).toLowerCase().includes(query) || u.uniqueName?.toLowerCase().includes(query));
  }, [users, query]);

  return (
    <div className="users-page">
      <section className="discover-section">
        <header className="discover-header">
          <h2>Discover People</h2>
          <p>Connect with people and grow your network.</p>
        </header>
        {loading ? (
          <div className="user-grid discover-skeleton-grid" aria-label="Loading people" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="discover-skeleton-card" key={index}>
                <div className="skeleton-avatar" />
                <span className="discover-skeleton-copy">
                  <span className="skeleton-line" />
                  <span className="skeleton-line" />
                </span>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title={query ? "No users found" : "No people to discover"}
            description={query ? `No results for "${query}"` : "You're all caught up for now."}
          />
        ) : (
          <div className="user-grid">
            {filtered.map((u) => (
              <UserCard
                key={u._id}
                user={u}
                onRequestStarted={(userId) =>
                  setUsers((current) => current.filter((user) => user._id !== userId))
                }
                onRequestFailed={(user) =>
                  setUsers((current) =>
                    current.some((existing) => existing._id === user._id)
                      ? current
                      : [...current, user]
                  )
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
