import axios from 'axios';
import toast from 'react-hot-toast';

let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Ensure the baseURL ends with /api/v1
if (baseUrl && !baseUrl.endsWith('/api/v1') && !baseUrl.endsWith('/api/v1/')) {
  baseUrl = baseUrl.replace(/\/$/, '') + '/api/v1';
}

const api = axios.create({
  baseURL: baseUrl
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campus_erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.method === 'delete') {
      console.log(`[API] DELETE success: ${response.config.url}. Token still in storage: ${!!localStorage.getItem('campus_erp_token')}`);
    }
    return response;
  },
  (error) => {
    const is401 = error.response?.status === 401;
    const isDelete = error.config?.method === 'delete';
    
    if (is401) {
      const msg = error.response?.data?.message || '';
      console.error(`[API] 401 Unauthorized at ${error.config?.url}. Message: ${msg}`);
      
      // Only logout if it's a genuine session failure, not a data-specific 401
      if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('exist') || !localStorage.getItem('campus_erp_token')) {
        console.warn('[API] Critical auth failure. Logging out...');
        localStorage.removeItem('campus_erp_token');
        localStorage.removeItem('campus_erp_user');
        
        // Use a slight delay or check to avoid logout during active operations
        if (!isDelete) {
          window.location.href = '/login';
        } else {
          toast.error('Session error during delete. Please refresh.');
        }
      }
    } else {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
    return Promise.reject(error);
  }
);

export default api;