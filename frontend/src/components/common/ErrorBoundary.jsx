import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6 selection:bg-rose-500/30">
          <div className="max-w-md w-full relative group">
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 to-orange-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-slate-900 border border-slate-800 rounded-[2rem] p-10 shadow-2xl text-center backdrop-blur-xl">
              <div className="h-24 w-24 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-500/30 rotate-3 group-hover:rotate-6 transition-transform">
                <AlertTriangle className="h-12 w-12 text-rose-500" />
              </div>
              
              <h2 className="text-3xl font-black text-white tracking-tight mb-4">
                System Overload <span className="text-rose-500">⚠️</span>
              </h2>
              
              <p className="text-slate-400 font-medium leading-relaxed mb-10">
                An unexpected glitch has occurred. We've logged the error, but you might need to reboot the interface to continue.
              </p>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => window.location.reload()}
                  className="group relative flex items-center justify-center gap-3 bg-white text-slate-950 font-bold py-4 px-8 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all shadow-xl shadow-white/5"
                >
                  <RefreshCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" />
                  Reboot Interface
                </button>
                
                <button 
                  onClick={() => window.location.href = '/'}
                  className="flex items-center justify-center gap-3 bg-slate-800 text-slate-300 font-bold py-4 px-8 rounded-2xl hover:bg-slate-700 hover:text-white active:scale-95 transition-all border border-slate-700"
                >
                  <Home className="h-5 w-5" />
                  Return Base
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <div className="mt-10 pt-8 border-t border-slate-800/50">
                  <div className="text-left bg-black/40 rounded-2xl p-5 border border-slate-800/50">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Diagnostic Trace</p>
                    <code className="text-xs font-mono text-rose-400 block whitespace-pre-wrap leading-relaxed">
                      {this.state.error?.toString()}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
