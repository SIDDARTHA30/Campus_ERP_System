import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';

function ResetPasswordPage() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { newPassword });
      toast.success('Password reset successfully. You can now login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-slate-900">Set New Password</h2>
        <p className="mt-2 text-slate-500">Choose a strong password for your account.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">New Password</label>
            <input
              type="password"
              className="input mt-1 w-full"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Confirm Password</label>
            <input
              type="password"
              className="input mt-1 w-full"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button disabled={loading} className="btn-primary w-full py-3 cursor-pointer" type="submit">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
