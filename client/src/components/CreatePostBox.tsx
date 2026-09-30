import { useEffect, useState } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import * as postApi from "@/api/post.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import type { User } from "@/types/user";
import type { Post } from "@/types/post";

interface CreatePostBoxProps {
  user: User;
  onCreated: (post: Post) => void;
}

export function CreatePostBox({ user, onCreated }: CreatePostBoxProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const canPost = Boolean(content.trim() || image);
  const firstName = user.firstName || user.username || "there";

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canPost || submitting) return;
    setSubmitting(true);
    try {
      const post = await postApi.createPost({ content: content.trim(), image });
      onCreated(post);
      setContent("");
      setImage(null);
      setPreview(null);
      showToast("Post created", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not create the post"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="create-post-box card" onSubmit={submit}>
      <div className="create-post-input-row">
        <Avatar user={user} size="md" />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={`What's on your mind, ${firstName}?`}
          aria-label="Create a post"
          maxLength={5000}
          rows={2}
        />
      </div>
      {preview && (
        <div className="create-post-preview">
          <img src={preview} alt="Post attachment preview" />
          <button
            type="button"
            className="icon-btn"
            aria-label="Remove photo"
            onClick={() => { setImage(null); setPreview(null); }}
          >
            <X size={17} />
          </button>
        </div>
      )}
      <div className="create-post-actions">
        <label className="create-post-photo">
          <ImagePlus size={17} /> Photo
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setImage(file);
                setPreview(URL.createObjectURL(file));
              }
              event.target.value = "";
            }}
          />
        </label>
        <Button type="submit" disabled={!canPost || submitting} loading={submitting}>
          <Send size={15} /> Post
        </Button>
      </div>
    </form>
  );
}
