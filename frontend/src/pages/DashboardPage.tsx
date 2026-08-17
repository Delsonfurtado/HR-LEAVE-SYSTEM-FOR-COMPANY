import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import type { Balance, LeaveRequest } from "../types";
import { Card, Empty, ProgressBar, Skeleton, StatusBadge, TableSkeleton } from "../components/ui";
import { IcCheck, IcClock, IcPlane } from "../components/icons";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.myBalances().catch(() => []), api.myRequests().catch(() => [])]).then(
      ([balanceData, requestData]) => {
        setBalances(balanceData);
        setRequests(requestData);
        setLoading(false);
      }
    );
  }, []);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedDays = requests
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.days, 0);
  const annual = balances.find((b) => b.leave_type_name === "Annual Leave") ?? balances[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            {greeting()}, <span className="gradient-text">{user?.full_name.split(" ")[0]}</span>
          </h1>
          <p className="sub">
            {user?.role} {user?.department_name ? `at ${user.department_name} department` : ""}
          </p>
        </div>
        <Link to="/leave/new" className="btn btn-primary">
          Request leave
        </Link>
      </div>

      {loading ? (
        <div className="stats">
          {[0, 1, 2].map((i) => (
            <div className="stat" key={i}>
              <Skeleton h={44} w={44} />
              <div style={{ display: "grid", gap: 6 }}>
                <Skeleton h={20} w={48} />
                <Skeleton h={12} w={90} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="stats">
          <div className="stat">
            <div className="stat-icon tone-amber">
              <IcClock />
            </div>
            <div className="stat-meta">
              <strong>{pendingCount}</strong>
              <span>Pending requests</span>
            </div>
          </div>
          <div className="stat">
            <div className="stat-icon tone-green">
              <IcCheck />
            </div>
            <div className="stat-meta">
              <strong>{approvedDays}</strong>
              <span>Approved days this year</span>
            </div>
          </div>
          <div className="stat">
            <div className="stat-icon tone-indigo">
              <IcPlane />
            </div>
            <div className="stat-meta">
              <strong>{annual ? annual.remaining_days : "-"}</strong>
              <span>{annual ? `${annual.leave_type_name} remaining` : "No balance yet"}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid">
        <Card title="My leave balances">
          {loading ? (
            <div style={{ display: "grid", gap: 12 }}>
              <Skeleton h={54} />
              <Skeleton h={54} />
              <Skeleton h={54} />
            </div>
          ) : balances.length === 0 ? (
            <Empty text="No balances found for this year." />
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

        <Card
          title="Recent requests"
          actions={
            <Link to="/leave" className="btn btn-small">
              View all
            </Link>
          }
        >
          {loading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : requests.length === 0 ? (
            <Empty text="You have not submitted any requests yet." />
          ) : (
            <div className="table-wrap">
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
                      <td>
                        <strong>{r.leave_type_name}</strong>
                      </td>
                      <td>
                        {r.start_date} &rarr; {r.end_date}
                      </td>
                      <td>{r.days}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
