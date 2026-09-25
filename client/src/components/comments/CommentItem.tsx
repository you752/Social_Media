import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { displayName, resolveUser } from "@/utils/getUser";
import { timeAgo } from "@/utils/date";
import { useAuth } from "@/hooks/useAuth";
import * as commentApi from "@/api/comment.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import type { Comment } from "@/types/post";

interface CommentItemProps {
  comment: Comment;
  onUpdated: (comment: Comment) => void;
  onDeleted: (commentId: string) => void;
}

export function CommentItem({ comment, onUpdated, onDeleted }: CommentItemProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const author = resolveUser(comment.author);
  const isOwner = user?._id === author._id;

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(comment.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function saveEdit() {
    if (!value.trim()) return;
    setBusy(true);
    try {
      const updated = await commentApi.updateComment(comment._id, { content: value.trim() });
      onUpdated({ ...comment, ...updated, content: value.trim() });
      setEditing(false);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not update comment"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteComment() {
    setBusy(true);
    try {
      await commentApi.deleteComment(comment._id);
      onDeleted(comment._id);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not delete comment"), "error");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="comment-item">
      <Avatar user={author} size="sm" />
      <div className="comment-bubble">
        <div className="comment-bubble-header">
          <strong>{displayName(author)}</strong>
          <span className="comment-time">{timeAgo(comment.createdAt)}</span>
        </div>

        {editing ? (
          <div className="comment-edit-row">
            <input value={value} onChange={(e) => setValue(e.target.value)} disabled={busy} autoFocus />
            <button className="icon-btn" onClick={saveEdit} disabled={busy} aria-label="Save"><Check size={14} /></button>
            <button className="icon-btn" onClick={() => { setEditing(false); setValue(comment.content); }} aria-label="Cancel"><X size={14} /></button>
          </div>
        ) : (
          <p>{comment.content}</p>
        )}
      </div>

      {isOwner && !editing && (
        <div className="comment-menu">
          <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Comment options">
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="dropdown menu-dropdown">
              <button onClick={() => { setEditing(true); setMenuOpen(false); }}><Pencil size={14} /> Edit</button>
              <button onClick={() => { setConfirmDelete(true); setMenuOpen(false); }} className="danger-text"><Trash2 size={14} /> Delete</button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete comment?"
        description="This cannot be undone."
        confirmLabel="Delete"
        loading={busy}
        onConfirm={confirmDeleteComment}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
