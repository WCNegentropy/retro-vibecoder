/**
 * Middleware Enrichment Strategy
 *
 * Adds common middleware patterns for backend projects:
 * - Request logging
 * - Error handling
 * - CORS configuration
 * - Health check endpoint
 */

import type { EnrichmentStrategy, TechStack, EnrichmentFlags, EnrichmentContext } from '../../../types.js';

function generateTypescriptMiddleware(): string {
  return `import type { Request, Response, NextFunction } from 'express';

/** Request logging middleware */
export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, url } = req;

  _res.on('finish', () => {
    const duration = Date.now() - start;
    const status = _res.statusCode;
    console.log(\`\${method} \${url} \${status} \${duration}ms\`);
  });

  next();
}

/** Global error handler middleware */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Unhandled error:', err.message);

  const status = (err as Error & { status?: number }).status ?? 500;
  const message = status === 500 ? 'Internal Server Error' : err.message;

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/** Health check endpoint handler */
export function healthCheck(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

/** Not found handler — must be registered after all routes */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not Found' });
}
`;
}

function generatePythonMiddleware(): string {
  return `"""Common middleware for the application."""

import time
import logging
from functools import wraps

logger = logging.getLogger(__name__)


def request_logger(func):
    """Log incoming requests with timing."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.monotonic()
        response = await func(*args, **kwargs)
        duration = (time.monotonic() - start) * 1000
        logger.info(f"Request completed in {duration:.1f}ms")
        return response
    return wrapper


def health_check() -> dict:
    """Health check endpoint response."""
    return {
        "status": "ok",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
`;
}

function generateGoMiddleware(): string {
  return `package middleware

import (
\t"log"
\t"net/http"
\t"time"
)

// Logger logs each HTTP request with method, path, status, and duration.
func Logger(next http.Handler) http.Handler {
\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\tstart := time.Now()
\t\twrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
\t\tnext.ServeHTTP(wrapped, r)
\t\tlog.Printf("%s %s %d %v", r.Method, r.URL.Path, wrapped.statusCode, time.Since(start))
\t})
}

// Recover catches panics and returns a 500 error.
func Recover(next http.Handler) http.Handler {
\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\tdefer func() {
\t\t\tif err := recover(); err != nil {
\t\t\t\tlog.Printf("panic recovered: %v", err)
\t\t\t\thttp.Error(w, "Internal Server Error", http.StatusInternalServerError)
\t\t\t}
\t\t}()
\t\tnext.ServeHTTP(w, r)
\t})
}

// CORS adds Cross-Origin Resource Sharing headers.
func CORS(next http.Handler) http.Handler {
\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\tw.Header().Set("Access-Control-Allow-Origin", "*")
\t\tw.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
\t\tw.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
\t\tif r.Method == "OPTIONS" {
\t\t\tw.WriteHeader(http.StatusNoContent)
\t\t\treturn
\t\t}
\t\tnext.ServeHTTP(w, r)
\t})
}

type responseWriter struct {
\thttp.ResponseWriter
\tstatusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
\trw.statusCode = code
\trw.ResponseWriter.WriteHeader(code)
}
`;
}

export const MiddlewareEnrichStrategy: EnrichmentStrategy = {
  id: 'enrich-middleware',
  name: 'Middleware Enrichment',
  priority: 22,

  matches: (stack: TechStack, flags: EnrichmentFlags) =>
    flags.fillLogic && stack.archetype === 'backend',

  apply: async (context: EnrichmentContext) => {
    const { files, stack } = context;

    switch (stack.language) {
      case 'typescript':
      case 'javascript':
        files['src/middleware/index.ts'] = generateTypescriptMiddleware();
        break;
      case 'python':
        files['src/middleware.py'] = generatePythonMiddleware();
        break;
      case 'go':
        files['internal/middleware/middleware.go'] = generateGoMiddleware();
        break;
    }
  },
};
