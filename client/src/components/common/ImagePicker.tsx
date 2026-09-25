import { useRef, useState, type ReactNode } from "react";
import { Check, Upload, UserRound } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

const AVATARS = [
  { name: "Ocean", color: "#2563eb", accent: "#38bdf8" },
  { name: "Citrus", color: "#0891b2", accent: "#67e8f9" },
  { name: "Sunrise", color: "#0284c7", accent: "#bae6fd" },
  { name: "Sky", color: "#1d4ed8", accent: "#93c5fd" },
  { name: "Mint", color: "#0f766e", accent: "#5eead4" },
  { name: "Coral", color: "#0369a1", accent: "#7dd3fc" },
  { name: "Lavender", color: "#1e40af", accent: "#a5b4fc" },
  { name: "Tide", color: "#155e75", accent: "#67e8f9" },
];

function avatarUrl(color: string, accent: string, index: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="${color}"/><circle cx="80" cy="65" r="28" fill="${accent}"/><path d="M32 145c4-35 24-53 48-53s44 18 48 53" fill="${accent}"/><circle cx="${42 + index * 9}" cy="28" r="16" fill="${accent}" opacity=".35"/><circle cx="${120 - index * 6}" cy="125" r="22" fill="${color}" opacity=".3"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function avatarFile(url: string, name: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], `${name.toLowerCase()}-avatar.svg`, { type: "image/svg+xml" });
}

interface ImagePickerProps {
  children: ReactNode;
  onSelected: (file: File, preview: string) => void;
  compact?: boolean;
}

export function ImagePicker({ children, onSelected, compact = false }: ImagePickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [avatarMode, setAvatarMode] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  function close() {
    setOpen(false);
    setAvatarMode(false);
    setSelected(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onSelected(file, URL.createObjectURL(file));
    e.target.value = "";
    close();
  }

  async function confirmAvatar() {
    if (selected === null) return;
    const avatar = AVATARS[selected];
    const preview = avatarUrl(avatar.color, avatar.accent, selected);
    onSelected(await avatarFile(preview, avatar.name), preview);
    close();
  }

  return (
    <>
      <button type="button" className={compact ? "attach-btn" : "avatar-upload"} onClick={() => setOpen(true)}>
        {children}
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
      <Modal open={open} onClose={close} title={avatarMode ? "Choose an avatar" : "Add image"} footer={avatarMode ? (
        <>
          <Button variant="ghost" onClick={() => setAvatarMode(false)}>Back</Button>
          <Button onClick={confirmAvatar} disabled={selected === null}>Use this avatar</Button>
        </>
      ) : undefined}>
        {avatarMode ? (
          <div className="avatar-picker-grid">
            {AVATARS.map((avatar, index) => {
              const isSelected = selected === index;
              return (
                <button
                  type="button"
                  key={avatar.name}
                  className={`avatar-picker-option${isSelected ? " avatar-picker-option-selected" : ""}`}
                  onClick={() => setSelected(index)}
                  aria-label={`Choose ${avatar.name} avatar`}
                >
                  <img src={avatarUrl(avatar.color, avatar.accent, index)} alt="" />
                  {isSelected && <span className="avatar-picker-check"><Check size={15} /></span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="image-source-options">
            <button type="button" className="image-source-option" onClick={() => fileRef.current?.click()}>
              <span className="image-source-icon"><Upload size={20} /></span>
              <span><strong>Upload from device</strong><small>Choose an image from your device</small></span>
            </button>
            <button type="button" className="image-source-option" onClick={() => setAvatarMode(true)}>
              <span className="image-source-icon"><UserRound size={20} /></span>
              <span><strong>Choose an avatar</strong><small>Select a Nexa avatar</small></span>
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
