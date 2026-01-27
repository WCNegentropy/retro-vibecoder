import { Outlet, NavLink } from 'react-router-dom';
import WindowChrome from './WindowChrome';

/**
 * Main application layout with Windows 95 style navigation sidebar
 */
function Layout() {
  return (
    <WindowChrome title="Universal Project Generator">
      <div className="app-layout">
        <aside className="sidebar">
          <div className="logo">
            <h1>UPG</h1>
            <span className="version">v0.1.0</span>
            <span className="tagline">Transform integers into software</span>
          </div>

          <nav className="nav">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <span className="nav-link-icon">~</span>
              Home
            </NavLink>

            <div className="nav-section">
              <span className="nav-section-title">Generation</span>
              <NavLink
                to="/seed"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <span className="nav-link-icon">#</span>
                Seed Generator
              </NavLink>
              <NavLink
                to="/compose"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <span className="nav-link-icon">+</span>
                Stack Composer
              </NavLink>
              <NavLink
                to="/gallery"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
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
              >
                <span className="nav-link-icon">&gt;</span>
                CLI Commands
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <span className="nav-link-icon">*</span>
                Settings
              </NavLink>
            </div>
          </nav>

          <div className="sidebar-footer">
            <span>Phase 2: Generic Engine</span>
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
