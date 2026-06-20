import { useEffect, useMemo, useState, useRef } from 'react';
import StudentProfileModal from '../components/students/StudentProfileModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FormModal from '../components/common/FormModal';
import { toast } from 'react-hot-toast';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import { 
  Plus, 
  Upload, 
  Trash2, 
  Edit, 
  Search, 
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

function CrudPage({ 
  title, 
  endpoint, 
  fields = [], 
  allowDelete = true, 
  allowBulk = true,
  customFilters = [],
  renderCustomList
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';
  
  const canCreate = isAdmin || isFaculty;
  const canEdit = isAdmin || isFaculty;
  const canDelete = isAdmin || isFaculty;
  const canBulk = isAdmin || isFaculty;

  const [items, setItems] = useState([]);
  const [profileStudent, setProfileStudent] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const handleRowClick = async (it) => {
    if (title !== 'Students') return;
    setProfileStudent(it);
    setProfileLoading(true);
    try {
      const [marksRes, attendanceRes] = await Promise.all([
        api.get(`/marks/analytics/student?studentId=${it._id || it.id}`).catch(() => ({ data: { data: null } })),
        api.get(`/attendance/analytics?studentId=${it._id || it.id}`).catch(() => ({ data: { data: null } }))
      ]);
      setProfileData({
        marks: marksRes.data?.data,
        attendance: attendanceRes.data?.data
      });
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({});
  const [uploadSummary, setUploadSummary] = useState(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query string
      // Build query string, filtering out empty values to avoid 400 errors
      const queryParams = {
        page,
        limit,
        search,
        ...filters
      };
      
      const cleanParams = Object.keys(queryParams).reduce((acc, key) => {
        if (queryParams[key] !== '' && queryParams[key] !== undefined && queryParams[key] !== null) {
          acc[key] = queryParams[key];
        }
        return acc;
      }, {});
      
      const params = new URLSearchParams(cleanParams);
      
      const res = await api.get(`${endpoint}?${params.toString()}`);
      setItems(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, pages: 1 });
      // Smooth scroll to top of table on page change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load records';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Reload when page, limit, search, or filters change
  useEffect(() => { 
    load(); 
  }, [page, limit, search, filters]);

  const onCreate = () => { setSelected(null); setModalOpen(true); };
  const onEdit = (it) => { setSelected(it); setModalOpen(true); };
  const onClose = () => { setModalOpen(false); setSelected(null); };

  const onSave = async (form) => {
    setSaving(true);
    try {
      const displayTitle = title || 'Record';
      if (selected) {
        await api.put(`${endpoint}/${selected._id || selected.id}`, form);
        toast.success(`${displayTitle.replace('s', '')} updated successfully`);
      } else {
        await api.post(endpoint, form);
        toast.success(`${displayTitle.replace('s', '')} created successfully. Account verified.`, {
          duration: 4000,
          icon: '✅'
        });
      }
      onClose();
      await load();
    } catch (err) {
      let msg = err.response?.data?.message || 'Action failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!allowDelete) return;
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success(`${(title || 'Record').replace('s', '')} deleted successfully`);
      await load(); // Reload to update pagination
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const onDeleteAll = async () => {
    const displayTitle = title || 'Records';
    const confirmation = prompt(`🚨 CRITICAL: This will delete ALL ${displayTitle.toLowerCase()} records. Type "DELETE" to confirm:`);
    if (confirmation !== 'DELETE') {
      if (confirmation !== null) toast.error('Deletion cancelled');
      return;
    }
    
    setLoading(true);
    try {
      await api.delete(`${endpoint}/clear-all`);
      toast.success(`All ${displayTitle.toLowerCase()} records cleared`);
      setPage(1); // Reset to page 1
      await load();
    } catch (err) {
      toast.error('Bulk deletion failed');
    } finally {
      setLoading(false);
    }
  };

  const onBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await api.post(`${endpoint}/bulk-upload`, formData);
      const summary = res.data.data;
      
      setUploadSummary({
        total: summary.total || (summary.created + summary.skipped),
        created: summary.created || 0,
        duplicates: summary.duplicates || 0,
        invalid: summary.invalid || 0,
        skipped: summary.skipped || 0,
        errors: summary.errors || []
      });
      
      if (summary.created > 0) {
        toast.success(`Successfully imported ${summary.created} records`);
      }
      if (summary.skipped > 0) {
        toast.error(`${summary.skipped} rows skipped.`);
      }
      setPage(1); // Reset to page 1
      await load();
    } catch (err) {
      toast.error('Bulk upload failed. Ensure CSV format is correct.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadErrorReport = () => {
    if (!uploadSummary || !uploadSummary.errors || !uploadSummary.errors.length) return;
    const headers = ['Row Number', 'Error Reason', 'Type'];
    const csvRows = [headers.join(',')];
    uploadSummary.errors.forEach(err => {
      csvRows.push([
        err.row,
        `"${err.error.replace(/"/g, '""')}"`,
        err.code || 'INVALID'
      ].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase()}_failed_rows.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (!items.length) {
      toast.error('No records available to export');
      return;
    }
    const headers = fields.map(f => f.name);
    const csvRows = [headers.join(',')];
    items.forEach(it => {
      const values = fields.map(f => {
        const val = it[f.name];
        if (typeof val === 'object' && val !== null) {
          return `"${val.name || val.code || ''}"`;
        }
        return `"${String(val || '').replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase()}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${title} list exported successfully!`);
  };

  // Pagination Helper
  const showingFrom = pagination.total === 0 ? 0 : (page - 1) * (limit === 'all' ? pagination.total : limit) + 1;
  const showingTo = limit === 'all' ? pagination.total : Math.min(page * limit, pagination.total);

  return (
    <div className="space-y-8 pb-12 fade-in-up">
      {/* Action Bar */}
      <section className="bg-white dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 shadow-xl shadow-slate-200/40 dark:shadow-2xl dark:shadow-black/20 rounded-3xl p-6 border-l-8 border-brand-600">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title || 'Records'}</h2>
            <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400 italic">Centralized management for {(title || 'Records').toLowerCase()} records.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canBulk && allowBulk && (
              <>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={onBulkUpload} />
                <button 
                  className="btn-secondary flex items-center gap-2" 
                  onClick={handleExportCSV}
                  disabled={loading}
                >
                  <Upload className="h-4 w-4 rotate-180" />
                  Download CSV
                </button>
                <button 
                  className="btn-secondary flex items-center gap-2" 
                  onClick={() => fileInputRef.current.click()}
                  disabled={loading}
                >
                  <Upload className="h-4 w-4" />
                  Bulk Upload
                </button>
              </>
            )}
            {canCreate && (
              <button 
                className="btn-primary flex items-center gap-2" 
                onClick={onCreate}
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                Add {(title || 'Record').replace('s', '')}
              </button>
            )}
            {isAdmin && allowDelete && pagination.total > 0 && (
              <button 
                className="btn-secondary border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 flex items-center gap-2" 
                onClick={onDeleteAll}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="mt-8 grid gap-4 md:flex md:items-center pt-8 border-t border-slate-200/60 dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-600" />
            <input 
              className="input pl-12 h-12" 
              type="search" 
              placeholder={`Quick search ${(title || 'Records').toLowerCase()}...`} 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            {customFilters.map(filter => (
              <select 
                key={filter.name}
                className="input h-12 w-full md:w-48 font-semibold text-slate-600 dark:text-slate-300"
                value={filters[filter.name] || ''}
                onChange={(e) => { setFilters(prev => ({ ...prev, [filter.name]: e.target.value })); setPage(1); }}
              >
                <option value="">All {filter.label}</option>
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ))}
          </div>
        </div>
      </section>

      {/* Content Table */}
      <section className="table-container">
        {loading ? (
          <div className="py-32"><LoadingState label={`Optimizing ${(title || 'Records').toLowerCase()} records...`} /></div>
        ) : !items.length ? (
          <div className="py-32 flex flex-col items-center justify-center text-center px-4 bg-white dark:bg-slate-900/40">
            <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 rotate-3">
              <AlertCircle className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">No records found</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
              {search || Object.values(filters).some(v => v) 
                ? "Your filters didn't match any results. Try broadening your search." 
                : `The ${(title || 'Records').toLowerCase()} list is currently empty. Get started by adding a record.`}
            </p>
          </div>
        ) : (
          <>
            {renderCustomList ? (
              renderCustomList(items, { onEdit, onDelete, canEdit, canDelete })
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
                <table className="modern-table">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                    <tr>
                      {fields.slice(0, 5).map((f) => (
                        <th key={f.name}>{f.label}</th>
                      ))}
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((it) => {
                      const id = it._id || it.id;
                      return (
                        <tr 
                          key={id} 
                          onClick={(e) => {
                            if (e.target.closest('button') || e.target.closest('a')) return;
                            handleRowClick(it);
                          }}
                          className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${title === 'Students' ? 'cursor-pointer' : ''}`}
                        >
                          {fields.slice(0, 5).map((f) => (
                            <td key={f.name} className="font-semibold text-slate-700 dark:text-slate-300">
                              {f.name === 'status' && endpoint.includes('attendance') ? (
                                <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  it[f.name] === 'present' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' : 'bg-red-950/40 text-red-400 border-red-900/40'
                                }`}>
                                  {it[f.name]}
                                </span>
                              ) : typeof it[f.name] === 'object' && it[f.name] !== null ? (
                                it[f.name].name || it[f.name].code || it[f.name].employeeCode || it[f.name].title || JSON.stringify(it[f.name])
                              ) : (
                                (it[f.name] !== undefined && it[f.name] !== null && it[f.name] !== '') ? String(it[f.name]) : '-'
                              )}
                            </td>
                          ))}
                          <td className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canEdit && (
                                <button 
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400" 
                                  onClick={() => onEdit(it)}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button 
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-red-600 dark:text-red-400" 
                                  onClick={() => onDelete(id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            <div className="px-6 py-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  {showingFrom}–{showingTo} of {pagination.total} Records
                </span>
                <select 
                  className="input h-10 py-0 px-3 text-xs w-32 font-bold"
                  value={limit}
                  onChange={(e) => { setLimit(e.target.value); setPage(1); }}
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                  <option value="all">View All</option>
                </select>
              </div>

              {limit !== 'all' && pagination.pages > 1 && (
                <div className="flex items-center gap-2">
                  <button 
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-blue-400 hover:border-brand-200 dark:hover:border-blue-900 transition-all shadow-sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <div className="flex items-center gap-1.5">
                    {[...Array(pagination.pages)].map((_, i) => {
                      const p = i + 1;
                      if (pagination.pages > 7) {
                        if (p !== 1 && p !== pagination.pages && (p < page - 1 || p > page + 1)) {
                          if (p === page - 2 || p === page + 2) return <span key={p} className="px-1 text-slate-300 dark:text-slate-600">...</span>;
                          return null;
                        }
                      }
                      return (
                        <button 
                          key={p}
                          onClick={() => setPage(p)}
                          className={`h-10 w-10 rounded-xl text-sm font-black transition-all ${page === p ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-brand-200 dark:hover:border-blue-900 hover:text-brand-600 dark:hover:text-blue-400'}`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-blue-400 hover:border-brand-200 dark:hover:border-blue-900 transition-all shadow-sm"
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {modalOpen && (fields || []).length > 0 && (
        <FormModal 
          open={modalOpen} 
          title={selected ? `Edit ${(title || 'Record').replace('s', '')}` : `Add ${(title || 'Record').replace('s', '')}`} 
          fields={fields || []} 
          initialValues={selected || {}} 
          onClose={onClose} 
          onSubmit={onSave} 
          loading={saving} 
        />
      )}

      {profileStudent && (
        <StudentProfileModal 
          student={profileStudent} 
          data={profileData} 
          loading={profileLoading} 
          onClose={() => { setProfileStudent(null); setProfileData(null); }} 
        />
      )}

      {uploadSummary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-6 text-left relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-40 w-40 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                📋 CSV Upload Summary
              </h3>
              <button 
                onClick={() => setUploadSummary(null)}
                className="text-slate-400 hover:text-white transition font-black text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Rows</p>
                <p className="text-2xl font-black text-white mt-1">{uploadSummary.total}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/30 text-emerald-400">
                <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest font-black">Successful</p>
                <p className="text-2xl font-black mt-1">{uploadSummary.created}</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/30 text-amber-400">
                <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest font-black">Duplicates</p>
                <p className="text-2xl font-black mt-1">{uploadSummary.duplicates}</p>
              </div>
              <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/30 text-red-400">
                <p className="text-[10px] font-black text-red-500/70 uppercase tracking-widest font-black">Invalid Rows</p>
                <p className="text-2xl font-black mt-1">{uploadSummary.invalid}</p>
              </div>
            </div>

            {uploadSummary.errors && uploadSummary.errors.length > 0 ? (
              <div className="space-y-4">
                <div className="border-t border-slate-800 pt-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Error Logs ({uploadSummary.errors.length})</p>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 scrollbar-none">
                    {uploadSummary.errors.slice(0, 50).map((err, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-slate-950/50 border border-slate-850 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Row {err.row}</span>
                        <span className={`${err.code === 'DUPLICATE' ? 'text-amber-400' : 'text-red-400'} max-w-[200px] truncate`}>{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={downloadErrorReport}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg transition duration-200 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-indigo-500/20"
                >
                  ⚠️ Download CSV Error Report
                </button>
              </div>
            ) : (
              <div className="border-t border-slate-800 pt-4 text-center py-4">
                <span className="text-xs text-emerald-400 font-bold">🎉 All rows successfully uploaded without errors!</span>
              </div>
            )}

            <button 
              onClick={() => setUploadSummary(null)}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded-2xl transition duration-200 uppercase tracking-widest text-[10px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrudPage;
