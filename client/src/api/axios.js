import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach JWT from localStorage to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trot_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear the token and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('trot_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);

export default api;
