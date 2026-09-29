import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PageSpinner } from "@/components/common/Spinner";
import { UserRoleEnum } from "@/types/user";

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (isAuthenticated) {
    return (
      <Navigate
        to={Number(user?.role) === UserRoleEnum.ADMIN ? "/admin" : "/home"}
        replace
      />
    );
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (Number(user?.role) !== UserRoleEnum.ADMIN) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}
