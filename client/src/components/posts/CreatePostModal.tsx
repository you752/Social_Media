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

const MAX_LENGTH = 5000;

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (post: Post) => void;
}

export function CreatePostModal({ open, onClose, onCreated }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  function reset() {
    setContent("");
    setImage(null);
    setPreview(null);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!content.trim()) {
      setError("Write something before posting.");
      return;
    }
    if (content.length > MAX_LENGTH) {
      setError(`Posts can be at most ${MAX_LENGTH} characters.`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const post = await postApi.createPost({ content: content.trim(), image });
      showToast("Post created", "success");
      onCreated(post);
      handleClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create the post"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create post"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Post</Button>
        </>
      }
    >
      <TextArea
        placeholder="What is on your mind?"
        rows={5}
        value={content}
        maxLength={MAX_LENGTH}
        error={error}
        onChange={(e) => setContent(e.target.value)}
        autoFocus
      />
      <div className="char-counter">{content.length}/{MAX_LENGTH}</div>

      {preview ? (
        <div className="image-preview">
          <img src={preview} alt="Preview" />
          <button className="icon-btn image-preview-remove" onClick={() => { setImage(null); setPreview(null); }}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <ImagePicker compact onSelected={(file, imagePreview) => {
          setImage(file);
          setPreview(imagePreview);
        }}>
          <ImageIcon size={18} />
          Add photo
        </ImagePicker>
      )}
    </Modal>
  );
}
