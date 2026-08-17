import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { LeaveRequest, User } from "../types";
import { Card, Empty, ErrorText, StatusBadge } from "../components/ui";

export function ManagerPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [error, setError] = useState<string | null>(null);
  const [decisionFor, setDecisionFor] = useState<LeaveRequest | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const query = filter === "pending" ? "pending" : undefined;
    api.managerRequests(query).then(setRequests).catch((e) => setError(e.message));
    api.managerTeam().then(setTeam).catch(() => undefined);
  }, [filter]);

  useEffect(load, [load]);

  const decide = async (id: number, action: "approve" | "reject") => {
    setBusy(true);
    setError(null);
    try {
      await api.decide(id, action, comment);
      setDecisionFor(null);
      setComment("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid">
      <Card title="Team">
        {team.length === 0 ? (
          <Empty text="No team members found." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.id}>
                  <td>{m.full_name}</td>
                  <td>{m.email}</td>
                  <td>{m.role}</td>
                  <td>{m.is_active ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Leave requests">
        <ErrorText message={error} />
        <div className="tabs">
          <button className={filter === "pending" ? "tab active" : "tab"} onClick={() => setFilter("pending")}>
            Pending
          </button>
          <button className={filter === "all" ? "tab active" : "tab"} onClick={() => setFilter("all")}>
            All
          </button>
        </div>
        {requests.length === 0 ? (
          <Empty text="Nothing to show." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.employee_name}</td>
                  <td>{r.leave_type_name}</td>
                  <td>{r.start_date}</td>
                  <td>{r.end_date}</td>
                  <td>{r.days}</td>
                  <td>{r.reason}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    {r.status === "pending" && r.employee_id !== team.find((t) => t.role === "manager")?.id && (
                      <button className="btn btn-small" onClick={() => setDecisionFor(r)}>
                        Decide
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {decisionFor && (
          <div className="decision-box">
            <h3>
              {decisionFor.employee_name}: {decisionFor.start_date} to {decisionFor.end_date} (
              {decisionFor.days} day(s))
            </h3>
            <textarea
              placeholder="Decision comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
            <div className="row">
              <button className="btn btn-primary" disabled={busy} onClick={() => decide(decisionFor.id, "approve")}>
                Approve
              </button>
              <button className="btn btn-danger" disabled={busy} onClick={() => decide(decisionFor.id, "reject")}>
                Reject
              </button>
              <button className="btn btn-ghost" onClick={() => setDecisionFor(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
