import { useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { TextArea } from "@/components/common/TextArea";
import * as postApi from "@/api/post.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import type { Post } from "@/types/post";
import { ImagePicker } from "@/components/common/ImagePicker";

interface EditPostModalProps {
  post: Post | null;
  onClose: () => void;
  onUpdated: (post: Post) => void;
}

export function EditPostModal({ post, onClose, onUpdated }: EditPostModalProps) {
  const [content, setContent] = useState(post?.content ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(post?.image ?? null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  if (!post) return null;

  function removeImage() {
    setImage(null);
    setPreview(null);
    setImageRemoved(true);
  }

  async function handleSubmit() {
    if (!content.trim()) {
      setError("Post content cannot be empty.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const updated = await postApi.updatePost(post!._id, {
        content: content.trim(),
        image,
        removeImage: imageRemoved,
      });
      showToast("Post updated", "success");
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update the post"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={!!post}
      onClose={onClose}
      title="Edit post"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Save changes</Button>
        </>
      }
    >
      <TextArea rows={5} value={content} error={error} onChange={(e) => setContent(e.target.value)} autoFocus />

      {preview ? (
        <div className="image-preview">
          <img src={preview} alt="Preview" />
          <button className="icon-btn image-preview-remove" onClick={removeImage}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <ImagePicker compact onSelected={(file, imagePreview) => {
          setImage(file);
          setImageRemoved(false);
          setPreview(imagePreview);
        }}>
          <ImageIcon size={18} />
          Add photo
        </ImagePicker>
      )}
    </Modal>
  );
}
