import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bookmark, FileText, Info, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ImagePicker } from "@/components/common/ImagePicker";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { PostSkeleton, Skeleton } from "@/components/common/Skeleton";
import { CreatePostBox } from "@/components/CreatePostBox";
import { FeedColumn } from "@/components/FeedColumn";
import { IntroCard } from "@/components/IntroCard";
import { ProfileHeader, type ProfileTab } from "@/components/ProfileHeader";
import { PostCard } from "@/components/posts/PostCard";
import { EditPostModal } from "@/components/posts/EditPostModal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import * as friendApi from "@/api/friend.api";
import * as postApi from "@/api/post.api";
import * as userApi from "@/api/user.api";
import { getApiErrorMessage } from "@/api/axios";
import type { Post } from "@/types/post";
import type { User, UserProfile } from "@/types/user";

export function ProfilePage() {
  const { userId, username: routeUsername } = useParams();
  const { user, refreshProfile, setUser, logout } = useAuth();
  const { showToast } = useToast();
  const isOwnProfile = !userId && !routeUsername;
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [friendsCount, setFriendsCount] = useState<number | null>(null);
  const [postsError, setPostsError] = useState(false);
  const [bookmarksError, setBookmarksError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [editOpen, setEditOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (isOwnProfile) {
      if (!user) {
        setLoading(false);
        return () => { active = false; };
      }
      Promise.allSettled([
        postApi.getMyPosts(),
        postApi.getBookmarks(),
        friendApi.getFriends(),
      ]).then(([postsResult, bookmarksResult, friendsResult]) => {
          if (!active) return;
          if (postsResult.status === "fulfilled") {
            setPosts(postsResult.value);
            setPostsError(false);
          } else {
            setPostsError(true);
            showToast(getApiErrorMessage(postsResult.reason, "Could not load your posts"), "error");
          }
          if (bookmarksResult.status === "fulfilled") {
            setBookmarks(bookmarksResult.value);
            setBookmarksError(false);
          } else {
            setBookmarksError(true);
            showToast(getApiErrorMessage(bookmarksResult.reason, "Could not load bookmarks"), "error");
          }
          if (friendsResult.status === "fulfilled") setFriendsCount(friendsResult.value.length);
          else showToast(getApiErrorMessage(friendsResult.reason, "Could not load friends"), "error");
        })
        .finally(() => { if (active) setLoading(false); });
    } else {
      const profileRequest = userId
        ? userApi.getUserProfile(userId)
        : userApi.getUserProfileByUsername(routeUsername || "");
      profileRequest
        .then((profile) => {
          if (!active) return;
          setPublicProfile(profile);
          setPosts(Array.isArray(profile.posts) ? profile.posts : []);
          setFriendsCount(profile.friendsCount ?? 0);
          setPostsError(false);
        })
        .catch((error: unknown) => {
          if (!active) return;
          setPublicProfile(null);
          showToast(getApiErrorMessage(error, "Could not load profile"), "error");
        })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [isOwnProfile, routeUsername, showToast, user, userId]);

  const profileUser = (isOwnProfile ? user : publicProfile) as User | null;
  const displayedPosts = useMemo(
    () => activeTab === "bookmarks" ? bookmarks : posts,
    [activeTab, bookmarks, posts],
  );

  if (loading) return <ProfileSkeleton />;
  if (!profileUser) {
    return <EmptyState icon={<FileText size={25} />} title="Profile unavailable" description="This profile could not be loaded." />;
  }

  const fullName = [profileUser.firstName, profileUser.lastName].filter(Boolean).join(" ") || profileUser.username || "Wave user";
  const totalBookmarks = isOwnProfile ? bookmarksError ? null : bookmarks.length : null;

  return (
    <div className="profile-page">
      <ProfileHeader
        user={profileUser}
        friendsCount={friendsCount}
        postsCount={postsError ? null : posts.length}
        bookmarksCount={totalBookmarks}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onEdit={isOwnProfile ? () => setEditOpen(true) : undefined}
        onCoverChange={isOwnProfile ? (cover) => {
          setUser({ ...profileUser, cover });
        } : undefined}
      />
      {isOwnProfile && (
        <nav className="mobile-profile-actions" aria-label="Account actions">
          <Link to="/bookmarks"><Bookmark size={18} /> Saved posts</Link>
          <Link to="/settings"><Settings size={18} /> Settings</Link>
          <button type="button" onClick={() => void logout()}><LogOut size={18} /> Logout</button>
        </nav>
      )}
      <div className="profile-content-grid">
        <IntroCard user={profileUser} />
        <FeedColumn>
          {activeTab === "posts" && isOwnProfile && (
            <CreatePostBox
              user={profileUser}
              onCreated={(post) => {
                setPostsError(false);
                setPosts((current) => [post, ...current]);
              }}
            />
          )}
          {activeTab === "about" ? (
            profileUser.bio ? (
              <section className="profile-bio-card card">
                <h2><Info size={18} /> About</h2>
                <p>{profileUser.bio}</p>
              </section>
            ) : <IntroCard user={profileUser} />
          ) : !isOwnProfile && activeTab === "bookmarks" ? (
            <EmptyState icon={<Info size={25} />} title="Bookmarks are private" description="Only this person can see their bookmarks." />
          ) : loading ? (
            <><PostSkeleton /><PostSkeleton /></>
          ) : (activeTab === "posts" && postsError) || (activeTab === "bookmarks" && bookmarksError) ? (
            <EmptyState
              icon={<Info size={25} />}
              title={`Could not load ${activeTab}`}
              description="Please refresh the page and try again."
            />
          ) : displayedPosts.length === 0 ? (
            <EmptyState
              icon={<FileText size={25} />}
              title={activeTab === "bookmarks" ? "No bookmarks yet" : "No posts yet"}
              description={activeTab === "bookmarks"
                ? "Posts you bookmark will show up here."
                : `When ${fullName} shares something, it will show up right here.`}
            />
          ) : (
            displayedPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDeleted={(id) => setPosts((current) => current.filter((item) => item._id !== id))}
                onEdit={isOwnProfile ? setEditingPost : undefined}
              />
            ))
          )}
        </FeedColumn>
      </div>
      {isOwnProfile && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={async () => {
            await refreshProfile();
            showToast("Profile updated", "success");
          }}
        />
      )}
      <EditPostModal
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onUpdated={(updated) => setPosts((current) => current.map((post) => post._id === updated._id ? updated : post))}
      />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="profile-page" aria-label="Loading profile" aria-busy="true">
      <section className="profile-loading-card card">
        <Skeleton className="profile-loading-cover" />
        <div className="profile-loading-copy">
          <Skeleton className="skeleton-avatar" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line" />
        </div>
      </section>
      <div className="profile-content-grid">
        <Skeleton className="profile-loading-intro" />
        <FeedColumn><PostSkeleton /><PostSkeleton /></FeedColumn>
      </div>
    </div>
  );
}

function EditProfileModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void | Promise<void> }) {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [age, setAge] = useState(user?.age?.toString() ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(user?.profileImage ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setUsername(user?.username ?? "");
    setAge(user?.age?.toString() ?? "");
    setPhoneNumber(user?.phoneNumber ?? "");
    setGender(user?.gender ?? "");
    setBio(user?.bio ?? "");
    setPreview(user?.profileImage ?? null);
    setProfileImage(null);
  }, [open, user]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload: Parameters<typeof userApi.updateProfile>[0] = {};
      if (username !== user?.username) payload.username = username;
      if (age !== (user?.age?.toString() ?? "")) payload.age = age;
      if (phoneNumber !== user?.phoneNumber) payload.phoneNumber = phoneNumber;
      if (gender !== user?.gender) payload.gender = gender;
      if (bio !== (user?.bio ?? "")) payload.bio = bio;
      if (profileImage) payload.profileImage = profileImage;

      await userApi.updateProfile(payload);
      await onSaved();
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
        {preview ? <img src={preview} alt="Profile preview" /> : <FileText size={24} />}
        <span>Change photo</span>
      </ImagePicker>
      <Input label="Name" value={username} onChange={(event) => setUsername(event.target.value)} />
      <Input label="Age" type="number" value={age} onChange={(event) => setAge(event.target.value)} />
      <Input label="Phone number" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
      <div className="field">
        <label className="field-label" htmlFor="profile-gender">Gender</label>
        <select id="profile-gender" className="field-input" value={gender} onChange={(event) => setGender(event.target.value)}>
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="profile-bio">Bio</label>
        <textarea id="profile-bio" className="field-input field-textarea" value={bio} maxLength={500} onChange={(event) => setBio(event.target.value)} />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </Modal>
  );
}
