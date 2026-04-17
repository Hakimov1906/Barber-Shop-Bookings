import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { resourceConfigs } from "../config/resources";

export function Shell() {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="shell-root">
      <header className="shell-header">
        <div className="header-left">
          <button
            type="button"
            className="menu-toggle ghost"
            aria-label="Открыть меню"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>

          <div className="brand">
            <span className="brand-mark" />
            <div>
              <h1>HairLine Admin</h1>
              <p>Панель управления базой данных</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="admin-pill">{admin?.phone}</div>
          <button type="button" className="danger" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>

      <div className="shell-body">
        <div
          className={`shell-sidebar-backdrop ${sidebarOpen ? "open" : ""}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />
        <aside className={`shell-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-top">
            <h2>Разделы</h2>
            <button
              type="button"
              className="ghost sidebar-close"
              aria-label="Закрыть меню"
              onClick={closeSidebar}
            >
              ✕
            </button>
          </div>

          <p className="sidebar-admin">Администратор: {admin?.phone}</p>

          <nav>
            {resourceConfigs.map((item) => (
              <NavLink
                key={item.key}
                to={item.route}
                onClick={closeSidebar}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {item.title}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
