import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 bg-rose-50 border border-rose-200 rounded-3xl text-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-3 text-rose-600">
            <AlertTriangle size={24} className="shrink-0" />
            <h3 className="font-bold text-base">此區塊載入時發生小錯誤</h3>
          </div>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            系統已攔截此問題避免白屏。您可以嘗試點擊下方按鈕重新載入畫面。
          </p>
          {this.state.error?.message && (
            <div className="p-3 mb-4 rounded-xl bg-rose-100/60 text-rose-800 font-mono text-[11px] break-all">
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleReload}
            className="py-2.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center gap-2 transition active:scale-95 shadow-sm"
          >
            <RefreshCw size={15} />
            <span>重新載入頁面</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
