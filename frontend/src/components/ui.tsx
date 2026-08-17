import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { RequestStatus, Role } from "../types";
import { IcCheck, IcInfo, IcX } from "./icons";

/* ---------- badges ---------- */

const BADGE_CLASS: Record<string, string> = {
  approved: "badge badge-green",
  success: "badge badge-green",
  rejected: "badge badge-red",
  denied: "badge badge-red",
  pending: "badge badge-amber",
  cancelled: "badge badge-gray",
};

export function StatusBadge({ status }: { status: RequestStatus | string }) {
  const cls = BADGE_CLASS[status] ?? "badge";
  return (
    <span className={cls}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}

const ROLE_CLASS: Record<Role, string> = {
  admin: "badge badge-gold",
  hr: "badge badge-indigo",
  manager: "badge badge-green",
  employee: "badge badge-sky",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={ROLE_CLASS[role] ?? "badge"}>
      <span className="badge-dot" />
      {role}
    </span>
  );
}

/* ---------- layout pieces ---------- */

export function Card({
  title,
  actions,
  children,
  hover,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  hover?: boolean;
}) {
  return (
    <section className={`card${hover ? " card-hover" : ""}`}>
      {(title || actions) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="error">{message}</p>;
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <IcInfo size={16} />
      {text}
    </div>
  );
}

/* ---------- skeletons ---------- */

export function Skeleton({ h = 14, w }: { h?: number; w?: number | string }) {
  return <div className="skeleton" style={{ height: h, width: w }} />;
}

export function TableSkeleton({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrap">
      {Array.from({ length: rows }).map((_, r) => (
        <div className="skel-row" key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} h={13} w={`${85 / cols}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- progress ---------- */

export function ProgressBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const tone = pct >= 90 ? "tone-red" : pct >= 65 ? "tone-amber" : "tone-indigo";
  return (
    <div className="pbar">
      <div className={`pbar-fill ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------- modal ---------- */

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ---------- toasts ---------- */

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === "success" ? (
              <IcCheck size={17} />
            ) : t.type === "error" ? (
              <IcX size={17} />
            ) : (
              <IcInfo size={17} />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
