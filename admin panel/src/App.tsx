import { FormEvent, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "./api";
import { useAuth } from "./auth";

type IdField = { key: string; label: string };
type ResourceConfig = {
  key: string;
  label: string;
  listPath: string;
  getPath: (ids: Record<string, string>) => string;
  createPath: string;
  updatePath: (ids: Record<string, string>) => string;
  deletePath: (ids: Record<string, string>) => string;
  idFields: IdField[];
};

const KYRGYZ_PHONE_PREFIX = "+996";

function normalizeKyrgyzPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const withoutCountryCode = digits.startsWith("996") ? digits.slice(3) : digits;
  return `${KYRGYZ_PHONE_PREFIX}${withoutCountryCode.slice(0, 9)}`;
}

const resources: ResourceConfig[] = [
  {
    key: "admins",
    label: "Admins",
    listPath: "/api/admin/admins",
    getPath: (ids) => `/api/admin/admins/${ids.id}`,
    createPath: "/api/admin/admins",
    updatePath: (ids) => `/api/admin/admins/${ids.id}`,
    deletePath: (ids) => `/api/admin/admins/${ids.id}`,
    idFields: [{ key: "id", label: "Admin ID" }],
  },
  {
    key: "users",
    label: "Users",
    listPath: "/api/admin/users",
    getPath: (ids) => `/api/admin/users/${ids.id}`,
    createPath: "/api/admin/users",
    updatePath: (ids) => `/api/admin/users/${ids.id}`,
    deletePath: (ids) => `/api/admin/users/${ids.id}`,
    idFields: [{ key: "id", label: "User ID" }],
  },
  {
    key: "salons",
    label: "Salons",
    listPath: "/api/admin/salons?includeInactive=true",
    getPath: (ids) => `/api/admin/salons/${ids.id}`,
    createPath: "/api/admin/salons",
    updatePath: (ids) => `/api/admin/salons/${ids.id}`,
    deletePath: (ids) => `/api/admin/salons/${ids.id}`,
    idFields: [{ key: "id", label: "Salon ID" }],
  },
  {
    key: "barbers",
    label: "Barbers",
    listPath: "/api/admin/barbers?includeInactive=true",
    getPath: (ids) => `/api/admin/barbers/${ids.id}`,
    createPath: "/api/admin/barbers",
    updatePath: (ids) => `/api/admin/barbers/${ids.id}`,
    deletePath: (ids) => `/api/admin/barbers/${ids.id}`,
    idFields: [{ key: "id", label: "Barber ID" }],
  },
  {
    key: "services",
    label: "Services",
    listPath: "/api/admin/services",
    getPath: (ids) => `/api/admin/services/${ids.id}`,
    createPath: "/api/admin/services",
    updatePath: (ids) => `/api/admin/services/${ids.id}`,
    deletePath: (ids) => `/api/admin/services/${ids.id}`,
    idFields: [{ key: "id", label: "Service ID" }],
  },
  {
    key: "products",
    label: "Products",
    listPath: "/api/admin/products",
    getPath: (ids) => `/api/admin/products/${ids.id}`,
    createPath: "/api/admin/products",
    updatePath: (ids) => `/api/admin/products/${ids.id}`,
    deletePath: (ids) => `/api/admin/products/${ids.id}`,
    idFields: [{ key: "id", label: "Product ID" }],
  },
  {
    key: "slots",
    label: "Slots",
    listPath: "/api/admin/slots",
    getPath: (ids) => `/api/admin/slots/${ids.id}`,
    createPath: "/api/admin/slots",
    updatePath: (ids) => `/api/admin/slots/${ids.id}`,
    deletePath: (ids) => `/api/admin/slots/${ids.id}`,
    idFields: [{ key: "id", label: "Slot ID" }],
  },
  {
    key: "bookings",
    label: "Bookings",
    listPath: "/api/admin/bookings",
    getPath: (ids) => `/api/admin/bookings/${ids.id}`,
    createPath: "/api/admin/bookings",
    updatePath: (ids) => `/api/admin/bookings/${ids.id}`,
    deletePath: (ids) => `/api/admin/bookings/${ids.id}`,
    idFields: [{ key: "id", label: "Booking ID" }],
  },
  {
    key: "reviews",
    label: "Reviews",
    listPath: "/api/admin/reviews",
    getPath: (ids) => `/api/admin/reviews/${ids.id}`,
    createPath: "/api/admin/reviews",
    updatePath: (ids) => `/api/admin/reviews/${ids.id}`,
    deletePath: (ids) => `/api/admin/reviews/${ids.id}`,
    idFields: [{ key: "id", label: "Review ID" }],
  },
  {
    key: "cart-items",
    label: "Cart Items",
    listPath: "/api/admin/cart-items",
    getPath: (ids) => `/api/admin/cart-items/${ids.userId}/${ids.productId}`,
    createPath: "/api/admin/cart-items",
    updatePath: (ids) => `/api/admin/cart-items/${ids.userId}/${ids.productId}`,
    deletePath: (ids) => `/api/admin/cart-items/${ids.userId}/${ids.productId}`,
    idFields: [
      { key: "userId", label: "User ID" },
      { key: "productId", label: "Product ID" },
    ],
  },
];

function formatError(error: unknown) {
  if (error instanceof ApiError) return `${error.message} (HTTP ${error.status})`;
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(KYRGYZ_PHONE_PREFIX);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ phone: phone.trim(), password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="auth-layout">
      <form className="auth-card" onSubmit={submit}>
        <h1>HairLine Admin</h1>
        <p>Login for admins only</p>
        <label>
          Phone
          <input
            type="tel"
            value={phone}
            inputMode="numeric"
            onChange={(e) => setPhone(normalizeKyrgyzPhone(e.target.value))}
            pattern="^\+996\d{9}$"
            placeholder="+996000000000"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            maxLength={50}
            required
          />
        </label>
        {error ? <div className="alert error">{error}</div> : null}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}

function ResourcePanel({ resource }: { resource: ResourceConfig }) {
  const { token } = useAuth();
  const [ids, setIds] = useState<Record<string, string>>(
    Object.fromEntries(resource.idFields.map((field) => [field.key, ""])),
  );
  const [createJson, setCreateJson] = useState("{}");
  const [patchJson, setPatchJson] = useState("{}");
  const [listQuery, setListQuery] = useState("");
  const [listResult, setListResult] = useState<string>("");
  const [itemResult, setItemResult] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const idsReady = useMemo(
    () => resource.idFields.every((field) => Boolean(ids[field.key]?.trim())),
    [ids, resource.idFields],
  );

  if (!token) return null;

  const withAction = async (action: () => Promise<void>) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const parseBody = (raw: string) => {
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Invalid JSON: ${String(err)}`);
    }
  };

  return (
    <section className="panel">
      <h2>{resource.label}</h2>

      <label>
        List query params (optional)
        <input
          value={listQuery}
          onChange={(e) => setListQuery(e.target.value)}
          placeholder="limit=50&offset=0"
        />
      </label>

      <div className="action-row">
        <button
          disabled={loading}
          onClick={() =>
            void withAction(async () => {
              const query = listQuery.trim().replace(/^\?/, "");
              const path =
                query.length > 0
                  ? `${resource.listPath}${resource.listPath.includes("?") ? "&" : "?"}${query}`
                  : resource.listPath;
              const data = await apiGet(path, token);
              setListResult(JSON.stringify(data, null, 2));
              setMessage("List loaded");
            })
          }
        >
          List
        </button>
      </div>

      <div className="id-grid">
        {resource.idFields.map((field) => (
          <label key={field.key}>
            {field.label}
            <input
              value={ids[field.key] || ""}
              onChange={(e) => setIds((prev) => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.label}
            />
          </label>
        ))}
      </div>

      <div className="action-row">
        <button
          disabled={loading || !idsReady}
          onClick={() =>
            void withAction(async () => {
              const data = await apiGet(resource.getPath(ids), token);
              setItemResult(JSON.stringify(data, null, 2));
              setMessage("Record loaded");
            })
          }
        >
          Get by ID
        </button>
        <button
          className="danger"
          disabled={loading || !idsReady}
          onClick={() =>
            void withAction(async () => {
              await apiDelete(resource.deletePath(ids), token);
              setMessage("Deleted");
            })
          }
        >
          Delete
        </button>
      </div>

      <div className="json-block">
        <label>Create payload (JSON)</label>
        <textarea value={createJson} onChange={(e) => setCreateJson(e.target.value)} rows={8} />
        <button
          disabled={loading}
          onClick={() =>
            void withAction(async () => {
              await apiPost(resource.createPath, token, parseBody(createJson));
              setMessage("Created");
            })
          }
        >
          Create
        </button>
      </div>

      <div className="json-block">
        <label>Patch payload (JSON)</label>
        <textarea value={patchJson} onChange={(e) => setPatchJson(e.target.value)} rows={8} />
        <button
          disabled={loading || !idsReady}
          onClick={() =>
            void withAction(async () => {
              await apiPatch(resource.updatePath(ids), token, parseBody(patchJson));
              setMessage("Updated");
            })
          }
        >
          Patch
        </button>
      </div>

      {message ? <div className="alert success">{message}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <div className="results">
        <div>
          <h3>List Result</h3>
          <pre>{listResult || "—"}</pre>
        </div>
        <div>
          <h3>Get Result</h3>
          <pre>{itemResult || "—"}</pre>
        </div>
      </div>
    </section>
  );
}

function DashboardPage() {
  const { admin, logout, isAuthenticated } = useAuth();
  const [activeKey, setActiveKey] = useState(resources[0].key);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const currentResource = resources.find((item) => item.key === activeKey) || resources[0];

  return (
    <main className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Admin Panel</h1>
          <p>{admin?.phone}</p>
        </div>
        <nav>
          {resources.map((item) => (
            <button
              key={item.key}
              className={item.key === activeKey ? "active" : ""}
              onClick={() => setActiveKey(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="logout" onClick={logout}>
          Logout
        </button>
      </aside>
      <div className="content">
        <ResourcePanel resource={currentResource} />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
