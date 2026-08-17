import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { RoleBadge } from "./ui";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links: { to: string; label: string }[] = [
    { to: "/", label: "Dashboard" },
    { to: "/leave", label: "My Leave" },
    { to: "/leave/new", label: "New Request" },
  ];
  if (user?.role === "manager") links.push({ to: "/manager", label: "Team Approvals" });
  if (user?.role === "hr") {
    links.push({ to: "/hr", label: "HR Reports" });
    links.push({ to: "/audit", label: "Audit Logs" });
  }
  if (user?.role === "admin") {
    links.push({ to: "/admin", label: "Users" });
    links.push({ to: "/audit", label: "Audit Logs" });
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">Secure Leave Management</div>
        <div className="userbox">
          {user && (
            <>
              <span>
                {user.full_name} <RoleBadge role={user.role} />
              </span>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </header>
      <nav className="nav">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
