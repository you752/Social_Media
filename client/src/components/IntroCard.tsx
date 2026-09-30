import { Copy } from "lucide-react";
import { formatDate } from "@/utils/date";
import { useToast } from "@/hooks/useToast";
import type { User } from "@/types/user";

export function IntroCard({ user }: { user: User }) {
  const { showToast } = useToast();
  const details = [
    ["Username", user.uniqueName ? `@${user.uniqueName}` : user.username || "—"],
    ["Email", user.email || "—"],
    ["Gender", user.gender || "—"],
    ["Member since", formatDate(user.createdAt) || "—"],
  ];

  async function copyProfileLink() {
    const username = user.uniqueName || user.username;
    if (!username) {
      showToast("This profile does not have a username yet", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/u/${encodeURIComponent(username)}`);
      showToast("Profile link copied", "success");
    } catch {
      showToast("Could not copy profile link", "error");
    }
  }

  return (
    <section className="intro-card card">
      <h2>Intro</h2>
      <dl>
        {details.map(([label, value]) => (
          <div className="intro-detail" key={label}>
            <dt>{label}</dt><dd>{value}</dd>
          </div>
        ))}
      </dl>
      <button type="button" className="copy-profile-button" onClick={copyProfileLink}>
        <Copy size={16} /> Copy profile link
      </button>
    </section>
  );
}
