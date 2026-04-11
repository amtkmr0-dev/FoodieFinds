import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const error = this.state.error;
            const isNetworkError = error?.message?.includes('Network Error') ||
                error?.message?.includes('ERR_NETWORK') ||
                error?.message?.includes('ECONNABORTED');

            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-8">
                    <div className="max-w-md text-center">
                        <h1 className="text-2xl font-bold mb-4">
                            {isNetworkError ? 'Network Connection Issue' : 'Something went wrong'}
                        </h1>
                        <p className="text-muted-foreground mb-4">
                            {isNetworkError
                                ? 'Unable to connect to the server. Please check your internet connection and try again.'
                                : error?.message || 'Unknown error'}
                        </p>
                        {isNetworkError && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                                <p className="font-medium">Troubleshooting tips:</p>
                                <ul className="mt-1 text-left list-disc list-inside">
                                    <li>Check your internet connection</li>
                                    <li>Ensure you're not on airplane mode</li>
                                    <li>Try switching between WiFi and mobile data</li>
                                </ul>
                            </div>
                        )}
                        <button
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                            onClick={() => window.location.reload()}
                        >
                            Reload App
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;