import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Ops! Algo deu errado</h2>
              <p className="text-slate-500 dark:text-slate-400">
                Ocorreu um erro inesperado na aplicação. Nossa equipe técnica já foi notificada.
              </p>
            </div>
            {this.state.error && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-left overflow-hidden">
                <p className="text-xs font-mono text-red-500 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary w-full flex items-center justify-center space-x-2"
            >
              <RefreshCw size={18} />
              <span>Recarregar Página</span>
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
