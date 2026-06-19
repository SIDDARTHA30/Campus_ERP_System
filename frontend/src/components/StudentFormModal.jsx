import { useEffect, useState } from 'react';

const initialFormState = {
  admissionNo: '',
  name: '',
  email: '',
  department: '',
  year: '',
  section: '',
  batch: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  phone: '',
  status: 'active'
};

function StudentFormModal({ open, onClose, onSubmit, initialValues, loading }) {
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (open) {
      setFormData({
        ...initialFormState,
        ...initialValues,
        year: initialValues?.year ? String(initialValues.year) : ''
      });
    }
  }, [open, initialValues]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...formData,
      year: Number(formData.year)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{initialValues ? 'Edit Student' : 'Add Student'}</h3>
            <p className="mt-1 text-sm text-slate-500">Fill the basic student details and save.</p>
          </div>
          <button className="button-secondary px-3 py-2" type="button" onClick={onClose}>Close</button>
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <input className="input" name="admissionNo" placeholder="Admission No" value={formData.admissionNo} onChange={handleChange} required />
          <input className="input" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
          <input className="input" name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input className="input" name="department" placeholder="Department" value={formData.department} onChange={handleChange} required />
          <input className="input" name="year" type="number" min="1" placeholder="Year" value={formData.year} onChange={handleChange} required />
          <input className="input" name="section" placeholder="Section" value={formData.section} onChange={handleChange} required />
          <input className="input" name="batch" placeholder="Batch" value={formData.batch} onChange={handleChange} />
          <input className="input" name="gender" placeholder="Gender" value={formData.gender} onChange={handleChange} />
          <input className="input" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
          <input className="input" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} />
          <input className="input md:col-span-2" name="address" placeholder="Address" value={formData.address} onChange={handleChange} />
          <select className="input" name="status" value={formData.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button className="button-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button-primary" disabled={loading} type="submit">
              {loading ? 'Saving...' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentFormModal;