import { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

/**
 * Status bar context for dynamic status messages
 *
 * Generation pages push messages here (e.g., "Generating...", "✓ Generated 12 files in 340ms").
 * WindowChrome reads and displays the current status.
 */

interface StatusContextType {
  /** Current status message displayed in the status bar */
  status: string;
  /** Update the status message. Auto-reverts to "Ready" after timeout (default 5s). */
  setStatus: (message: string, timeout?: number) => void;
}

const StatusContext = createContext<StatusContextType>({
  status: 'Ready',
  setStatus: () => {},
});

export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatusState] = useState('Ready');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setStatus = useCallback((message: string, timeout?: number) => {
    // Clear any pending revert timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setStatusState(message);

    // Auto-revert to "Ready" after timeout (default 5s), unless timeout is 0 (persistent)
    if (timeout !== 0) {
      timerRef.current = setTimeout(() => {
        setStatusState('Ready');
        timerRef.current = null;
      }, timeout ?? 5000);
    }
  }, []);

  return <StatusContext.Provider value={{ status, setStatus }}>{children}</StatusContext.Provider>;
}

export function useStatus() {
  return useContext(StatusContext);
}
