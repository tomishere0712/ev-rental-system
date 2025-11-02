import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    const user = useAuthStore.getState().user;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        "Request with token - User role:",
        user?.role,
        "Endpoint:",
        config.url
      );
    } else {
      console.log("No token found in authStore - Endpoint:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Chỉ logout và redirect nếu không phải đang ở trang login/register
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
