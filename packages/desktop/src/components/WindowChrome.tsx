import { useState } from 'react';

/**
 * Windows 95 style window chrome with RGB animated border
 * Wraps the entire application in a retro aesthetic
 */

interface WindowChromeProps {
  children: React.ReactNode;
  title?: string;
}

function WindowChrome({ children, title = 'Universal Project Generator' }: WindowChromeProps) {
  const [isMaximized, setIsMaximized] = useState(false);

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
                title="Minimize"
                aria-label="Minimize"
              >
                _
              </button>
              <button
                type="button"
                className="title-bar-btn"
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? 'Restore' : 'Maximize'}
                aria-label={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? '=' : '+'}
              </button>
              <button
                type="button"
                className="title-bar-btn"
                title="Close"
                aria-label="Close"
              >
                X
              </button>
            </div>
          </div>

          {/* Menu Bar */}
          <div className="menu-bar">
            <button type="button" className="menu-item">
              <u>F</u>ile
            </button>
            <button type="button" className="menu-item">
              <u>E</u>dit
            </button>
            <button type="button" className="menu-item">
              <u>V</u>iew
            </button>
            <button type="button" className="menu-item">
              <u>T</u>ools
            </button>
            <button type="button" className="menu-item">
              <u>H</u>elp
            </button>
          </div>

          {/* Main Content Area */}
          {children}

          {/* Status Bar */}
          <div className="status-bar">
            <div className="status-field flex">Ready</div>
            <div className="status-field">UPG v0.1.0</div>
            <div className="status-field">Phase 2</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WindowChrome;
