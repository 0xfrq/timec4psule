import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000", // ✅ ganti sesuai backend kamu
});

export const createProfileAPI = (token, formData) =>
  API.post("/profile", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

export const getMyProfileAPI = (token) =>
  API.get("/profile/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
