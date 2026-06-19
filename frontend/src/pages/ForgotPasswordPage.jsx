import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('If an account exists with that email, a reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
        <p className="mt-2 text-slate-500">Enter your email to receive a password reset link.</p>

        {message ? (
          <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                className="input mt-1 w-full"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button disabled={loading} className="button-primary w-full py-3" type="submit">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
