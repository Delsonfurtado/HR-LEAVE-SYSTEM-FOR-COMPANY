import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { Department, LeaveReport, LeaveType } from "../types";
import { Card, Empty, ErrorText, StatusBadge, useToast } from "../components/ui";

export function HrPage() {
  const toast = useToast();
  const [report, setReport] = useState<LeaveReport | null>(null);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTypes = useCallback(() => {
    api.hrLeaveTypes().then(setTypes).catch(() => undefined);
    api.departments().then(setDepartments).catch(() => undefined);
  }, []);

  useEffect(loadTypes, [loadTypes]);

  const runReport = useCallback(async () => {
    setError(null);
    try {
      const params: { start?: string; end?: string; department_id?: number } = {};
      if (start) params.start = start;
      if (end) params.end = end;
      if (departmentId !== "") params.department_id = Number(departmentId);
      setReport(await api.hrReport(params));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Report failed");
    } finally {
      setLoading(false);
    }
  }, [start, end, departmentId]);

  useEffect(() => {
    runReport();
  }, [runReport]);

  const toggleType = async (t: LeaveType) => {
    setError(null);
    try {
      await api.updateLeaveType(t.id, { is_active: !t.is_active });
      toast(`${t.name} ${t.is_active ? "disabled" : "enabled"}`, "success");
      loadTypes();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Update failed";
      setError(message);
      toast(message, "error");
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            HR <span className="gradient-text">Reports & Policies</span>
          </h1>
          <p className="sub">Organization-wide leave overview and leave type management</p>
        </div>
      </div>

      <div className="grid">
        <Card title="Leave report">
          <ErrorText message={error} />
          <div className="filters">
            <label>
              From
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
            <label>
              Department
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 160 }} />
          ) : report ? (
            <>
              <div className="stats">
                <div className="stat">
                  <div className="stat-meta">
                    <strong>{report.summary.total_requests}</strong>
                    <span>Total requests</span>
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-meta">
                    <strong>{report.summary.pending_count}</strong>
                    <span>Pending</span>
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-meta">
                    <strong>{report.summary.approved_count}</strong>
                    <span>Approved</span>
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-meta">
                    <strong>{report.summary.approved_days}</strong>
                    <span>Approved days</span>
                  </div>
                </div>
              </div>

              {report.items.length === 0 ? (
                <Empty text="No data for the selected filters." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Days</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.items.map((i) => (
                        <tr key={i.id}>
                          <td>
                            <strong>{i.employee_name}</strong>
                            <div className="muted small">{i.employee_email}</div>
                          </td>
                          <td>{i.department ?? "-"}</td>
                          <td>{i.leave_type_name}</td>
                          <td className="small">
                            {i.start_date} &rarr; {i.end_date}
                          </td>
                          <td>{i.days}</td>
                          <td>
                            <StatusBadge status={i.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </Card>

        <Card title="Leave policies (leave types)">
          {types.length === 0 ? (
            <Empty text="No leave types configured." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Default days</th>
                    <th>Document</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t.id}>
                      <td className="mono">{t.code}</td>
                      <td>
                        <strong>{t.name}</strong>
                      </td>
                      <td>{t.default_days}</td>
                      <td>{t.requires_document ? "Required" : "Not required"}</td>
                      <td>
                        <StatusBadge status={t.is_active ? "approved" : "cancelled"} />
                      </td>
                      <td>
                        <button
                          className={`btn btn-small ${t.is_active ? "" : "btn-primary"}`}
                          onClick={() => toggleType(t)}
                        >
                          {t.is_active ? "Disable" : "Enable"}
                        </button>
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
