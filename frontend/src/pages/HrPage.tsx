import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { Department, LeaveReport, LeaveType } from "../types";
import { Card, Empty, ErrorText, StatusBadge } from "../components/ui";

export function HrPage() {
  const [report, setReport] = useState<LeaveReport | null>(null);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

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
    }
  }, [start, end, departmentId]);

  useEffect(() => {
    runReport();
  }, [runReport]);

  const toggleType = async (t: LeaveType) => {
    setError(null);
    try {
      await api.updateLeaveType(t.id, { is_active: !t.is_active });
      loadTypes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
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
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">All</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {report && (
          <>
            <div className="stats">
              <div className="stat">
                <strong>{report.summary.total_requests}</strong>
                <span>Total</span>
              </div>
              <div className="stat">
                <strong>{report.summary.pending_count}</strong>
                <span>Pending</span>
              </div>
              <div className="stat">
                <strong>{report.summary.approved_count}</strong>
                <span>Approved</span>
              </div>
              <div className="stat">
                <strong>{report.summary.approved_days}</strong>
                <span>Approved days</span>
              </div>
            </div>
            {report.items.length === 0 ? (
              <Empty text="No data for the selected filters." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        {i.employee_name}
                        <div className="muted small">{i.employee_email}</div>
                      </td>
                      <td>{i.department ?? "-"}</td>
                      <td>{i.leave_type_name}</td>
                      <td>{i.start_date}</td>
                      <td>{i.end_date}</td>
                      <td>{i.days}</td>
                      <td>
                        <StatusBadge status={i.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </Card>

      <Card title="Leave policies (leave types)">
        {types.length === 0 ? (
          <Empty text="No leave types." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Default days</th>
                <th>Document</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.id}>
                  <td>{t.code}</td>
                  <td>{t.name}</td>
                  <td>{t.default_days}</td>
                  <td>{t.requires_document ? "required" : "no"}</td>
                  <td>{t.is_active ? "yes" : "no"}</td>
                  <td>
                    <button className="btn btn-small" onClick={() => toggleType(t)}>
                      {t.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
