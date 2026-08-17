import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { Balance, LeaveRequest } from "../types";
import { Card, Empty, ErrorText, StatusBadge } from "../components/ui";

export function MyLeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.myRequests().then(setRequests).catch((e) => setError(e.message));
    api.myBalances().then(setBalances).catch(() => undefined);
  }, []);

  useEffect(load, [load]);

  const cancel = async (id: number) => {
    setError(null);
    try {
      await api.cancelRequest(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    }
  };

  return (
    <div className="grid">
      <Card title="My leave requests">
        <ErrorText message={error} />
        {requests.length === 0 ? (
          <Empty text="No requests yet." />
        ) : (
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
                  <td>{r.leave_type_name}</td>
                  <td>{r.start_date}</td>
                  <td>{r.end_date}</td>
                  <td>{r.days}</td>
                  <td>{r.reason}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    {r.decision_comment
                      ? `${r.decided_by_name ?? "Manager"}: ${r.decision_comment}`
                      : r.decided_by_name
                        ? r.decided_by_name
                        : "-"}
                  </td>
                  <td>
                    {r.status === "pending" && (
                      <button className="btn btn-small" onClick={() => cancel(r.id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="My balances">
        {balances.length === 0 ? (
          <Empty text="No balances." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Total</th>
                <th>Used</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.leave_type_id}>
                  <td>{b.leave_type_name}</td>
                  <td>{b.total_days}</td>
                  <td>{b.used_days}</td>
                  <td>{b.remaining_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
