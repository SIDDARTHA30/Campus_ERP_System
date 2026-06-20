import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

function VerificationPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    const verify = async () => {
      try {
        await api.get(`/auth/verify/${token}`);
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="card w-full max-w-md p-8 text-center">
        {status === 'verifying' && (
          <>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verifying...</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Please wait while we verify your email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Email Verified!</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Your account is now active. You can proceed to login.</p>
            <Link to="/login" className="btn-primary mt-6 block w-full py-3 text-center cursor-pointer">
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Verification Failed</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">The link is invalid or has expired.</p>
            <Link to="/login" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 mt-6 block">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerificationPage;
