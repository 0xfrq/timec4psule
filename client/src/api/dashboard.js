import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000", 
});

export const getDashboardAPI = (token) =>
  API.get("/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });
