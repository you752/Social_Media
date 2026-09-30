// Field names mirror what the backend is documented to accept/return.
// Anything not explicitly listed in the spec is left optional and typed
// loosely so the UI can render it if present without breaking if absent.

export interface User {
  _id: string;
  id?: string;
  username?: string;
  uniqueName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
  phoneNumber?: string;
  gender?: string;
  bio?: string;
  role?: number;
  isBlocked?: boolean;
  profileImage?: string;
  cover?: string;
  // Friendship state relative to the current viewer, if the backend
  // includes it on a user object (ASSUMPTION - field name may differ).
  friendshipStatus?: "none" | "pending" | "pending-sent" | "pending-received" | "friends" | "blocked";
  isOnline?: boolean;
  createdAt?: string;
  updatedAt?: string;
  friendsCount?: number;
  postsCount?: number;
  bookmarksCount?: number;
  [key: string]: unknown;
}

export enum UserRoleEnum {
  USER = 0,
  ADMIN = 1,
}

export interface SignupPayload {
  username: string;
  uniqueName: string;
  email: string;
  password: string;
  age: string | number;
  phoneNumber: string;
  gender: string;
  profileImage?: File | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  username?: string;
  age?: string | number;
  phoneNumber?: string;
  gender?: string;
  bio?: string;
  profileImage?: File | null;
}

export interface UserProfile extends User {
  posts: import("./post").Post[];
  followersCount?: number;
  followingCount?: number;
}
