import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { Layout } from "./components/Layout";
import { ProtectedRoute, RoleGuard } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MyLeavePage } from "./pages/MyLeavePage";
import { NewRequestPage } from "./pages/NewRequestPage";
import { ManagerPage } from "./pages/ManagerPage";
import { HrPage } from "./pages/HrPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/leave" element={<MyLeavePage />} />
            <Route path="/leave/new" element={<NewRequestPage />} />
            <Route
              path="/manager"
              element={
                <RoleGuard roles={["manager", "admin"]}>
                  <ManagerPage />
                </RoleGuard>
              }
            />
            <Route
              path="/hr"
              element={
                <RoleGuard roles={["hr", "admin"]}>
                  <HrPage />
                </RoleGuard>
              }
            />
            <Route
              path="/admin"
              element={
                <RoleGuard roles={["admin"]}>
                  <AdminUsersPage />
                </RoleGuard>
              }
            />
            <Route
              path="/audit"
              element={
                <RoleGuard roles={["hr", "admin"]}>
                  <AuditLogsPage />
                </RoleGuard>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
