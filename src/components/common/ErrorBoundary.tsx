import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    logger.critical('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-1 p-6">
          <div className="max-w-md w-full bg-surface-2 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <h2 className="text-xl font-bold text-foreground">
                Oups ! Quelque chose s'est mal passé
              </h2>
            </div>
            
            <p className="text-muted-foreground mb-4">
              Une erreur s'est produite. Veuillez réessayer ou rafraîchir la page.
            </p>

            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-semibold">
                        Détails techniques
                      </summary>
                      <pre className="mt-2 text-xs whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Rafraîchir la page
              </Button>
              <Button
                onClick={this.handleReset}
                className="flex-1"
              >
                Réessayer
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground text-center">
              Si le problème persiste, contactez le support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

