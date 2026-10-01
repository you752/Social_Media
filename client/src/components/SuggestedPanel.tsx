import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { Avatar } from "@/components/common/Avatar";
import { Skeleton } from "@/components/common/Skeleton";
import * as friendApi from "@/api/friend.api";
import * as userApi from "@/api/user.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import type { UserSuggestion } from "@/types/user";

export function SuggestedPanel() {
  const [users, setUsers] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sendingIds, setSendingIds] = useState<string[]>([]);
  const [sentIds, setSentIds] = useState<string[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    userApi.getSuggestions(10)
      .then((suggestions) => { if (active) setUsers(suggestions); })
      .catch((error: unknown) => {
        if (active) setLoadError(true);
        showToast(getApiErrorMessage(error, "Could not load suggestions"), "error");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showToast]);

  async function sendRequest(userId: string) {
    setSendingIds((current) => [...current, userId]);
    try {
      await friendApi.sendFriendRequest(userId);
      setSentIds((current) => [...current, userId]);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not send request"), "error");
    } finally {
      setSendingIds((current) => current.filter((id) => id !== userId));
    }
  }

  return (
    <aside className="suggested-panel card" aria-label="Suggested for you">
      <h2>Suggested for you</h2>
      <div className="suggested-list">
        {loading ? Array.from({ length: 5 }, (_, index) => (
          <div className="suggested-user suggested-user-skeleton" key={index}>
            <Skeleton className="skeleton-avatar" />
            <div className="suggested-skeleton-copy">
              <Skeleton className="skeleton-line" />
              <Skeleton className="skeleton-line" />
            </div>
          </div>
        )) : users.slice(0, 10).map((suggested) => {
          const sent = sentIds.includes(suggested._id);
          const sending = sendingIds.includes(suggested._id);
          const profilePath = `/u/${encodeURIComponent(suggested.username || suggested._id)}`;
          return (
            <div className="suggested-user" key={suggested._id}>
              <Link to={profilePath} className="suggested-identity">
                <Avatar user={{ username: suggested.name, profileImage: suggested.avatar }} size="sm" />
                <span className="suggested-user-copy">
                  <strong>{suggested.name}</strong>
                  <small>@{suggested.username}</small>
                </span>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                className="suggested-follow-button"
                disabled={sent || sending}
                loading={sending}
                onClick={() => sendRequest(suggested._id)}
              >
                {sent ? "Sent" : "Follow"}
              </Button>
            </div>
          );
        })}
        {!loading && loadError && <p className="suggested-empty" role="alert">Suggestions could not be loaded.</p>}
        {!loading && !loadError && users.length === 0 && <p className="suggested-empty">You’re all caught up for now.</p>}
      </div>
      <footer className="suggested-footer">
        <nav aria-label="Footer">
          <a href="/about">About</a><a href="/help">Help</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a>
        </nav>
        <span>© 2026 Wave</span>
      </footer>
    </aside>
  );
}
