import { useEffect, useMemo, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FormModal from '../components/common/FormModal';
import { toast } from 'react-hot-toast';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import { 
  Upload, 
  Trash2, 
  Edit, 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  BookOpen
} from 'lucide-react';

const fields = [
  { name: 'code', label: 'Subject Code', required: true },
  { name: 'name', label: 'Subject Name', required: true },
  { name: 'department', label: 'Department', type: 'select', options: [
    { label: 'CSE', value: 'CSE' },
    { label: 'IT', value: 'IT' },
    { label: 'AI&DS', value: 'AI&DS' },
    { label: 'AIML', value: 'AIML' },
    { label: 'CSBS', value: 'CSBS' },
    { label: 'ECE', value: 'ECE' },
    { label: 'EEE', value: 'EEE' },
    { label: 'MECH', value: 'MECH' },
    { label: 'CIVIL', value: 'CIVIL' },
    { label: 'CHEMICAL', value: 'CHEMICAL' },
    { label: 'BIOTECH', value: 'BIOTECH' }
  ]},
  { name: 'semester', label: 'Semester', type: 'number' },
  { name: 'credits', label: 'Credits', type: 'number' },
  { name: 'faculty', label: 'Faculty', type: 'select', options: [] } // Will populate dynamically
];

export default function SubjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';
  const canManage = isAdmin || isFaculty;

  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState('all');
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fileInputRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search
      };

      if (filterDept && filterDept !== "All Departments") {
        params.department = filterDept;
      }

      const queryStr = new URLSearchParams(params).toString();

      const requests = [api.get(`/subjects?${queryStr}`)];
      
      // Only fetch faculty if user is admin or faculty (to avoid 403 for students)
      const canManage = ['admin', 'faculty'].includes(user?.role);
      if (canManage) {
        requests.push(api.get('/faculty?limit=100'));
      }

      const [subRes, facRes] = await Promise.all(requests);
      
      setSubjects(subRes.data.data || []);
      setPagination(subRes.data.pagination || { total: 0, pages: 1 });
      
      if (canManage && facRes) {
        setFaculties(facRes.data.data || []);
      }
      // Smooth scroll to top on page change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadData(); 
  }, [page, limit, search, filterDept]);

  const dynamicFields = useMemo(() => {
    return fields.map(f => {
      if (f.name === 'faculty') {
        return {
          ...f,
          options: faculties.map(fac => ({
            label: `${fac.name} (${fac.employeeCode})`,
            value: fac._id
          }))
        };
      }
      return f;
    });
  }, [faculties]);

  const onSave = async (form) => {
    setSaving(true);
    try {
      if (selected) {
        await api.put(`/subjects/${selected._id}`, form);
        toast.success('Subject updated successfully');
      } else {
        await api.post('/subjects', form);
        toast.success('Subject created successfully');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this subject?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      toast.success('Subject deleted successfully');
      loadData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const onDeleteAll = async () => {
    const confirmation = prompt('🚨 CRITICAL: This will delete ALL subjects. Type "DELETE" to confirm:');
    if (confirmation !== 'DELETE') {
      toast.error('Deletion cancelled');
      return;
    }
    
    setLoading(true);
    try {
      await api.delete('/subjects/clear-all');
      toast.success('All subjects cleared successfully');
      setPage(1);
      await loadData();
    } catch (err) {
      toast.error('Failed to clear subjects');
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
      const res = await api.post('/subjects/bulk-upload', formData);
      const { created, skipped, errors } = res.data.data;
      
      if (created > 0) {
        toast.success(`Successfully imported ${created} subjects`);
      }
      if (skipped > 0) {
        toast.error(`${skipped} rows were skipped.`);
        console.table(errors);
      }
      setPage(1);
      await loadData();
    } catch (err) {
      toast.error('Bulk upload failed');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const showingFrom = pagination.total === 0 ? 0 : (page - 1) * (limit === 'all' ? pagination.total : limit) + 1;
  const showingTo = limit === 'all' ? pagination.total : Math.min(page * limit, pagination.total);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <section className="glass-card p-6 border-b-4 border-blue-600">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              Manage Subjects
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-70">
              Academic Curriculum & Resource Control
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canManage && (
              <>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={onBulkUpload} />
                <button 
                  className="btn-secondary !px-4 !py-2 text-xs flex items-center gap-2" 
                  onClick={() => fileInputRef.current.click()}
                  disabled={loading}
                >
                  <Upload className="h-4 w-4" />
                  Bulk Upload
                </button>
                <button 
                  className="btn-primary !px-4 !py-2 text-xs flex items-center gap-2" 
                  onClick={() => { setSelected(null); setModalOpen(true); }}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                  Add Subject
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 min-w-[300px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" />
            <input 
              className="input !pl-12 !h-12 !rounded-2xl" 
              type="search" 
              placeholder="Quick search by code, name or faculty..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select 
            className="input !h-12 w-full md:w-56 font-bold text-slate-600 dark:text-slate-300 !rounded-2xl" 
            value={filterDept} 
            onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
          >
            <option value="">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="IT">IT</option>
            <option value="AI&DS">AI&DS</option>
            <option value="AIML">AIML</option>
            <option value="CSBS">CSBS</option>
            <option value="MECH">Mechanical</option>
            <option value="CIVIL">Civil</option>
            <option value="CHEMICAL">Chemical</option>
            <option value="BIOTECH">Biotech</option>
          </select>
        </div>
      </section>

      {/* Table Section */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
          Total Subjects: <span className="text-blue-600 dark:text-blue-400">{pagination.total}</span>
        </p>
      </div>

      <section className="table-container">
        {loading ? (
          <div className="py-24 space-y-4 px-6">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full opacity-80" />
            <div className="skeleton h-12 w-full opacity-60" />
            <div className="skeleton h-12 w-full opacity-40" />
          </div>
        ) : !subjects.length ? (
          <div className="py-24 text-center">
            <EmptyState title="No subjects available yet" description="Start by adding your first subject or adjusting the filters." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="modern-table relative">
                <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                  <tr>
                    <th>Code</th>
                    <th>Subject Details</th>
                    <th>Department</th>
                    <th>Assigned Faculty</th>
                    {canManage && <th className="text-right">Actions</th>}
                    {!canManage && <th className="text-right">View</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {subjects.map((s) => (
                    <tr key={s._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="font-black text-blue-600 dark:text-blue-400">{s.code}</td>
                      <td>
                        <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                          Credits: {s.credits || 0} • Sem: {s.semester || 1}
                        </p>
                      </td>
                      <td>
                        <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
                          {s.department || 'General'}
                        </span>
                      </td>
                      <td className="font-bold text-slate-600 dark:text-slate-400 italic text-xs">
                        {s.faculty?.name || 'Unassigned'}
                      </td>
                      <td className="text-right">
                        {canManage ? (
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="p-2 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 active:scale-90"
                              onClick={() => onEdit(s)}
                              title="Edit Subject"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {isAdmin && (
                              <button 
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all text-slate-400 hover:text-red-600 dark:hover:text-red-400 active:scale-90"
                                onClick={() => onDelete(s._id)}
                                title="Delete Subject"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-300 inline-block" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Showing {showingFrom}–{showingTo} of {pagination.total} | Page {page} of {pagination.pages}
                </span>
                <select 
                  className="input py-1 px-2 text-xs w-24"
                  value={limit}
                  onChange={(e) => { setLimit(e.target.value); setPage(1); }}
                >
                  <option value="10">10 / page</option>
                  <option value="25">25 / page</option>
                  <option value="50">50 / page</option>
                  <option value="100">100 / page</option>
                  <option value="all">Show All</option>
                </select>
              </div>

              {limit !== 'all' && pagination.pages > 1 && (
                <div className="flex items-center gap-2">
                  <button 
                    className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(pagination.pages)].map((_, i) => {
                      const p = i + 1;
                      if (pagination.pages > 7) {
                        if (p !== 1 && p !== pagination.pages && (p < page - 1 || p > page + 1)) {
                          if (p === page - 2 || p === page + 2) return <span key={p} className="px-1 text-slate-400 dark:text-slate-600">...</span>;
                          return null;
                        }
                      }
                      return (
                        <button 
                          key={p}
                          onClick={() => setPage(p)}
                          className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {modalOpen && (dynamicFields || []).length > 0 && (
        <FormModal 
          open={modalOpen} 
          title={selected ? 'Edit Subject' : 'Add Subject'} 
          fields={dynamicFields || []} 
          initialValues={selected || {}} 
          onClose={() => setModalOpen(false)} 
          onSubmit={onSave} 
          loading={saving} 
        />
      )}
    </div>
  );
}
