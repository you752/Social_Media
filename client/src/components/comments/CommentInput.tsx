import { useState } from "react";
import { Send } from "lucide-react";
import * as commentApi from "@/api/comment.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import type { Comment } from "@/types/post";

interface CommentInputProps {
  postId: string;
  onCreated: (comment: Comment) => void;
}

export function CommentInput({ postId, onCreated }: CommentInputProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = value.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      const comment = await commentApi.createComment({ postId, content });
      onCreated(comment);
      setValue("");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not post comment"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="comment-input" onSubmit={handleSubmit}>
      <input
        placeholder="Write a comment..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={submitting}
      />
      <button type="submit" className="icon-btn" disabled={submitting || !value.trim()} aria-label="Send comment">
        <Send size={16} />
      </button>
    </form>
  );
}
