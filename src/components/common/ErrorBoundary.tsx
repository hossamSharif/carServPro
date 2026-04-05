import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Bilingual error message since class components cannot use useTranslation */}
          <h2 className="text-xl font-semibold mb-2">
            <span lang="ar">حدث خطأ غير متوقع</span>
            <span className="mx-2 text-muted-foreground">/</span>
            <span lang="en">Something went wrong</span>
          </h2>

          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            <span lang="ar">عذراً، حدث خطأ أثناء تحميل هذا المحتوى.</span>
            <br />
            <span lang="en">Sorry, an error occurred while loading this content.</span>
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="text-xs text-destructive bg-destructive/5 p-3 rounded-md mb-4 max-w-lg overflow-auto text-start" dir="ltr">
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            <span lang="ar">حاول مرة أخرى</span>
            <span className="mx-2">/</span>
            <span lang="en">Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
