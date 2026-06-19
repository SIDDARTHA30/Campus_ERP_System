import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useMemo, useEffect, useState } from 'react';
import api from '../services/api';
import { Bell, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import navigation from '../utils/navigation';

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notices, setNotices] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [noticesOpen, setNoticesOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleGlobalSearch = async (val) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const [stuRes, facRes, subRes] = await Promise.all([
        api.get(`/students?search=${val}&limit=3`).catch(() => ({ data: { data: { items: [] } } })),
        api.get(`/faculty?search=${val}&limit=3`).catch(() => ({ data: { data: { items: [] } } })),
        api.get(`/subjects?search=${val}&limit=3`).catch(() => ({ data: { data: { items: [] } } }))
      ]);
      setSearchResults({
        students: stuRes.data?.data?.items || [],
        faculty: facRes.data?.data?.items || [],
        subjects: subRes.data?.data?.items || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    api.get('/notices?limit=3')
      .then(res => {
        const items = res.data?.data?.items || [];
        setNotices(items);
        setUnreadCount(items.length);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    // Password Change Enforcement (Post-Auth logic)
    if (user?.mustChangePassword && location.pathname !== '/app/change-password') {
      navigate('/app/change-password', { replace: true });
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user, location.pathname, navigate]);

  const menuItems = useMemo(() => {
    if (user?.mustChangePassword) return [];
    return navigation[user?.role] || [];
  }, [user?.role, user?.mustChangePassword]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login'; // Force full reload to clean state
  };

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const handleLogoClick = () => {
    if (location.pathname === '/app') {
      navigate(0);
    } else {
      navigate('/app');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Outfit'] transition-colors duration-500">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-80 bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-100 dark:border-slate-800 lg:block p-6 transition-all duration-300">
          <div className="mb-10 px-4">
            <div 
              className="flex items-center gap-3 cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95" 
              onClick={handleLogoClick}
            >
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                <span className="text-white font-black text-xl">C</span>
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Campus ERP</div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 opacity-70">Smart Management</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 ${
                    isActive 
                      ? 'sidebar-active translate-x-2' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 hover:translate-x-1'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-10 px-4">
             <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">User Account</p>
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user?.name}</p>
             </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col relative">
          {/* Header */}
          <header className="m-4 lg:m-6 sticky top-0 z-50">
            <div className="header-gradient rounded-3xl p-5 lg:px-8 flex items-center justify-between shadow-2xl backdrop-blur-xl border border-white/10">
              <div 
                className="flex items-center gap-4 cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95"
                onClick={handleLogoClick}
              >
                <div className="lg:hidden h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                  <span className="text-white font-bold">C</span>
                </div>
                <div className="fade-in-up">
                  <h1 className="text-lg font-black tracking-tight text-white leading-tight group-hover:text-blue-100 transition-colors">Campus ERP</h1>
                  <p className="text-[10px] font-bold text-blue-100/70 uppercase tracking-widest hidden sm:block">Institution Management System</p>
                </div>
              </div>

              {/* Global Search Bar */}
              <div className="hidden lg:flex relative items-center max-w-xs w-64 z-50">
                <Search className="absolute left-3.5 h-4 w-4 text-white/40" />
                <input 
                  type="text"
                  placeholder="Search campus database..."
                  value={searchQuery}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 hover:bg-white/15 focus:bg-slate-900 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-white/40 font-bold focus:outline-none transition-all duration-300 shadow-inner"
                />

                <AnimatePresence>
                  {searchFocused && (searchQuery.trim().length >= 2) && (
                    <>
                      <div className="fixed inset-0 z-40 cursor-default" onClick={() => setSearchFocused(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 top-11 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-200 z-50 overflow-hidden"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">Global Database Search</span>
                          {searchLoading && <span className="h-3 w-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />}
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-none">
                          {/* Student Results */}
                          {searchResults?.students?.length > 0 && (
                            <div>
                              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Students</p>
                              <div className="space-y-1">
                                {searchResults.students.map(s => (
                                  <div 
                                    key={s._id}
                                    onClick={() => {
                                      setSearchFocused(false);
                                      navigate(`/app/students`);
                                    }}
                                    className="p-2 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-slate-800 cursor-pointer text-left transition-all"
                                  >
                                    <p className="text-[11px] font-black text-white">{s.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">{s.admissionNo} • {s.department}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Faculty Results */}
                          {searchResults?.faculty?.length > 0 && (
                            <div>
                              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Faculty</p>
                              <div className="space-y-1">
                                {searchResults.faculty.map(f => (
                                  <div 
                                    key={f._id}
                                    onClick={() => {
                                      setSearchFocused(false);
                                      navigate(`/app/faculty`);
                                    }}
                                    className="p-2 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-slate-800 cursor-pointer text-left transition-all"
                                  >
                                    <p className="text-[11px] font-black text-white">{f.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">{f.department} • Faculty ID: {f.facultyId}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Subject Results */}
                          {searchResults?.subjects?.length > 0 && (
                            <div>
                              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Subjects</p>
                              <div className="space-y-1">
                                {searchResults.subjects.map(sub => (
                                  <div 
                                    key={sub._id}
                                    onClick={() => {
                                      setSearchFocused(false);
                                      navigate(`/app/subjects`);
                                    }}
                                    className="p-2 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-slate-800 cursor-pointer text-left transition-all"
                                  >
                                    <p className="text-[11px] font-black text-white">{sub.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">{sub.code} • {sub.department}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(!searchResults || (!searchResults.students.length && !searchResults.faculty.length && !searchResults.subjects.length)) && !searchLoading && (
                            <p className="text-[10px] text-slate-500 font-bold text-center py-4">No records found matching query</p>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-3">
                {/* Notification Dropdown */}
                <div className="relative">
                  <button 
                    className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/10 relative" 
                    onClick={() => setNoticesOpen(!noticesOpen)}
                    title="System Notices"
                  >
                    <Bell className="h-5 w-5 text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-red-500 animate-pulse" />
                    )}
                  </button>

                  <AnimatePresence>
                    {noticesOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setNoticesOpen(false)} />
                        
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-200 z-50 overflow-hidden"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">System Broadcasts</span>
                            {unreadCount > 0 && (
                              <button 
                                onClick={() => setUnreadCount(0)}
                                className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                Dismiss
                              </button>
                            )}
                          </div>

                          <div className="space-y-2.5">
                            {notices.length === 0 ? (
                              <p className="text-[11px] text-slate-500 font-semibold py-4 text-center">No active announcements</p>
                            ) : (
                              notices.map((n) => (
                                <div 
                                  key={n._id} 
                                  onClick={() => {
                                    setNoticesOpen(false);
                                    navigate('/app/notices');
                                  }}
                                  className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-slate-800 cursor-pointer transition-all"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className={`h-1.5 w-1.5 rounded-full ${n.priority === 'high' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                                    <span className="text-[9px] font-black uppercase text-slate-400 truncate">{n.title}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{n.content}</p>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="border-t border-slate-800 pt-2.5 mt-3 text-center">
                            <button 
                              onClick={() => {
                                setNoticesOpen(false);
                                navigate('/app/notices');
                              }}
                              className="text-[9px] font-black uppercase text-slate-400 hover:text-white transition-colors"
                            >
                              Open Broadcast Center &rarr;
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/10 group overflow-hidden" 
                  onClick={toggleDarkMode}
                  title="Toggle Theme"
                >
                  <div className="relative h-6 w-6">
                    <span className="absolute inset-0 flex items-center justify-center transition-transform duration-500 dark:-rotate-90 dark:scale-0">🌙</span>
                    <span className="absolute inset-0 flex items-center justify-center transition-transform duration-500 rotate-90 scale-0 dark:rotate-0 dark:scale-100">☀️</span>
                  </div>
                </button>
                
                <div className="hidden md:flex flex-col items-end px-4 border-r border-white/20">
                  <p className="text-sm font-black text-white leading-none">{user?.name}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-blue-100/70 mt-1">{user?.role}</p>
                </div>

                <button 
                  className="px-5 py-2.5 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 text-[10px] uppercase tracking-widest" 
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-4 lg:px-8 pb-10">
            <div className="mx-auto w-full max-w-7xl page-enter">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;