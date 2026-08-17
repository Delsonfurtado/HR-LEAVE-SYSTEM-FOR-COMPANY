export type Role = "employee" | "manager" | "hr" | "admin";

export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  department_id: number | null;
  department_name: string | null;
  is_active: boolean;
}

export interface LeaveType {
  id: number;
  code: string;
  name: string;
  default_days: number;
  requires_document: boolean;
  is_active: boolean;
}

export interface Department {
  id: number;
  name: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  leave_type_id: number;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: RequestStatus;
  decision_comment: string | null;
  decided_by_name: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface Balance {
  leave_type_id: number;
  leave_type_name: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
}

export interface AuditLog {
  id: number;
  actor_id: number | null;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  status: string;
  created_at: string;
}

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
}

export interface LeaveReportItem {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  department: string | null;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  days: number;
  status: RequestStatus;
  created_at: string;
}

export interface LeaveReport {
  items: LeaveReportItem[];
  summary: {
    total_requests: number;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    approved_days: number;
    by_type: Record<string, number>;
  };
}
