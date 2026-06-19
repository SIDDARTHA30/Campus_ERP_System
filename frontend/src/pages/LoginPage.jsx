import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, Mail, Lock } from 'lucide-react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const resolveDestination = (role) => {
    const from = location.state?.from?.pathname;
    if (from && from !== '/login') {
      return from;
    }
    return '/app';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const user = await login(email.trim(), password);
      navigate(resolveDestination(user.role), { replace: true });
    } catch (err) {
      const details = err.response?.data?.data?.details;
      const firstDetail = Array.isArray(details) && details.length ? String(details[0]) : '';
      setError(firstDetail || err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 font-['Outfit'] selection:bg-brand-100 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-200/30 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="grid w-full max-w-6xl gap-0 lg:grid-cols-5 glass-card !rounded-[2.5rem] shadow-2xl shadow-brand-200/50 relative z-10">
        {/* Brand Side */}
        <div className="lg:col-span-2 header-gradient p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="relative z-10">
            <div className="h-14 w-14 rounded-[1.25rem] bg-white flex items-center justify-center shadow-2xl">
              <ShieldCheck className="h-8 w-8 text-brand-600" strokeWidth={2.5} />
            </div>
            <h1 className="mt-10 text-5xl font-black text-white leading-[1.1] tracking-tight">
              Campus ERP <br />
              <span className="text-blue-200">System.</span>
            </h1>
            <p className="mt-6 text-blue-50/80 font-medium text-lg leading-relaxed max-w-sm">
              Manage students, attendance, marks, and academic records easily.
            </p>
          </div>

          <div className="relative z-10 mt-12 pt-10 border-t border-white/20">
            <div className="flex items-center gap-4">
               <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-blue-600 bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600">
                       U{i}
                    </div>
                  ))}
               </div>
               <p className="text-sm font-bold text-white">Joined by 1,000+ Students</p>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="lg:col-span-3 bg-white p-12 lg:p-20 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <header>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Login</h2>
              <p className="mt-3 text-slate-500 font-medium">Enter your email and password to continue.</p>
            </header>

            <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input 
                    className="input !pl-12 !py-4" 
                    type="email" 
                    placeholder="name@institution.ac.in"
                    value={email} 
                    onChange={(event) => setEmail(event.target.value)} 
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Password</label>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input 
                    className="input !pl-12 !py-4" 
                    type="password" 
                    placeholder="••••••••"
                    value={password} 
                    onChange={(event) => setPassword(event.target.value)} 
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 animate-shake">
                  <div className="h-8 w-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <span className="text-red-600 font-black">!</span>
                  </div>
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
              )}

              <button className="btn-primary w-full !py-4 !rounded-2xl flex items-center justify-center gap-3 text-lg group" disabled={loading} type="submit">
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <footer className="mt-12 text-center text-slate-400 text-xs font-medium">
               &copy; 2026 Campus ERP System
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;