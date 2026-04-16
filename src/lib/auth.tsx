import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";

interface AuthUser {
  id: number;
  fullName: string;
  phone: string;
}

interface AuthState {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (payload: {
    fullName: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  syncUser: (user: AuthUser) => void;
  logout: () => void;
}

const STORAGE_KEY = "hairline-auth";
const AuthContext = createContext<AuthContextValue | null>(null);

function getInitialState(): AuthState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthState;
    if (!parsed?.token || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState | null>(() => getInitialState());

  const persist = useCallback((next: AuthState | null) => {
    setState(next);
    if (!next) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const login = useCallback(
    async (phone: string, password: string) => {
      const response = await api.login({ phone, password });
      persist({
        token: response.token,
        user: {
          id: response.user.id,
          fullName: response.user.fullName,
          phone: response.user.phone,
        },
      });
    },
    [persist],
  );

  const register = useCallback(
    async (payload: {
      fullName: string;
      phone: string;
      password: string;
    }) => {
      await api.register(payload);
      await login(payload.phone, payload.password);
    },
    [login],
  );

  const syncUser = useCallback(
    (nextUser: AuthUser) => {
      if (!state?.token) {
        return;
      }
      persist({
        token: state.token,
        user: nextUser,
      });
    },
    [persist, state],
  );

  const logout = useCallback(() => {
    persist(null);
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state?.user ?? null,
      token: state?.token ?? null,
      isAuthenticated: Boolean(state?.token),
      login,
      register,
      syncUser,
      logout,
    }),
    [state, login, register, syncUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
