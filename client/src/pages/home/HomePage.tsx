import { useEffect, useState } from "react";
import { Plus, Newspaper } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { PostSkeleton } from "@/components/common/Skeleton";
import { PostCard } from "@/components/posts/PostCard";
import { CreatePostModal } from "@/components/posts/CreatePostModal";
import { EditPostModal } from "@/components/posts/EditPostModal";
import { useAuth } from "@/hooks/useAuth";
import * as postApi from "@/api/post.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import type { Post } from "@/types/post";

export function HomePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    let active = true;
    postApi
      .getPosts()
      .then((data) => { if (active) setPosts(Array.isArray(data) ? data : []); })
      .catch((err) => showToast(getApiErrorMessage(err, "Could not load feed"), "error"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="feed-page">
      <div className="card create-post-trigger" onClick={() => setCreateOpen(true)}>
        <Avatar user={user} size="md" />
        <span>What is on your mind, {user?.firstName || user?.username}?</span>
        <Button size="sm" onClick={(e) => { e.stopPropagation(); setCreateOpen(true); }}>
          <Plus size={16} /> Post
        </Button>
      </div>

      {loading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Newspaper size={28} />}
          title="Your feed is empty"
          description="Follow people or create your first post to get started."
          action={<Button onClick={() => setCreateOpen(true)}>Create a post</Button>}
        />
      ) : (
        posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onDeleted={(id) => setPosts((prev) => prev.filter((p) => p._id !== id))}
            onEdit={setEditingPost}
          />
        ))
      )}

      <CreatePostModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(post) => setPosts((prev) => [post, ...prev])}
      />
      <EditPostModal
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onUpdated={(updated) => setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))}
      />
    </div>
  );
}
