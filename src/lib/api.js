import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const AUTH_TOKEN_KEY = "rag_auth_token";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
