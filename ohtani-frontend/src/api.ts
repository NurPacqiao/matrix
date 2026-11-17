import axios from "axios";

// Set VITE_API_URL in .env.local when the API is not on this machine (e.g. testing on an iPhone)
export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5255/api";
export const AUTH_EXPIRED_EVENT = "auth:expired";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// An expired or invalid token sends the user back to the sign-in screen
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem("jwt");
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default api;
