import { useEffect, useState } from "react";
import { Activity, FileText, MessageSquare, ShieldAlert, Users } from "lucide-react";
import * as adminApi from "@/api/admin.api";

const labels: Record<string, { label: string; icon: typeof Users }> = {
  totalUsers: { label: "Total users", icon: Users },
  totalPosts: { label: "Total posts", icon: FileText },
  totalComments: { label: "Total comments", icon: MessageSquare },
  activeUsers: { label: "Active users", icon: Activity },
  blockedUsers: { label: "Blocked users", icon: ShieldAlert },
  verifiedUsers: { label: "Verified users", icon: Users },
};

export function AdminDashboardPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.getDashboard>>>();
  useEffect(() => { adminApi.getDashboard().then(setData).catch(console.error); }, []);
  return <section className="admin-page"><header><div><p className="admin-eyebrow">NEXA CONTROL CENTER</p><h1>Dashboard overview</h1><p className="admin-muted">Monitor your community and keep Nexa healthy.</p></div></header>
    <div className="admin-stat-grid">{Object.entries(labels).map(([key, item]) => { const Icon = item.icon; return <div className="admin-stat" key={key}><Icon size={20} /><span>{item.label}</span><strong>{data?.stats[key] ?? "—"}</strong></div>; })}</div>
    <div className="admin-panel"><h2>Recent activity</h2><div className="admin-activity">{(data?.recentUsers || []).map((user) => <div key={String(user._id)}><Users size={16} /><span><strong>{String(user.username || user.email || "New user")}</strong> joined Nexa</span></div>)}{!data?.recentUsers?.length && <p className="admin-muted">No recent activity.</p>}</div></div>
  </section>;
}

type Resource = "users" | "posts" | "comments";
export function AdminResourcePage({ resource }: { resource: Resource }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<any>();
  const load = () => (resource === "users" ? adminApi.getUsers({ page, limit: 10, search }) : resource === "posts" ? adminApi.getPosts({ page, limit: 10, search }) : adminApi.getComments({ page, limit: 10, search })).then(setResult).catch(console.error);
  useEffect(() => { void load(); }, [resource, page]);
  const items = result?.[resource] || [];
  const remove = async (id: string, actionType: string) => { 
    if (!window.confirm("This action cannot be undone. Continue?")) return; 
    if (resource === "posts") await adminApi.deletePost(id); 
    if (resource === "comments") await adminApi.deleteComment(id); 
    if (resource === "users") {
       if (actionType === "block") await adminApi.setUserBlocked(id, true);
       if (actionType === "unblock") await adminApi.setUserBlocked(id, false);
    }
    await load(); 
  };
  return <section className="admin-page"><header><div><p className="admin-eyebrow">MANAGEMENT</p><h1>{resource[0].toUpperCase() + resource.slice(1)}</h1><p className="admin-muted">Search, review, and moderate {resource}.</p></div></header>
    <div className="admin-panel"><div className="admin-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (setPage(1), void load())} placeholder={`Search ${resource}...`} /><button onClick={() => { setPage(1); void load(); }}>Search</button></div>
      <div className="admin-table-wrap"><table><thead><tr><th>Content</th><th>Owner</th><th>Created</th><th>Action</th></tr></thead><tbody>{items.map((item: any) => <tr key={String(item._id)}><td>{String(item.content || item.username || item.email || "—").slice(0, 90)}</td><td>{String(item.user?.username || item.user?.email || item.email || "—")}</td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td><td><div className="admin-actions-cell">{resource === "users" ? (item.isBlocked ? <button className="admin-success" onClick={() => void remove(String(item._id), "unblock")}>Unblock</button> : <button className="admin-danger" onClick={() => void remove(String(item._id), "block")}>Block</button>) : <button className="admin-danger" onClick={() => void remove(String(item._id), "delete")}>Delete</button>}</div></td></tr>)}</tbody></table>{!items.length && <p className="admin-empty">No records found.</p>}</div>
      <div className="admin-pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {result?.totalPages || 1}</span><button disabled={page >= (result?.totalPages || 1)} onClick={() => setPage(page + 1)}>Next</button></div>
    </div></section>;
}
