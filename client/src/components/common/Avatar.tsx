import clsx from "clsx";
import type { User } from "@/types/user";
import { displayName, initials } from "@/utils/getUser";

interface AvatarProps {
  user?: Partial<User> | null;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
}

export function Avatar({ user, size = "md", online }: AvatarProps) {
  const src = user?.profileImage;
  return (
    <div className={clsx("avatar", `avatar-${size}`)} title={displayName(user)}>
      {src ? (
        <img src={src} alt={displayName(user)} />
      ) : (
        <span className="avatar-initials">{initials(user)}</span>
      )}
      {online !== undefined && <span className={clsx("avatar-status", online && "avatar-status-online")} />}
    </div>
  );
}
