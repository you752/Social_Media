import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import * as userApi from "@/api/user.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";

const MAX_COVER_SIZE = 5 * 1024 * 1024;

interface CoverImageProps {
  cover?: string;
  editable?: boolean;
  onCoverChange?: (cover: string) => void;
}

export function CoverImage({ cover, editable = false, onCoverChange }: CoverImageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > MAX_COVER_SIZE) {
      setError("Cover images must be 5MB or smaller.");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const result = await userApi.updateCover(file);
      onCoverChange?.(result.cover);
      showToast("Cover image updated", "success");
    } catch (uploadError) {
      const message = getApiErrorMessage(uploadError, "Could not upload cover image");
      setError(message);
      showToast(message, "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`profile-cover${cover ? " profile-cover-has-image" : ""}${editable ? " profile-cover-editable group" : ""}`}>
      {cover && <img className="profile-cover-image" src={cover} alt="" />}
      {editable && (
        <div className="profile-cover-overlay">
          <input
            ref={inputRef}
            className="profile-cover-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            aria-label="Choose a cover image"
          />
          <div className="profile-cover-controls">
            <button
              type="button"
              className="profile-cover-button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Camera size={16} />
              {uploading ? "Uploading..." : cover ? "Change cover" : "Add cover"}
            </button>
            {error && <p className="profile-cover-error" role="alert">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
