import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { LeaveType } from "../types";
import { Card, ErrorText, useToast } from "../components/ui";

function countWorkingDays(startStr: string, endStr: string): number | null {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");
  if (end < start) return null;
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function NewRequestPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .leaveTypes()
      .then((t) => {
        setTypes(t);
        if (t.length > 0) setLeaveTypeId(t[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  const workingDays = useMemo(() => countWorkingDays(startDate, endDate), [startDate, endDate]);
  const todayStr = new Date().toISOString().slice(0, 10);
  const invalid =
    workingDays === null || workingDays === 0 || startDate < todayStr || reason.trim().length < 5;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.submitRequest({
        leave_type_id: Number(leaveTypeId),
        start_date: startDate,
        end_date: endDate,
        reason,
      });
      toast("Leave request submitted", "success");
      navigate("/leave");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      setError(message);
      toast(message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid narrow">
      <Card title="New leave request">
        <ErrorText message={error} />
        <form className="form" onSubmit={onSubmit}>
          <div className="form-grid">
            <label>
              Leave type
              <select
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(Number(e.target.value))}
                required
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (default {t.default_days} days)
                  </option>
                ))}
              </select>
            </label>
            {workingDays !== null && (
              <div style={{ alignSelf: "end", paddingBottom: 6 }}>
                <span className={`chip${workingDays > 0 ? " chip-green" : ""}`}>
                  {workingDays > 0
                    ? `${workingDays} working day${workingDays > 1 ? "s" : ""}`
                    : "Weekend only - pick weekdays"}
                </span>
              </div>
            )}
          </div>

          <div className="form-grid">
            <label>
              Start date
              <input
                type="date"
                value={startDate}
                min={todayStr}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>
            <label>
              End date
              <input
                type="date"
                value={endDate}
                min={startDate || todayStr}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </label>
          </div>

          <label>
            Reason
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={5}
              maxLength={500}
              rows={3}
              placeholder="Briefly describe the reason for your leave (5-500 characters)"
              required
            />
            <p className="hint">{reason.trim().length}/500 characters - minimum 5</p>
          </label>

          <button className="btn btn-primary" disabled={busy || invalid}>
            {busy && <span className="spinner" />}
            {busy ? "Submitting..." : "Submit request"}
          </button>

          <p className="hint">
            Only working days (Monday to Friday) count. The backend re-validates dates, overlaps and
            your remaining balance - the preview above is a convenience, not the rule.
          </p>
        </form>
      </Card>
    </div>
  );
}
