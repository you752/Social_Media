import clsx from "clsx";
import type { CSSProperties } from "react";

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={clsx("skeleton", className)} style={style} />;
}

export function PostSkeleton() {
  return (
    <div className="card post-card">
      <div className="post-header">
        <Skeleton className="skeleton-avatar" />
        <div style={{ flex: 1 }}>
          <Skeleton className="skeleton-line" style={{ width: "40%" }} />
          <Skeleton className="skeleton-line" style={{ width: "25%", marginTop: 6 }} />
        </div>
      </div>
      <Skeleton className="skeleton-line" style={{ width: "90%", marginTop: 14 }} />
      <Skeleton className="skeleton-line" style={{ width: "70%", marginTop: 8 }} />
      <Skeleton className="skeleton-block" style={{ marginTop: 12 }} />
    </div>
  );
}
