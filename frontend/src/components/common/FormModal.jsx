import { useEffect, useState } from 'react';

function FormModal({ open, title, fields = [], initialValues = {}, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (open) {
      setForm({ ...initialValues });
    }
  }, [open, initialValues]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedForm = { ...form };
    Object.keys(cleanedForm).forEach(key => {
      const val = cleanedForm[key];
      if (val && typeof val === 'object' && val !== null) {
        cleanedForm[key] = val._id || val.id || val;
      }
    });
    onSubmit(cleanedForm);
  };

  const isEdit = initialValues?._id || initialValues?.id;
  const safeFields = fields || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl dark:shadow-black/50 border border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title || 'Form'}</h3>
          </div>
          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          {!safeFields || safeFields.length === 0 ? (
            <div className="md:col-span-2 space-y-6 py-4">
              <div className="grid grid-cols-2 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-20 skeleton opacity-50" />
                    <div className="h-12 w-full skeleton" />
                  </div>
                ))}
              </div>
              <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse pt-4">
                Preparing form fields...
              </p>
            </div>
          ) : (
            safeFields.map((f, idx) => {
              if (!f) return null;
              
              if (f.type === 'select') {
                const selectValue = form[f.name] && typeof form[f.name] === 'object'
                  ? (form[f.name]._id || form[f.name].id)
                  : (form[f.name] ?? '');

                return (
                  <div key={f.name || idx} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{f.label || 'Select'}</label>
                    <select 
                      name={f.name} 
                      value={selectValue} 
                      onChange={handleChange} 
                      className="input"
                      disabled={f.disabled || (isEdit && f.disabledOnEdit)}
                    >
                      <option value="">Select {f.label || 'Option'}</option>
                      {(f.options || []).map((opt, i) => (
                        <option key={opt?.value ?? opt ?? i} value={opt?.value ?? opt}>{opt?.label ?? opt}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              const inputValue = form[f.name] && typeof form[f.name] === 'object'
                ? (form[f.name].name || form[f.name].title || form[f.name].code || form[f.name]._id || form[f.name].id || '')
                : (form[f.name] ?? '');

              return (
                <div key={f.name || idx} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                    {isEdit && f.name === 'student' ? 'Student Name' : (f.label || 'Field')}
                  </label>
                  <input
                    name={f.name}
                    type={f.type || 'text'}
                    placeholder={`Enter ${f.label?.toLowerCase() || 'value'}...`}
                    value={inputValue}
                    onChange={handleChange}
                    className="input disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-500 disabled:border-slate-200 dark:disabled:border-slate-800"
                    required={f.required}
                    disabled={f.disabled || (isEdit && (f.name === 'student' || f.name === 'subject' || f.disabledOnEdit))}
                  />
                </div>
              );
            })
          )}

          <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-50 dark:border-slate-800">
            <button className="btn-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={loading} type="submit">
              {loading ? 'Processing...' : (isEdit ? 'Update Record' : 'Create Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormModal;
