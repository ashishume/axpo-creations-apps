import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageShellSkeleton } from "@/components/ui";

const publicPaths = ["/login", "/signup"];

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isPublic = publicPaths.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !isPublic) {
      navigate("/login", { replace: true });
    }
  }, [loading, isAuthenticated, isPublic, navigate]);

  if (loading && !isPublic) {
    return <PageShellSkeleton />;
  }

  if (!isAuthenticated && !isPublic) {
    return null;
  }

  return <Outlet />;
}
