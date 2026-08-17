import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { AuditLogPage } from "../types";
import { Card, Empty, ErrorText, StatusBadge } from "../components/ui";

export function AuditLogsPage() {
  const [page, setPage] = useState<AuditLogPage | null>(null);
  const [action, setAction] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const load = useCallback(() => {
    api
      .auditLogs({ action: action || undefined, status: status || undefined, limit: 50, offset })
      .then(setPage)
      .catch((e) => setError(e.message));
  }, [action, status, offset]);

  useEffect(load, [load]);

  return (
    <div className="grid">
      <Card title="Audit log">
        <ErrorText message={error} />
        <div className="filters">
          <label>
            Action
            <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. auth.login" />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="success">success</option>
              <option value="denied">denied</option>
            </select>
          </label>
        </div>
        {page && (
          <p className="muted">
            {page.total} total entries (showing up to 50 from #{offset + 1})
          </p>
        )}
        {!page || page.items.length === 0 ? (
          <Empty text="No audit entries." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at + "Z").toLocaleString()}</td>
                  <td>{log.actor_email ?? "anonymous"}</td>
                  <td>{log.action}</td>
                  <td>
                    {log.resource_type ? `${log.resource_type}:${log.resource_id ?? ""}` : "-"}
                  </td>
                  <td>{log.ip_address ?? "-"}</td>
                  <td>
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="small">{log.details ? JSON.stringify(log.details) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="row">
          <button className="btn btn-small" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>
            Previous
          </button>
          <button className="btn btn-small" disabled={!page || offset + 50 >= page.total} onClick={() => setOffset(offset + 50)}>
            Next
          </button>
        </div>
      </Card>
    </div>
  );
}
