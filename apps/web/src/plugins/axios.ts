import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  withCredentials: true,
});

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // TODO: try refresh or redirect to login
    }
    return Promise.reject(error);
  },
);
