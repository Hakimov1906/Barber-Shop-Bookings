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
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            maxLength={50}
            required
          />
        </label>

        {error ? <div className="panel-error">{error}</div> : null}

        <button type="submit" disabled={loading}>
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </main>
  );
}
