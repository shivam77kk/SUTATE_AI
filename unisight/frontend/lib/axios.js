import axios from 'axios';
import toast from 'react-hot-toast';

// 🚀 DIRECT RENDER CONNECTION (Bypassing Netlify Proxy)
// 🚀 FLEXIBLE CONNECTION: Uses env var on Vercel, fallbacks to Render
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://sutate-ai.onrender.com/api'; 

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
      const errorMsg = err.response.data.error;
      if (!(err.response?.status === 401 && (errorMsg === 'Invalid or expired token' || errorMsg === 'Authentication required' || errorMsg === 'User not found'))) {
        toast.error(errorMsg);
      }
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