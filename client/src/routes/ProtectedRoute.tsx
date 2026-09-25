import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PageSpinner } from "@/components/common/Spinner";

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return <Outlet />;
}

export function AdminRoute() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
if (Number(user?.role) !== 1) return <Navigate to="/" replace />;  return <Outlet />;
}
