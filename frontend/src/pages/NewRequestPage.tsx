import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { LeaveType } from "../types";
import { Card, ErrorText } from "../components/ui";

export function NewRequestPage() {
  const navigate = useNavigate();
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
      navigate("/leave");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid narrow">
      <Card title="New leave request">
        <ErrorText message={error} />
        <form onSubmit={onSubmit} className="form">
          <label>
            Leave type
            <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(Number(e.target.value))} required>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>
          <label>
            End date
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </label>
          <label>
            Reason (5-500 characters)
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={5}
              maxLength={500}
              rows={3}
              required
            />
          </label>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Submitting..." : "Submit request"}
          </button>
          <p className="muted">
            Only working days (Monday-Friday) are counted. Requests must not overlap existing pending or
            approved leave, and must fit within your remaining balance.
          </p>
        </form>
      </Card>
    </div>
  );
}
