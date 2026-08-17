import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { Balance, LeaveRequest } from "../types";
import { Card, Empty, ErrorText, Modal, ProgressBar, StatusBadge, useToast } from "../components/ui";

export function MyLeavePage() {
  const toast = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.myRequests().catch((e) => setError(e.message)), api.myBalances().catch(() => undefined)]).then(
      ([requestData, balanceData]) => {
        if (Array.isArray(requestData)) setRequests(requestData);
        if (Array.isArray(balanceData)) setBalances(balanceData);
        setLoading(false);
      }
    );
  }, []);

  useEffect(load, [load]);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      await api.cancelRequest(cancelTarget.id);
      toast(`Request #${cancelTarget.id} cancelled`, "success");
      setCancelTarget(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Cancel failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Leave</h1>
          <p className="sub">Track your requests and remaining balances</p>
        </div>
      </div>

      <div className="grid">
        <Card title="Requests">
          <ErrorText message={error} />
          {loading ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="skeleton" style={{ height: 120 }} />
            </div>
          ) : requests.length === 0 ? (
            <Empty text="No requests yet - submit your first one from the New Request page." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Decision</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.leave_type_name}</strong>
                      </td>
                      <td>{r.start_date}</td>
                      <td>{r.end_date}</td>
                      <td>{r.days}</td>
                      <td className="small">{r.reason}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="small">
                        {r.decided_by_name ? (
                          <>
                            <strong>{r.decided_by_name}</strong>
                            {r.decision_comment ? `: ${r.decision_comment}` : ""}
                          </>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td>
                        {r.status === "pending" && (
                          <button className="btn btn-small" onClick={() => setCancelTarget(r)}>
                            Cancel
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

        <Card title="Balances">
          {loading ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="skeleton" style={{ height: 90 }} />
            </div>
          ) : balances.length === 0 ? (
            <Empty text="No balances." />
          ) : (
            <div className="bal-grid">
              {balances.map((b) => (
                <div className="bal-card" key={b.leave_type_id}>
                  <div className="bal-card-head">
                    <strong>{b.leave_type_name}</strong>
                    <span className="bal-remaining">{b.remaining_days}</span>
                  </div>
                  <ProgressBar used={b.used_days} total={b.total_days} />
                  <p className="bal-sub">
                    {b.used_days} of {b.total_days} days used
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={cancelTarget !== null}
        title="Cancel this request?"
        onClose={() => setCancelTarget(null)}
      >
        {cancelTarget && (
          <>
            <dl className="detail-list">
              <div>
                <dt>Type</dt>
                <dd>{cancelTarget.leave_type_name}</dd>
              </div>
              <div>
                <dt>Dates</dt>
                <dd>
                  {cancelTarget.start_date} &rarr; {cancelTarget.end_date} ({cancelTarget.days} day
                  {cancelTarget.days > 1 ? "s" : ""})
                </dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{cancelTarget.reason}</dd>
              </div>
            </dl>
            <div className="row" style={{ marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setCancelTarget(null)} disabled={busy}>
                Keep request
              </button>
              <button className="btn btn-danger" onClick={confirmCancel} disabled={busy}>
                {busy && <span className="spinner" />}
                Cancel request
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
