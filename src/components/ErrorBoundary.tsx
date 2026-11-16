import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <h1 className="font-display text-lg font-semibold text-slate-900">
              เกิดข้อผิดพลาดในการทำงาน
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 cursor-pointer rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              โหลดหน้าใหม่
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
