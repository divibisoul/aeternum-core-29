/**
 * ERROR BOUNDARY
 * 
 * Isolates module failures - a crash in one module never takes down the app.
 * Provides graceful error recovery UI with HUD styling.
 */

import React, { Component, type ReactNode } from 'react';
import { EventBus } from './EventBus';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorBoundaryProps {
  children: ReactNode;
  moduleId?: string;
  moduleName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ModuleErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // Emit error event
    if (this.props.moduleId) {
      EventBus.emit('module:error', {
        id: this.props.moduleId,
        error: error.message,
      });
    }

    EventBus.emit('system:error', {
      error: error.message,
      context: `Module: ${this.props.moduleName || this.props.moduleId || 'Unknown'}`,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ModuleErrorBoundary] Caught error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleDismiss = (): void => {
    // Just show the error state, could navigate away
    EventBus.emit('nav:module:select', { moduleId: 'settings' });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex h-full w-full items-center justify-center p-8"
          >
            <div className="glass hud-corner relative max-w-md p-6">
              {/* Error Icon */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Module Error
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {this.props.moduleName || this.props.moduleId || 'Unknown module'}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 border border-destructive/20">
                <code className="text-xs text-destructive/90 break-all">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </code>
              </div>

              {/* Stack trace in dev */}
              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    Show stack trace
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-muted/50 p-2 text-[10px] text-muted-foreground">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={this.handleRetry}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/30"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
                <button
                  onClick={this.handleDismiss}
                  className="flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                >
                  <X className="h-4 w-4" />
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      );
    }

    return this.props.children;
  }
}

/**
 * Global Error Boundary for the entire app
 */
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Critical error:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <div className="glass max-w-lg p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="font-display mb-2 text-2xl font-bold text-foreground">
              System Error
            </h1>
            <p className="mb-4 text-muted-foreground">
              Aeternum encountered a critical error and needs to restart.
            </p>
            <code className="mb-6 block rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {this.state.error?.message}
            </code>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Restart System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
