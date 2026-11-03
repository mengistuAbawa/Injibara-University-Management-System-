import axios from 'axios';

const configuredApiBase = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://injibara-university-management-system-ig8x.onrender.com'
    : 'http://localhost:5000');
const normalizedApiBase = configuredApiBase.replace(/\/+$/, '');

const api = axios.create({
  baseURL: /\/api$/i.test(normalizedApiBase) ? normalizedApiBase : `${normalizedApiBase}/api`,
  timeout: 90000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!error.response && config && config._apiRetryCount !== 1) {
      config._apiRetryCount = 1;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return api(config);
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
