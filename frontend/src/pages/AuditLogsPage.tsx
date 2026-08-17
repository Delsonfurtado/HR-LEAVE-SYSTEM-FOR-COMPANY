import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { AuditLogPage } from "../types";
import { Card, Empty, ErrorText, StatusBadge, TableSkeleton } from "../components/ui";

export function AuditLogsPage() {
  const [page, setPage] = useState<AuditLogPage | null>(null);
  const [action, setAction] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .auditLogs({ action: action || undefined, status: status || undefined, limit: 50, offset })
      .then((data) => {
        setPage(data);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [action, status, offset]);

  useEffect(load, [load]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            Audit <span className="gradient-text">Trail</span>
          </h1>
          <p className="sub">
            Every security-relevant event: logins, decisions, changes and denied attempts
          </p>
        </div>
        {page && <span className="chip">{page.total} total events</span>}
      </div>

      <div className="grid">
        <Card>
          <ErrorText message={error} />
          <div className="filters">
            <label>
              Action
              <input
                value={action}
                onChange={(e) => {
                  setOffset(0);
                  setAction(e.target.value);
                }}
                placeholder="e.g. auth.login, leave.approve"
              />
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(e) => {
                  setOffset(0);
                  setStatus(e.target.value);
                }}
              >
                <option value="">All</option>
                <option value="success">success</option>
                <option value="denied">denied</option>
              </select>
            </label>
          </div>

          {loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : !page || page.items.length === 0 ? (
            <Empty text="No audit entries match the filters." />
          ) : (
            <div className="table-wrap">
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
                      <td className="small">
                        {new Date(log.created_at + "Z").toLocaleString()}
                      </td>
                      <td>{log.actor_email ?? "anonymous"}</td>
                      <td>
                        <span className="chip" style={{ fontSize: 11.5, padding: "4px 10px" }}>
                          {log.action}
                        </span>
                      </td>
                      <td className="small">
                        {log.resource_type ? `${log.resource_type}:${log.resource_id ?? ""}` : "-"}
                      </td>
                      <td className="mono">{log.ip_address ?? "-"}</td>
                      <td>
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="mono muted" title={log.details ? JSON.stringify(log.details) : ""}>
                        {log.details
                          ? JSON.stringify(log.details).length > 44
                            ? JSON.stringify(log.details).slice(0, 44) + "..."
                            : JSON.stringify(log.details)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pagination">
            <button
              className="btn btn-small"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - 50))}
            >
              Previous
            </button>
            <button
              className="btn btn-small"
              disabled={!page || offset + 50 >= page.total}
              onClick={() => setOffset(offset + 50)}
            >
              Next
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
