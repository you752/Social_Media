import { useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, MessageSquare, Heart, Share2, Bookmark, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/common/Avatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CommentList } from "@/components/comments/CommentList";
import { displayName, resolveUser } from "@/utils/getUser";
import { timeAgo } from "@/utils/date";
import { useAuth } from "@/hooks/useAuth";
import * as postApi from "@/api/post.api";
import * as friendApi from "@/api/friend.api";
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
  const navigate = useNavigate();
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
  const [friendshipStatus, setFriendshipStatus] = useState(author.friendshipStatus ?? "none");
  
  const [sharesCount, setSharesCount] = useState(post.sharesCount ?? 0);

  useEffect(() => {
    setCommentCount(post.commentsCount ?? post.comments?.length ?? 0);
    setLiked(post.liked ?? false);
    setLikesCount(post.likesCount ?? 0);
    setBookmarked(post.bookmarked ?? false);
    setFriendshipStatus(author.friendshipStatus ?? "none");
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

  async function handleFollow() {
    if (!author._id) return;
    try {
      await friendApi.sendFriendRequest(author._id);
      setFriendshipStatus("pending-sent");
      setMenuOpen(false);
      showToast("Friend request sent", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not send request"), "error");
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
      {/* Ambient animated background layer — pointer-events: none, z-index: 0, behind all content */}
      <div className="post-ambient-bg" aria-hidden="true">
        <div className="ambient-wave ambient-wave-1" />
        <div className="ambient-wave ambient-wave-2" />
        <div className="ambient-wave ambient-wave-3" />
      </div>
      <div className="post-header">
        <Avatar user={author} size="md" />
        <div className="post-header-meta">
          <strong>{displayName(author)}</strong>
          <div className="post-time">{timeAgo(post.createdAt)}</div>
          {taggedUsers && <span className="tagged-users">with {taggedUsers}</span>}
        </div>

        <div className="post-menu">
          <button className={`icon-btn${bookmarked ? " icon-btn-active" : ""}`} onClick={() => handleBookmark()} aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}>
            <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
          </button>
          <button
            className="icon-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Post options"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <div className="dropdown menu-dropdown">
              {!isOwner && (
                <button
                  onClick={() =>
                    friendshipStatus === "pending-received"
                      ? navigate("/friend-requests")
                      : void handleFollow()
                  }
                  disabled={friendshipStatus !== "none" && friendshipStatus !== "pending-received"}
                >
                  <UserPlus size={14} />
                  {friendshipStatus === "friends"
                    ? "Following"
                    : friendshipStatus === "pending" || friendshipStatus === "pending-sent"
                      ? "Request sent"
                      : friendshipStatus === "pending-received"
                        ? "Respond to request"
                        : friendshipStatus === "blocked"
                          ? "Unavailable"
                          : "Follow"}
                </button>
              )}
              {isOwner && (
                <>
                  <button onClick={() => { onEdit?.(post); setMenuOpen(false); }}><Pencil size={14} /> Edit</button>
                  <button onClick={() => { setConfirmDelete(true); setMenuOpen(false); }} className="danger-text"><Trash2 size={14} /> Delete</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {post.image && (
        <div className="post-image">
          <img src={post.image} alt="Post attachment" loading="lazy" />
        </div>
      )}

      <p className="post-content">{post.content}</p>

      <div className="post-footer">
        <button className={`post-action${liked ? " post-action-active" : ""}`} onClick={handleLike}>
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
          <span>{likesCount}</span>
        </button>
        
        <button className={`post-action${showComments ? " post-action-active" : ""}`} onClick={() => setShowComments((v) => !v)}>
          <MessageSquare size={16} />
          <span>{commentCount}</span>
        </button>
        
        <button className="post-action" onClick={handleShare}>
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
