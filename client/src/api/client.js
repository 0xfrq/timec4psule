import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://192.168.1.131:8000",
  // kalau Django kamu pakai session login (cookie), aktifkan ini:
  // withCredentials: true,
});

// Kalau API kamu pakai token (JWT / Token) simpan di localStorage:
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`; // atau `Token ${token}` sesuai backend kamu
  return config;
});

export default api;
