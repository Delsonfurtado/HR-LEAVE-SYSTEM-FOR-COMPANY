import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../services/api";
import type { Department, User } from "../types";
import { Card, Empty, ErrorText } from "../components/ui";

const ROLES = ["employee", "manager", "hr", "admin"];

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [departmentId, setDepartmentId] = useState<number | "">("");

  const load = useCallback(() => {
    api.adminUsers().then(setUsers).catch((e) => setError(e.message));
    api.adminDepartments().then(setDepartments).catch(() => undefined);
  }, []);

  useEffect(load, [load]);

  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await api.createUser({
        email,
        full_name: fullName,
        password,
        role,
        department_id: departmentId === "" ? null : Number(departmentId),
      });
      setNotice(`User ${email} created.`);
      setEmail("");
      setFullName("");
      setPassword("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  };

  const patchUser = async (id: number, body: Record<string, unknown>, message: string) => {
    setError(null);
    setNotice(null);
    try {
      await api.updateUser(id, body);
      setNotice(message);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  const resetPassword = async (user: User) => {
    const next = window.prompt(`New password for ${user.email} (min 8 chars, upper+lower+digit):`);
    if (!next) return;
    setError(null);
    try {
      await api.resetPassword(user.id, next);
      setNotice(`Password updated for ${user.email}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    }
  };

  return (
    <div className="grid">
      <Card title="User accounts">
        <ErrorText message={error} />
        {notice && <p className="notice">{notice}</p>}
        {users.length === 0 ? (
          <Empty text="No users." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.full_name}</td>
                  <td>
                    <select value={u.role} onChange={(e) => patchUser(u.id, { role: e.target.value }, `Role updated for ${u.email}.`)}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={u.department_id ?? ""}
                      onChange={(e) =>
                        patchUser(
                          u.id,
                          { department_id: e.target.value === "" ? null : Number(e.target.value) },
                          `Department updated for ${u.email}.`
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
                  <td>{u.is_active ? "yes" : "no"}</td>
                  <td className="row-actions">
                    <button className="btn btn-small" onClick={() => patchUser(u.id, { is_active: !u.is_active }, `${u.email} ${u.is_active ? "deactivated" : "activated"}.`)}>
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button className="btn btn-small" onClick={() => resetPassword(u)}>
                      Reset password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Create user">
        <form className="form" onSubmit={createUser}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} required />
          </label>
          <label>
            Password (min 8 chars, upper+lower+digit)
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
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
          <label>
            Department
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value === "" ? "" : Number(e.target.value))}>
              <option value="">none</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-primary">Create</button>
        </form>
      </Card>
    </div>
  );
}
