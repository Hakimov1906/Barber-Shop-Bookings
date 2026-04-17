import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { adminLogin, type AdminLoginResponse } from "./api";

type AuthState = {
  token: string;
  admin: AdminLoginResponse["admin"];
};

type AuthContextValue = {
  token: string | null;
  admin: AdminLoginResponse["admin"] | null;
  isAuthenticated: boolean;
  login: (payload: { phone: string; password: string }) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = "hairline-admin-auth";
const AuthContext = createContext<AuthContextValue | null>(null);

function readInitialState(): AuthState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthState;
    if (!parsed?.token || !parsed?.admin) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState | null>(() => readInitialState());

  const persist = useCallback((value: AuthState | null) => {
    setState(value);
    if (!value) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }, []);

  const login = useCallback(
    async (payload: { phone: string; password: string }) => {
      const response = await adminLogin(payload);
      persist({ token: response.token, admin: response.admin });
    },
    [persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: state?.token || null,
      admin: state?.admin || null,
      isAuthenticated: Boolean(state?.token),
      login,
      logout,
    }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
