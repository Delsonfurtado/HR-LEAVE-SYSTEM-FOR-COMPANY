import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import type { Balance, LeaveRequest } from "../types";
import { Card, Empty, StatusBadge } from "../components/ui";

export function DashboardPage() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    api.myBalances().then(setBalances).catch(() => setBalances([]));
    api.myRequests().then(setRequests).catch(() => setRequests([]));
  }, []);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="grid">
      <Card title="Welcome">
        <p>
          Signed in as <strong>{user?.full_name}</strong> ({user?.email}), role <strong>{user?.role}</strong>
          {user?.department_name ? `, department ${user.department_name}` : ""}.
        </p>
        <p className="muted">
          The navigation above only shows pages your role is allowed to use. Every API call is also
          re-checked by the backend, so hidden buttons are never the only line of defense.
        </p>
      </Card>

      <Card title={`My balances (${new Date().getFullYear()})`}>
        {balances.length === 0 ? (
          <Empty text="No balances found." />
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

      <Card title="Recent requests">
        {requests.length === 0 ? (
          <Empty text="You have not submitted any requests yet." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.slice(0, 5).map((r) => (
                <tr key={r.id}>
                  <td>{r.leave_type_name}</td>
                  <td>
                    {r.start_date} to {r.end_date}
                  </td>
                  <td>{r.days}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted">
          {pendingCount} pending request(s). <Link to="/leave/new">Submit a new request</Link>.
        </p>
      </Card>
    </div>
  );
}
