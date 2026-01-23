import { Outlet, NavLink } from 'react-router-dom';

/**
 * Main application layout with navigation sidebar
 */
function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">
          <h1>UPG</h1>
          <span className="version">v0.1.0</span>
        </div>
        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Home
          </NavLink>
          <div className="nav-section">
            <span className="nav-section-title">Procedural Mode</span>
            <NavLink
              to="/seed"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Seed Generator
            </NavLink>
            <NavLink
              to="/compose"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Stack Composer
            </NavLink>
            <NavLink
              to="/gallery"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Seed Gallery
            </NavLink>
          </div>
          <div className="nav-section">
            <span className="nav-section-title">Manifest Mode</span>
            <NavLink
              to="/templates"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Template Selector
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
  );
}

export default Layout;
