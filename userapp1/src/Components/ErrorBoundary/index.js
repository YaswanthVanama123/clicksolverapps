/**
 * ErrorBoundary - Main Export File
 *
 * Purpose:
 * - Export all ErrorBoundary related components and utilities
 * - Provide clean import interface for the rest of the app
 *
 * Usage:
 * import ErrorBoundary, { ErrorLogger, FallbackComponent } from './Components/ErrorBoundary';
 * or
 * import { withErrorBoundary } from './Components/ErrorBoundary';
 */

// Main ErrorBoundary component
export {default} from './ErrorBoundary';
export {default as ErrorBoundary} from './ErrorBoundary';
export {withErrorBoundary} from './ErrorBoundary';

// Fallback UI component
export {default as FallbackComponent} from './FallbackComponent';

// Error logging utilities
export {default as ErrorLogger} from './ErrorLogger';
export {
  logError,
  logNonFatalError,
  setUserContext,
  clearUserContext,
  logBreadcrumb,
} from './ErrorLogger';
