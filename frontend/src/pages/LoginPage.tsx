import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ErrorText } from "../components/ui";
import { IcEye, IcEyeOff } from "../components/icons";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="orb o1" />
      <div className="orb o2" />
      <div className="orb o3" />

      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-logo">SL</div>
        <h1>Secure Leave Management</h1>
        <p className="sub">Sign in with your corporate account to continue</p>

        <div className="login-form">
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="you@secureleave.io"
              required
              autoFocus
            />
          </label>

          <label>
            Password
            <div className="input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IcEyeOff /> : <IcEye />}
              </button>
            </div>
          </label>

          <ErrorText message={error} />

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy && <span className="spinner" />}
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
