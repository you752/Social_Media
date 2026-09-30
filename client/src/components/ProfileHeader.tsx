import { Bookmark, Grid2X2, Info, Pencil } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import type { User } from "@/types/user";

export type ProfileTab = "posts" | "bookmarks" | "about";

interface ProfileHeaderProps {
  user: User;
  friendsCount: number | null;
  postsCount: number | null;
  bookmarksCount: number | null;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onEdit?: () => void;
}

const tabs: Array<{ id: ProfileTab; label: string; icon: typeof Grid2X2 }> = [
  { id: "posts", label: "Posts", icon: Grid2X2 },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "about", label: "About", icon: Info },
];

export function ProfileHeader({
  user,
  friendsCount,
  postsCount,
  bookmarksCount,
  activeTab,
  onTabChange,
  onEdit,
}: ProfileHeaderProps) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Wave user";
  const stats = [
    { value: friendsCount, label: "Friends" },
    { value: postsCount, label: "Posts" },
    { value: bookmarksCount, label: "Bookmarks" },
  ];

  return (
    <section className="profile-header-card card">
      <div className="profile-cover" />
      <div className="profile-header-body">
        <div className="profile-avatar-edit-row">
          <Avatar user={user} size="xl" />
          {onEdit && (
            <button type="button" className="profile-edit-button" onClick={onEdit}>
              <Pencil size={15} /> Edit
            </button>
          )}
        </div>
        <div className="profile-header-copy">
          <h1>{fullName}</h1>
          <span>@{user.uniqueName || user.username}</span>
        </div>
        <div className="profile-stats">
          {stats.map((stat) => (
            <div className="profile-stat" key={stat.label}>
              <strong>{stat.value ?? "—"}</strong><span>{stat.label}</span>
            </div>
          ))}
        </div>
        <nav className="profile-tabs" aria-label="Profile sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className={`profile-tab${activeTab === id ? " profile-tab-active" : ""}`}
              onClick={() => onTabChange(id)}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
