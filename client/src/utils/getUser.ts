import type { User } from "@/types/user";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

// Posts/comments/messages may return the author as a populated object or
// just an id string, depending on backend population. This normalizes
// access so components do not need to guard every time.
export function resolveUser(value: User | string | undefined | null): Partial<User> {
  if (!value) return {};
  if (typeof value === "string") return { _id: value };
  return value;
}

export function displayName(user: Partial<User> | undefined | null): string {
  if (!user) return "Unknown user";
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }
  if (user.name?.trim()) return user.name.trim();
  if (user.username) return user.username;
  return "Unknown user";
}

export function getAvatarUrl(user: Partial<User> | undefined | null): string | null {
  const value = user?.profileImage || user?.avatar;
  const image = typeof value === "string" ? value.trim() : value?.secure_url?.trim();
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;

  const normalized = image.replace(/\\/g, "/");
  const uploadsPath = normalized.match(/(?:^|\/)uploads\/(.+)$/i)?.[1];
  if (uploadsPath) {
    return `${apiBaseUrl}/uploads/${uploadsPath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")}`;
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName) return null;

  const publicId = normalized
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/${publicId}`;
}

export function initials(user: Partial<User> | undefined | null): string {
  const name = displayName(user);
  if (name === "Unknown user") return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
