import { useEffect, useState } from "react";
import { Pencil, Image as ImageIcon } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { PageSpinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import * as userApi from "@/api/user.api";
import * as postApi from "@/api/post.api";
import { getApiErrorMessage } from "@/api/axios";
import { PostCard } from "@/components/posts/PostCard";
import { EditPostModal } from "@/components/posts/EditPostModal";
import { EmptyState } from "@/components/common/EmptyState";
import { FileText } from "lucide-react";
import type { Post } from "@/types/post";
import { ImagePicker } from "@/components/common/ImagePicker";

export function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    postApi
      .getMyPosts()
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  }, []);

  if (!user) return <PageSpinner />;

  return (
    <div className="profile-page">
      <div className="card profile-header">
        <Avatar user={user} size="xl" />
        <div className="profile-header-info">
          <h2>{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username}</h2>
          {user.uniqueName && <span className="profile-username">@{user.uniqueName}</span>}
          <div className="profile-details">
            {user.email && <span>{user.email}</span>}
            {user.phoneNumber && <span>{user.phoneNumber}</span>}
            {user.age !== undefined && <span>{user.age} years old</span>}
            {user.gender && <span className="capitalize">{user.gender}</span>}
          </div>
        </div>
        <Button variant="secondary" onClick={() => setEditOpen(true)}>
          <Pencil size={16} /> Edit profile
        </Button>
      </div>

      <h3 className="section-title">My posts</h3>
      {postsLoading ? (
        <PageSpinner />
      ) : posts.length === 0 ? (
        <EmptyState icon={<FileText size={28} />} title="No posts yet" description="Anything you post will show up here." />
      ) : (
        posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onDeleted={(id) => setPosts((prev) => prev.filter((p) => p._id !== id))}
            onEdit={setEditingPost}
          />
        ))
      )}

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={async () => {
          await refreshProfile();
          showToast("Profile updated", "success");
        }}
      />
      <EditPostModal
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onUpdated={(updated) => setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))}
      />
    </div>
  );
}

function EditProfileModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [age, setAge] = useState(user?.age?.toString() ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(user?.profileImage ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      // Only send fields that actually changed.
      const payload: Parameters<typeof userApi.updateProfile>[0] = {};
      if (username !== user?.username) payload.username = username;
      if (age !== (user?.age?.toString() ?? "")) payload.age = age;
      if (phoneNumber !== user?.phoneNumber) payload.phoneNumber = phoneNumber;
      if (gender !== user?.gender) payload.gender = gender;
      if (profileImage) payload.profileImage = profileImage;

      await userApi.updateProfile(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update profile"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit profile"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Save</Button>
        </>
      }
    >
      <ImagePicker onSelected={(file, imagePreview) => {
        setProfileImage(file);
        setPreview(imagePreview);
      }}>
        {preview ? <img src={preview} alt="Profile preview" /> : <ImageIcon size={24} />}
        <span>Change photo</span>
      </ImagePicker>

      <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
      <Input label="Phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
      <div className="field">
        <label className="field-label">Gender</label>
        <select className="field-input" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}
