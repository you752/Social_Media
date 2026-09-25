import { useEffect, useState } from "react";
import * as commentApi from "@/api/comment.api";
import { CommentItem } from "./CommentItem";
import { CommentInput } from "./CommentInput";
import { Spinner } from "@/components/common/Spinner";
import type { Comment } from "@/types/post";

interface CommentListProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

export function CommentList({ postId, onCommentCountChange }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const syncCount = (nextComments: Comment[]) => {
    onCommentCountChange?.(nextComments.length);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    commentApi
      .getCommentsForPost(postId)
      .then((data) => {
        if (!active) return;
        const nextComments = Array.isArray(data) ? data : [];
        setComments(nextComments);
        syncCount(nextComments);
      })
      .catch(() => {
        if (!active) return;
        setComments([]);
        syncCount([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [postId]);

  return (
    <div className="comment-list">
      {loading ? (
        <Spinner size={18} />
      ) : (
        comments.map((c) => (
          <CommentItem
            key={c._id}
            comment={c}
            onUpdated={(updated) => setComments((prev) => {
              const nextComments = prev.map((x) => (x._id === updated._id ? updated : x));
              syncCount(nextComments);
              return nextComments;
            })}
            onDeleted={(id) => setComments((prev) => {
              const nextComments = prev.filter((x) => x._id !== id);
              syncCount(nextComments);
              return nextComments;
            })}
          />
        ))
      )}
      <CommentInput
        postId={postId}
        onCreated={(c) => setComments((prev) => {
          const nextComments = [...prev, c];
          syncCount(nextComments);
          return nextComments;
        })}
      />
    </div>
  );
}
