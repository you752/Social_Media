import { useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CommentList } from "@/components/comments/CommentList";
import { displayName, resolveUser } from "@/utils/getUser";
import { timeAgo } from "@/utils/date";
import { useAuth } from "@/hooks/useAuth";
import * as postApi from "@/api/post.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import type { Post } from "@/types/post";

interface PostCardProps {
  post: Post;
  onDeleted: (postId: string) => void;
  onEdit: (post: Post) => void;
}

export function PostCard({ post, onDeleted, onEdit }: PostCardProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const author = resolveUser(post.author);
  const isOwner = user?._id === author._id;

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentsCount ?? post.comments?.length ?? 0);

  useEffect(() => {
    setCommentCount(post.commentsCount ?? post.comments?.length ?? 0);
  }, [post.commentsCount, post.comments]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await postApi.deletePost(post._id);
      onDeleted(post._id);
      showToast("Post deleted", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not delete post"), "error");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <article className="card post-card">
      <div className="post-header">
        <Avatar user={author} size="md" />
        <div className="post-header-meta">
          <strong>{displayName(author)}</strong>
          <span className="post-time">{timeAgo(post.createdAt)}</span>
        </div>

        {isOwner && (
          <div className="post-menu">
            <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Post options">
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="dropdown menu-dropdown">
                <button onClick={() => { onEdit(post); setMenuOpen(false); }}><Pencil size={14} /> Edit</button>
                <button onClick={() => { setConfirmDelete(true); setMenuOpen(false); }} className="danger-text"><Trash2 size={14} /> Delete</button>
              </div>
            )}
          </div>
        )}
      </div>

      {post.image && (
        <div className="post-image">
          <img src={post.image} alt="Post attachment" />
        </div>
      )}

      <p className="post-content">{post.content}</p>

      <div className="post-footer">
        <button className="post-action" onClick={() => setShowComments((v) => !v)}>
          <MessageSquare size={16} />
          <span>
            {commentCount} comment{commentCount === 1 ? "" : "s"}
          </span>
        </button>
      </div>

      {showComments && <CommentList postId={post._id} onCommentCountChange={setCommentCount} />}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete post?"
        description="This will permanently remove the post."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </article>
  );
}
