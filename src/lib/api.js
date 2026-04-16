import axios from "axios";

export const API_BASE = "http://127.0.0.1:8000";
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
