import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-right" dir="rtl">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">عذراً، حدث خطأ غير متوقع</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              واجه التطبيق مشكلة تقنية بسيطة، لا تقلق فجميع بياناتك ومعاملاتك محفوظة بأمان. يمكنك إعادة تحميل الصفحة للعودة فوراً.
            </p>
            {this.state.error && (
              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة تشغيل المنصة الآن</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
