import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users } from "lucide-react";
import { UserCard } from "@/components/users/UserCard";
import { EmptyState } from "@/components/common/EmptyState";
import { PageSpinner } from "@/components/common/Spinner";
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
    userApi
      .getUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => showToast(getApiErrorMessage(err, "Could not load users"), "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!query) return users;
    return users.filter((u) => displayName(u).toLowerCase().includes(query) || u.uniqueName?.toLowerCase().includes(query));
  }, [users, query]);

  return (
    <div className="users-page">
      <h2 className="section-title">Discover people</h2>
      {loading ? (
        <PageSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={28} />} title="No users found" description={query ? `No results for "${query}"` : "Check back later."} />
      ) : (
        <div className="user-grid">
          {filtered.map((u) => (
            <UserCard key={u._id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
