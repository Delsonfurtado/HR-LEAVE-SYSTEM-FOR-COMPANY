import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="empty">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RoleGuard({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="empty">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    return (
      <div className="card denied-card">
        <h2>Access Denied</h2>
        <p>
          Your role ({user.role}) cannot access this page. This restriction is also enforced by the
          backend API, so calling the API directly will return 403 Forbidden.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
