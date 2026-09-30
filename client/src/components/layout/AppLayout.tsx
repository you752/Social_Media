import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { SuggestedPanel } from "@/components/SuggestedPanel";

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <div className="app-content-layout">
          <main className="app-content">
            <Outlet />
          </main>
          <SuggestedPanel />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
