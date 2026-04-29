import { FormEvent, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api";
import { useAuth } from "../auth";
import {
  ensureKyrgyzPhonePrefix,
  isValidKyrgyzPhone,
  KYRGYZ_PHONE_PREFIX,
  normalizeKyrgyzPhone,
} from "../utils/phone";

function formatError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status > 0) return `${error.message} (HTTP ${error.status})`;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState(KYRGYZ_PHONE_PREFIX);
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const targetPath = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from || "/admins";
  }, [location.state]);

  if (isAuthenticated) return <Navigate to="/admins" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = normalizeKyrgyzPhone(phone);
    setPhone(normalizedPhone);

    if (!isValidKyrgyzPhone(normalizedPhone)) {
      setError("Введите телефон в формате +996XXXXXXXXX");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await login({ phone: normalizedPhone, password });
      navigate(targetPath, { replace: true });
    } catch (submitError) {
      setError(formatError(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-layout">
      <div className="login-hero">
        <p className="eyebrow">HairLine</p>
        <h1>Панель администратора</h1>
        <p>
          Управление сущностями PostgreSQL через `/api/admin/*`.
          <br />
          Авторизация только для `admins` (phone + password).
        </p>
      </div>

      <form className="login-card" onSubmit={submit}>
        <h2>Вход</h2>

        <label>
          Телефон
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(ensureKyrgyzPhonePrefix(event.target.value))}
            inputMode="numeric"
            placeholder="+996000000000"
            maxLength={13}
            autoComplete="tel"
            required
          />
        </label>

        <label>
          Пароль
          <input
            type={passwordVisible ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
          <button
            type="button"
            className="password-toggle login-password-toggle"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            onClick={() => setPasswordVisible((current) => !current)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {passwordVisible ? (
                <>
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 4.2A9.7 9.7 0 0 1 12 4c5 0 8.5 4.5 9.5 6a2.8 2.8 0 0 1 0 4 15 15 0 0 1-2.1 2.5" />
                  <path d="M6.6 6.6A15 15 0 0 0 2.5 10a2.8 2.8 0 0 0 0 4C3.5 15.5 7 20 12 20a9.7 9.7 0 0 0 4.1-.9" />
                </>
              ) : (
                <>
                  <path d="M2.5 10a2.8 2.8 0 0 0 0 4C3.5 15.5 7 20 12 20s8.5-4.5 9.5-6a2.8 2.8 0 0 0 0-4C20.5 8.5 17 4 12 4S3.5 8.5 2.5 10Z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        </label>

        {error ? <div className="panel-error">{error}</div> : null}

        <button type="submit" disabled={loading}>
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </main>
  );
}
