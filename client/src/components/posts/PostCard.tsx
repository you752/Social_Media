import { useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, MessageSquare, Heart, Share2, Bookmark } from "lucide-react";
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
  onDeleted?: (postId: string) => void;
  onEdit?: (post: Post) => void;
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
  
  const [liked, setLiked] = useState(post.liked ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  
  const [bookmarked, setBookmarked] = useState(post.bookmarked ?? false);
  
  const [sharesCount, setSharesCount] = useState(post.sharesCount ?? 0);

  useEffect(() => {
    setCommentCount(post.commentsCount ?? post.comments?.length ?? 0);
    setLiked(post.liked ?? false);
    setLikesCount(post.likesCount ?? 0);
    setBookmarked(post.bookmarked ?? false);
    setSharesCount(post.sharesCount ?? 0);
  }, [post]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await postApi.deletePost(post._id);
      onDeleted?.(post._id);
      showToast("Post deleted", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not delete post"), "error");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleLike() {
    try {
      if (liked) {
        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        await postApi.unlikePost(post._id);
      } else {
        setLiked(true);
        setLikesCount(prev => prev + 1);
        await postApi.likePost(post._id);
      }
    } catch (err) {
      setLiked(!liked);
      setLikesCount(liked ? likesCount + 1 : Math.max(0, likesCount - 1));
      showToast(getApiErrorMessage(err, "Could not update like"), "error");
    }
  }

  async function handleBookmark() {
    try {
      if (bookmarked) {
        setBookmarked(false);
        await postApi.removeBookmark(post._id);
      } else {
        setBookmarked(true);
        await postApi.bookmarkPost(post._id);
        showToast("Post bookmarked", "success");
      }
    } catch (err) {
      setBookmarked(!bookmarked);
      showToast(getApiErrorMessage(err, "Could not update bookmark"), "error");
    }
  }

  async function handleShare() {
    try {
      setSharesCount(prev => prev + 1);
      await postApi.sharePost(post._id);
      showToast("Post shared", "success");
    } catch (err) {
      setSharesCount(prev => Math.max(0, prev - 1));
      showToast(getApiErrorMessage(err, "Could not share post"), "error");
    }
  }

  const taggedUsers = Array.isArray(post.taggedUsers) ? post.taggedUsers.map(u => typeof u === 'string' ? u : displayName(u)).join(', ') : '';

  return (
    <article className="card post-card">
      <div className="post-header">
        <Avatar user={author} size="md" />
        <div className="post-header-meta">
          <strong>{displayName(author)}</strong>
          {taggedUsers && <span className="tagged-users" style={{ fontSize: '0.85em', color: 'gray' }}> with {taggedUsers}</span>}
          <div className="post-time">{timeAgo(post.createdAt)}</div>
        </div>

        <div className="post-menu">
          <button className="icon-btn" onClick={() => handleBookmark()} aria-label="Bookmark" style={{ marginRight: '8px' }}>
            <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
          </button>
          
          {isOwner && (
            <>
              <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Post options">
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <div className="dropdown menu-dropdown">
                  <button onClick={() => { onEdit?.(post); setMenuOpen(false); }}><Pencil size={14} /> Edit</button>
                  <button onClick={() => { setConfirmDelete(true); setMenuOpen(false); }} className="danger-text"><Trash2 size={14} /> Delete</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {post.image && (
        <div className="post-image">
          <img src={post.image} alt="Post attachment" />
        </div>
      )}

      <p className="post-content">{post.content}</p>

      <div className="post-footer" style={{ display: 'flex', gap: '16px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
        <button className="post-action" onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: liked ? '#e0245e' : 'inherit' }}>
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
          <span>{likesCount}</span>
        </button>
        
        <button className="post-action" onClick={() => setShowComments((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <MessageSquare size={16} />
          <span>{commentCount}</span>
        </button>
        
        <button className="post-action" onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Share2 size={16} />
          <span>{sharesCount}</span>
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
