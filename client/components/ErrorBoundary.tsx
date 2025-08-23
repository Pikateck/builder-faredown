import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Something went wrong
                </h2>
                <p className="text-sm text-gray-600">
                  We encountered an unexpected error
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Reload Page
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Go to Home
              </button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-gray-600">
                  Error Details (Dev Mode)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-red-600 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {"\n\nComponent Stack:"}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
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
