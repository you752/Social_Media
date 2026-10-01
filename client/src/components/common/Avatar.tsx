import { useEffect, useState } from "react";
import clsx from "clsx";
import type { User } from "@/types/user";
import { displayName, getAvatarUrl, initials } from "@/utils/getUser";

interface AvatarProps {
  user?: Partial<User> | null;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

export function Avatar({ user, size = "md", online, className }: AvatarProps) {
  const src = getAvatarUrl(user);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <div className={clsx("avatar", `avatar-${size}`, className)} title={displayName(user)}>
      {src && !imageFailed ? (
        <img src={src} alt={displayName(user)} onError={() => setImageFailed(true)} />
      ) : (
        <span className="avatar-initials">{initials(user)}</span>
      )}
      {online !== undefined && <span className={clsx("avatar-status", online && "avatar-status-online")} />}
    </div>
  );
}
