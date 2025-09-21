import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authService = {
  async register(name: string, email: string, password: string) {
    const params = new URLSearchParams();
    params.append('name', name);
    params.append('username', email);
    params.append('password', password);
    const response = await api.post('/v1/auth/register',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data;
  },
  async login(email: string, password: string) {
    const response = await api.post('/v1/auth/login',
      new URLSearchParams({ username: email, password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    return response.data;
  },
  async getCurrentUser() {
    const response = await api.get('/v1/auth/me');
    return response.data;
  },
  async logout() {
    await api.post('/v1/auth/logout');
    localStorage.removeItem('access_token');
  }
};
