import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isTauri } from '../hooks/useTauriGenerate';
import { useStatus } from '../hooks/useStatus';

/**
 * Windows 95 style window chrome with RGB animated border
 * Wraps the entire application in a retro aesthetic
 *
 * Title bar buttons are wired to real Tauri window controls.
 * Menu bar navigates to app pages via dropdown menus.
 */

interface WindowChromeProps {
  children: React.ReactNode;
  title?: string;
}

function WindowChrome({ children, title = 'Universal Project Generator' }: WindowChromeProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const { status } = useStatus();

  const handleMinimize = useCallback(async () => {
    if (isTauri()) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    }
  }, []);

  const handleMaximize = useCallback(async () => {
    if (isTauri()) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      const maximized = await win.isMaximized();
      if (maximized) {
        await win.unmaximize();
      } else {
        await win.maximize();
      }
      setIsMaximized(!maximized);
    } else {
      setIsMaximized(!isMaximized);
    }
  }, [isMaximized]);

  const handleClose = useCallback(async () => {
    if (isTauri()) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    }
  }, []);

  const handleMenuClick = useCallback(
    (route: string) => {
      navigate(route);
      setActiveMenu(null);
    },
    [navigate]
  );

  return (
    <div className="app-container">
      <div className="rgb-border-wrapper">
        <div className="window-chrome">
          {/* Title Bar */}
          <div className="title-bar">
            <span className="title-bar-icon">UPG</span>
            <span className="title-bar-text">{title}</span>
            <div className="title-bar-controls">
              <button
                type="button"
                className="title-bar-btn"
                onClick={handleMinimize}
                title="Minimize"
                aria-label="Minimize"
              >
                _
              </button>
              <button
                type="button"
                className="title-bar-btn"
                onClick={handleMaximize}
                title={isMaximized ? 'Restore' : 'Maximize'}
                aria-label={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? '=' : '+'}
              </button>
              <button
                type="button"
                className="title-bar-btn"
                onClick={handleClose}
                title="Close"
                aria-label="Close"
              >
                X
              </button>
            </div>
          </div>

          {/* Menu Bar */}
          <div className="menu-bar">
            <div className="menu-dropdown">
              <button
                type="button"
                className={`menu-item ${activeMenu === 'file' ? 'active' : ''}`}
                onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              >
                <u>F</u>ile
              </button>
              {activeMenu === 'file' && (
                <div className="menu-dropdown-content">
                  <button type="button" onClick={() => handleMenuClick('/seed')}>
                    New from Seed...
                  </button>
                  <button type="button" onClick={() => handleMenuClick('/compose')}>
                    Compose Stack...
                  </button>
                  <button type="button" onClick={() => handleMenuClick('/templates')}>
                    From Template...
                  </button>
                </div>
              )}
            </div>
            <div className="menu-dropdown">
              <button
                type="button"
                className={`menu-item ${activeMenu === 'view' ? 'active' : ''}`}
                onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
              >
                <u>V</u>iew
              </button>
              {activeMenu === 'view' && (
                <div className="menu-dropdown-content">
                  <button type="button" onClick={() => handleMenuClick('/gallery')}>
                    Seed Gallery
                  </button>
                  <button type="button" onClick={() => handleMenuClick('/')}>
                    Home
                  </button>
                </div>
              )}
            </div>
            <div className="menu-dropdown">
              <button
                type="button"
                className={`menu-item ${activeMenu === 'tools' ? 'active' : ''}`}
                onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
              >
                <u>T</u>ools
              </button>
              {activeMenu === 'tools' && (
                <div className="menu-dropdown-content">
                  <button type="button" onClick={() => handleMenuClick('/cli')}>
                    CLI Commands
                  </button>
                  <button type="button" onClick={() => handleMenuClick('/settings')}>
                    Settings
                  </button>
                </div>
              )}
            </div>
            <div className="menu-dropdown">
              <button
                type="button"
                className={`menu-item ${activeMenu === 'help' ? 'active' : ''}`}
                onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
              >
                <u>H</u>elp
              </button>
              {activeMenu === 'help' && (
                <div className="menu-dropdown-content">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/settings');
                      setActiveMenu(null);
                      // Scroll to the About section after navigation
                      setTimeout(() => {
                        document
                          .getElementById('about-upg')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                  >
                    About UPG
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area - close menu when clicking outside */}
          <div
            role="presentation"
            onClick={() => setActiveMenu(null)}
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          >
            {children}
          </div>

          {/* Status Bar */}
          <div className="status-bar">
            <div className="status-field flex">{status}</div>
            <div className="status-field">UPG v{__APP_VERSION__}</div>
            <div className="status-field">Desktop</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WindowChrome;
