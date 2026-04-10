import axios from 'axios';
import toast from 'react-hot-toast';

// Use same-origin proxy in browser so cookies are sent; direct backend URL on server
const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const baseURL =
  typeof window !== 'undefined'
    ? '/api-proxy'
    : (backendBase.endsWith('/api') ? backendBase : `${backendBase}/api`);

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    if (err.response?.data?.error) {
      toast.error(err.response.data.error);
    }
    return Promise.reject(err);
  }
);

export async function downloadPDF(url, filename, params = {}) {
  const response = await api.get(url, { responseType: 'blob', params });
  const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

export default api;
