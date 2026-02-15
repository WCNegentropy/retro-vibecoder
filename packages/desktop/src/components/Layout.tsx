import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import WindowChrome from './WindowChrome';

/**
 * Main application layout with Windows 95 style navigation sidebar
 */
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <WindowChrome title="Universal Project Generator">
      <div className="app-layout">
        {/* Hamburger toggle for small windows */}
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? 'X' : '☰'}
        </button>

        {/* Overlay to close sidebar when clicking outside on mobile */}
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            role="presentation"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="logo">
            <h1>UPG</h1>
            <span className="version">v{__APP_VERSION__}</span>
            <span className="tagline">Transform integers into software</span>
          </div>

          <nav className="nav">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-link-icon">~</span>
              Home
            </NavLink>

            <div className="nav-section">
              <span className="nav-section-title">Generation</span>
              <NavLink
                to="/seed"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-link-icon">#</span>
                Seed Generator
              </NavLink>
              <NavLink
                to="/compose"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-link-icon">+</span>
                Stack Composer
              </NavLink>
              <NavLink
                to="/gallery"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-link-icon">@</span>
                Seed Gallery
              </NavLink>
            </div>

            <div className="nav-section">
              <span className="nav-section-title">Tools</span>
              <NavLink
                to="/cli"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-link-icon">&gt;</span>
                CLI Commands
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-link-icon">*</span>
                Settings
              </NavLink>
            </div>
          </nav>

          <div className="sidebar-footer">
            <span>v{__APP_VERSION__} — Universal Engine</span>
          </div>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </WindowChrome>
  );
}

export default Layout;
