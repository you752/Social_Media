import { Bookmark, Grid2X2, Info, Pencil } from "lucide-react";
import type { User } from "@/types/user";
import { displayName, initials } from "@/utils/getUser";
import { CoverImage } from "@/components/CoverImage";

export type ProfileTab = "posts" | "bookmarks" | "about";

interface ProfileHeaderProps {
  user: User;
  friendsCount: number | null;
  postsCount: number | null;
  bookmarksCount: number | null;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onEdit?: () => void;
  onCoverChange?: (cover: string) => void;
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
  onCoverChange,
}: ProfileHeaderProps) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Wave user";
  const fallbackAvatar = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#09091a"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#8b8ba7" font-family="sans-serif" font-size="40" font-weight="700">${initials(user)}</text></svg>`,
  )}`;
  const stats = [
    { value: friendsCount, label: "Friends" },
    { value: postsCount, label: "Posts" },
    { value: bookmarksCount, label: "Bookmarks" },
  ];

  return (
    <section className="profile-header-card card">
      <CoverImage cover={user.cover} editable={Boolean(onCoverChange)} onCoverChange={onCoverChange} />
      <div className="profile-header-body">
        <div className="profile-avatar-edit-row">
          <img
            className="relative z-10 -mt-14 block h-28 w-28 rounded-full object-cover ring-4 ring-surface sm:-mt-16 sm:h-32 sm:w-32"
            src={user.profileImage || fallbackAvatar}
            alt={displayName(user)}
          />
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
