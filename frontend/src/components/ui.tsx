import type { ReactNode } from "react";
import type { RequestStatus, Role } from "../types";

export function StatusBadge({ status }: { status: RequestStatus | string }) {
  const cls =
    status === "approved" || status === "success"
      ? "badge badge-green"
      : status === "rejected"
        ? "badge badge-red"
        : status === "pending"
          ? "badge badge-amber"
          : status === "cancelled"
            ? "badge badge-gray"
            : status === "denied"
              ? "badge badge-red"
              : "badge";
  return <span className={cls}>{status}</span>;
}

export function RoleBadge({ role }: { role: Role }) {
  return <span className="badge badge-role">{role}</span>;
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="card">
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="error">{message}</p>;
}

export function Empty({ text }: { text: string }) {
  return <p className="empty">{text}</p>;
}
