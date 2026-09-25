import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageSpinner } from "@/components/common/Spinner";
import { PostCard } from "@/components/posts/PostCard";
import * as postApi from "@/api/post.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import type { Post } from "@/types/post";

export function BookmarksPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    postApi.getBookmarks()
      .then(setPosts)
      .catch((error) => showToast(getApiErrorMessage(error, "Could not load bookmarks"), "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <div className="feed-page">
      <h2 className="section-title">Bookmarks</h2>
      {loading ? <PageSpinner /> : posts.length === 0 ? (
        <EmptyState icon={<Bookmark size={28} />} title="No bookmarks yet" description="Posts you bookmark will show up here." />
      ) : posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onDeleted={(id) => setPosts((previous) => previous.filter((item) => item._id !== id))}
          onEdit={() => undefined}
        />
      ))}
    </div>
  );
}
