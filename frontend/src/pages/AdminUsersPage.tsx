import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../services/api";
import type { Department, User } from "../types";
import { Card, Empty, ErrorText, Modal, RoleBadge, StatusBadge, useToast } from "../components/ui";

const ROLES = ["employee", "manager", "hr", "admin"];
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

export function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [creating, setCreating] = useState(false);

  const [resetFor, setResetFor] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const load = useCallback(() => {
    api.adminUsers().then(setUsers).catch((e) => setError(e.message));
    api.adminDepartments().then(setDepartments).catch(() => undefined);
  }, []);

  useEffect(load, [load]);

  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await api.createUser({
        email,
        full_name: fullName,
        password,
        role,
        department_id: departmentId === "" ? null : Number(departmentId),
      });
      toast(`User ${email} created`, "success");
      setEmail("");
      setFullName("");
      setPassword("");
      setRole("employee");
      setDepartmentId("");
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create failed";
      setError(message);
      toast(message, "error");
    } finally {
      setCreating(false);
    }
  };

  const patchUser = async (target: User, body: Record<string, unknown>, message: string) => {
    setError(null);
    try {
      await api.updateUser(target.id, body);
      toast(message, "success");
      load();
    } catch (e) {
      const message2 = e instanceof Error ? e.message : "Update failed";
      setError(message2);
      toast(message2, "error");
    }
  };

  

  const submitReset = async () => {
    if (!resetFor) return;
    setResetting(true);
    try {
      await api.resetPassword(resetFor.id, newPassword);
      toast(`Password updated for ${resetFor.email}`, "success");
      setResetFor(null);
      setNewPassword("");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Reset failed", "error");
    } finally {
      setResetting(false);
    }
  };

  const resetValid = PASSWORD_PATTERN.test(newPassword);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            User <span className="gradient-text">Accounts</span>
          </h1>
          <p className="sub">{users.length} accounts - manage roles, departments and access</p>
        </div>
      </div>

      <div className="grid">
        <Card title="Accounts">
          <ErrorText message={error} />
          {users.length === 0 ? (
            <Empty text="No users." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                            {u.full_name
                              .split(/\s+/)
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <strong>{u.full_name}</strong>
                            <div className="muted small">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) =>
                            patchUser(u, { role: e.target.value }, `Role updated for ${u.email}`)
                          }
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <div style={{ marginTop: 6 }}>
                          <RoleBadge role={u.role} />
                        </div>
                      </td>
                      <td>
                        <select
                          value={u.department_id ?? ""}
                          onChange={(e) =>
                            patchUser(
                              u,
                              {
                                department_id: e.target.value === "" ? null : Number(e.target.value),
                              },
                              `Department updated for ${u.email}`
                            )
                          }
                        >
                          <option value="">none</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <StatusBadge status={u.is_active ? "approved" : "cancelled"} />
                      </td>
                      <td>
                        <div className="row">
                          <button
                            className={`btn btn-small ${u.is_active ? "" : "btn-primary"}`}
                            onClick={() =>
                              patchUser(
                                u,
                                { is_active: !u.is_active },
                                `${u.email} ${u.is_active ? "deactivated" : "activated"}`
                              )
                            }
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button className="btn btn-small" onClick={() => setResetFor(u)}>
                            Reset password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Create user">
          <form className="form" onSubmit={createUser}>
            <div className="form-grid">
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="new.user@secureleave.io"
                  required
                />
              </label>
              <label>
                Full name
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  minLength={2}
                  placeholder="Jane Doe"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  placeholder="Min 8 chars, upper + lower + digit"
                  required
                />
                <p className="hint">
                  {PASSWORD_PATTERN.test(password) || password.length === 0
                    ? ""
                    : "Does not meet the password policy"}
                </p>
              </label>
              <label>
                Role
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Department
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">none</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <button className="btn btn-primary" disabled={creating}>
                {creating && <span className="spinner" />}
                {creating ? "Creating..." : "Create user"}
              </button>
            </div>
          </form>
        </Card>
      </div>

      <Modal
        open={resetFor !== null}
        title={`Reset password - ${resetFor?.email ?? ""}`}
        onClose={() => {
          setResetFor(null);
          setNewPassword("");
        }}
      >
        <label>
          New password
          <input
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 chars, upper + lower + digit"
            autoFocus
          />
          <p className="hint">
            {newPassword.length === 0
              ? "The policy requires at least 8 characters with uppercase, lowercase and a digit."
              : resetValid
                ? "Meets the password policy"
                : "Does not meet the password policy yet"}
          </p>
        </label>
        <div className="row" style={{ marginTop: 20, justifyContent: "flex-end" }}>
          <button
            className="btn"
            onClick={() => {
              setResetFor(null);
              setNewPassword("");
            }}
            disabled={resetting}
          >
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submitReset} disabled={resetting || !resetValid}>
            {resetting && <span className="spinner" />}
            Reset password
          </button>
        </div>
      </Modal>
    </>
  );
}
