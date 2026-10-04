import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NutriSnap ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200/90 p-6 md:p-8 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h2 className="text-xl font-serif font-black text-stone-900 mb-2">
              {this.props.fallbackTitle || 'Something unexpected happened'}
            </h2>
            <p className="text-xs md:text-sm text-stone-600 mb-6 leading-relaxed font-medium">
              We encountered a temporary display issue. Don't worry, your health data and meal logs are safe and sound.
            </p>

            {this.state.error?.message && (
              <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 mb-6 text-left text-[11px] font-mono text-stone-600 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reload Screen
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
