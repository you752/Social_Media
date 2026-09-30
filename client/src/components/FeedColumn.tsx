import type { ReactNode } from "react";

export function FeedColumn({ children }: { children: ReactNode }) {
  return <div className="feed-column">{children}</div>;
}
