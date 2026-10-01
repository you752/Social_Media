import type { User } from "@/types/user";

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
  if (user.username) return user.username;
  return "Unknown user";
}

export function initials(user: Partial<User> | undefined | null): string {
  const name = displayName(user);
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
