import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors in child component trees,
 * log those errors, and display a fallback UI instead of crashing the entire app.
 * 
 * This helps prevent the entire application from crashing when a single component fails.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            const error = this.state.error;
            const isNetworkError = error?.message?.includes('Network Error') ||
                error?.message?.includes('ERR_NETWORK') ||
                error?.message?.includes('ECONNABORTED') ||
                error?.message?.includes('Failed to fetch');

            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-8" role="alert" aria-live="assertive">
                    <div className="max-w-md text-center">
                        <div className="mb-4 flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                <svg
                                    className="w-8 h-8 text-destructive"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold mb-4">
                            {isNetworkError ? 'Network Connection Issue' : 'Something went wrong'}
                        </h1>
                        <p className="text-muted-foreground mb-6">
                            {isNetworkError
                                ? 'Unable to connect to the server. Please check your internet connection and try again.'
                                : error?.message || 'An unexpected error occurred'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                aria-label="Reload the page"
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={() => this.setState({ hasError: false, error: null })}
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                                aria-label="Try again"
                            >
                                Try Again
                            </button>
                        </div>
                        {process.env.NODE_ENV === 'development' && error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                                    Error Details (Development Only)
                                </summary>
                                <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto max-h-48">
                                    {error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
