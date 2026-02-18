import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 w-10 h-10 border-2 border-indigo-600 border-t-transparent" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isPublic) {
    return null;
  }

  return <Outlet />;
}
