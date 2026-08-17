import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { RoleBadge } from "./ui";
import {
  IcCalendar,
  IcChart,
  IcCog,
  IcGrid,
  IcLogout,
  IcPlus,
  IcShield,
  IcUsers,
} from "./icons";

interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
  roles: string[];
}

const ALL = ["employee", "manager", "hr", "admin"];

const NAV_MAIN: NavItem[] = [
  { to: "/", label: "Dashboard", icon: <IcGrid />, roles: ALL },
  { to: "/leave", label: "My Leave", icon: <IcCalendar />, roles: ALL },
  { to: "/leave/new", label: "New Request", icon: <IcPlus />, roles: ALL },
];

const NAV_MANAGE: NavItem[] = [
  { to: "/manager", label: "Team Approvals", icon: <IcUsers />, roles: ["manager", "admin"] },
  { to: "/hr", label: "HR Reports", icon: <IcChart />, roles: ["hr", "admin"] },
  { to: "/admin", label: "User Accounts", icon: <IcCog />, roles: ["admin"] },
  { to: "/audit", label: "Audit Trail", icon: <IcShield />, roles: ["hr", "admin"] },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const role = user.role;
  const main = NAV_MAIN.filter((item) => item.roles.includes(role));
  const manage = NAV_MANAGE.filter((item) => item.roles.includes(role));

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const close = () => setOpen(false);

  return (
    <div className="app-shell">
      {open && <div className="side-backdrop" onClick={close} />}
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="side-brand">
          <div className="logo-mark">SL</div>
          <div className="side-brand-text">
            Secure Leave
            <span>Management System</span>
          </div>
        </div>

        <div className="side-section">Workspace</div>
        <nav className="side-nav">
          {main.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "side-link active" : "side-link")}
              onClick={close}
              end={item.to === "/"}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {manage.length > 0 && (
          <>
            <div className="side-section">Administration</div>
            <nav className="side-nav">
              {manage.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? "side-link active" : "side-link")}
                  onClick={close}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </>
        )}

        <div className="side-footer">
          <div className="side-user">
            <div className="avatar">{initials(user.full_name)}</div>
            <div className="side-user-meta">
              <strong>{user.full_name}</strong>
              <span>{user.email}</span>
            </div>
            <RoleBadge role={user.role} />
          </div>
          <button className="logout-btn" onClick={logout}>
            <IcLogout />
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
            <IcGrid size={17} />
          </button>
          <div className="topbar-date">{dateLabel}</div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
