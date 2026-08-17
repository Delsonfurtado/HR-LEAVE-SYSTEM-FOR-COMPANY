import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import type { LeaveRequest, User } from "../types";
import { Card, Empty, ErrorText, Modal, StatusBadge, TableSkeleton, useToast } from "../components/ui";
import { IcCheck, IcX } from "../components/icons";

export function ManagerPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [decisionFor, setDecisionFor] = useState<LeaveRequest | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const query = filter === "pending" ? "pending" : undefined;
    Promise.all([
      api.managerRequests(query).catch((e) => setError(e.message)),
      api.managerTeam().catch(() => undefined),
    ]).then(([requestData, teamData]) => {
      if (Array.isArray(requestData)) setRequests(requestData);
      if (Array.isArray(teamData)) setTeam(teamData);
      setLoading(false);
    });
  }, [filter]);

  useEffect(load, [load]);

  const decide = async (action: "approve" | "reject") => {
    if (!decisionFor) return;
    setBusy(true);
    setError(null);
    try {
      await api.decide(decisionFor.id, action, comment);
      toast(`Request #${decisionFor.id} ${action === "approve" ? "approved" : "rejected"}`, "success");
      setDecisionFor(null);
      setComment("");
      load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Decision failed";
      setError(message);
      toast(message, "error");
    } finally {
      setBusy(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            Team Approvals <span className="gradient-text">- {user?.department_name ?? "No department"}</span>
          </h1>
          <p className="sub">
            {team.length} team member{team.length === 1 ? "" : "s"} - {pendingCount} pending decision
            {pendingCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="grid">
        <Card title="Team members">
          {loading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : team.length === 0 ? (
            <Empty text="No team members found in your department." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.full_name}</strong>
                      </td>
                      <td className="muted">{m.email}</td>
                      <td>
                        <StatusBadge status={m.role} />
                      </td>
                      <td>{m.is_active ? "Active" : "Disabled"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          title="Leave requests"
          actions={
            <div className="tabs" style={{ marginBottom: 0 }}>
              <button
                className={filter === "pending" ? "tab active" : "tab"}
                onClick={() => setFilter("pending")}
              >
                Pending
              </button>
              <button
                className={filter === "all" ? "tab active" : "tab"}
                onClick={() => setFilter("all")}
              >
                All
              </button>
            </div>
          }
        >
          <ErrorText message={error} />
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : requests.length === 0 ? (
            <Empty text="Nothing to show here." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.employee_name}</strong>
                        {r.employee_id === user?.id && (
                          <div className="small muted">your request</div>
                        )}
                      </td>
                      <td>{r.leave_type_name}</td>
                      <td className="small">
                        {r.start_date} &rarr; {r.end_date}
                      </td>
                      <td>{r.days}</td>
                      <td className="small">{r.reason}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>
                        {r.status === "pending" && r.employee_id !== user?.id && (
                          <button className="btn btn-small btn-primary" onClick={() => setDecisionFor(r)}>
                            Decide
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={decisionFor !== null}
        title="Review leave request"
        onClose={() => setDecisionFor(null)}
      >
        {decisionFor && (
          <>
            <dl className="detail-list">
              <div>
                <dt>Employee</dt>
                <dd>{decisionFor.employee_name}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{decisionFor.leave_type_name}</dd>
              </div>
              <div>
                <dt>Dates</dt>
                <dd>
                  {decisionFor.start_date} &rarr; {decisionFor.end_date} ({decisionFor.days} day
                  {decisionFor.days > 1 ? "s" : ""})
                </dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{decisionFor.reason}</dd>
              </div>
            </dl>
            <div style={{ marginTop: 18 }}>
              <label>
                Decision comment (optional)
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="Shown to the employee with the decision"
                  maxLength={500}
                />
              </label>
            </div>
            <div className="row" style={{ marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setDecisionFor(null)} disabled={busy}>
                Close
              </button>
              <button className="btn btn-danger" onClick={() => decide("reject")} disabled={busy}>
                {busy ? <span className="spinner" /> : <IcX />}
                Reject
              </button>
              <button className="btn btn-primary" onClick={() => decide("approve")} disabled={busy}>
                {busy ? <span className="spinner" /> : <IcCheck />}
                Approve
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
