import type {
  AuditLogPage,
  Balance,
  Department,
  LeaveReport,
  LeaveRequest,
  LeaveType,
  TokenPair,
  User,
} from "../types";

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const TOKEN_KEY = "slm_access";
const REFRESH_KEY = "slm_refresh";

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  sessionStorage.setItem(TOKEN_KEY, access);
  sessionStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function tryRefresh(): Promise<boolean> {
  const refresh = sessionStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) return false;
  const data: TokenPair = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return true;
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry && (await tryRefresh())) {
    return request<T>(path, options, false);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.detail) {
        message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export const api = {
  login: (email: string, password: string) =>
    request<TokenPair>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () =>
    request<{ detail: string }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: sessionStorage.getItem(REFRESH_KEY) }),
    }),
  me: () => request<User>("/auth/me"),

  leaveTypes: () => request<LeaveType[]>("/meta/leave-types"),
  departments: () => request<Department[]>("/meta/departments"),
  adminDepartments: () => request<Department[]>("/admin/departments"),

  myRequests: () => request<LeaveRequest[]>("/leave/requests"),
  submitRequest: (body: { leave_type_id: number; start_date: string; end_date: string; reason: string }) =>
    request<LeaveRequest>("/leave/requests", { method: "POST", body: JSON.stringify(body) }),
  cancelRequest: (id: number) => request<LeaveRequest>(`/leave/requests/${id}/cancel`, { method: "POST" }),
  myBalances: () => request<Balance[]>("/leave/balance"),

  managerTeam: () => request<User[]>("/manager/team"),
  managerRequests: (status?: string) => request<LeaveRequest[]>(`/manager/requests${qs({ status_filter: status })}`),
  decide: (id: number, action: "approve" | "reject", comment?: string) =>
    request<LeaveRequest>(`/manager/requests/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ action, comment: comment || null }),
    }),

  hrReport: (params: { start?: string; end?: string; department_id?: number }) =>
    request<LeaveReport>(`/hr/reports/leave${qs(params as Record<string, string | number | undefined>)}`),
  hrLeaveTypes: () => request<LeaveType[]>("/hr/leave-types"),
  createLeaveType: (body: { code: string; name: string; default_days: number; requires_document: boolean }) =>
    request<LeaveType>("/hr/leave-types", { method: "POST", body: JSON.stringify(body) }),
  updateLeaveType: (id: number, body: Partial<LeaveType>) =>
    request<LeaveType>(`/hr/leave-types/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  adjustBalance: (body: { employee_id: number; leave_type_id: number; year: number; total_days: number }) =>
    request<Balance>("/hr/balances/adjust", { method: "POST", body: JSON.stringify(body) }),

  adminUsers: () => request<User[]>("/admin/users"),
  createUser: (body: {
    email: string;
    full_name: string;
    password: string;
    role: string;
    department_id: number | null;
  }) => request<User>("/admin/users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (id: number, body: Record<string, unknown>) =>
    request<User>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  resetPassword: (id: number, new_password: string) =>
    request<{ detail: string }>(`/admin/users/${id}/password`, {
      method: "PUT",
      body: JSON.stringify({ new_password }),
    }),

  auditLogs: (params: { action?: string; status?: string; limit?: number; offset?: number }) =>
    request<AuditLogPage>(`/audit/logs${qs(params as Record<string, string | number | undefined>)}`),
};
