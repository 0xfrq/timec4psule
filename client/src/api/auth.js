import api from "./client";

export const registerAPI = (payload) => api.post("/api/register/", payload);
export const loginAPI = (payload) => api.post("/api/login/", payload);
export const logoutAPI = () => api.post("/api/logout/");
export const myProfileAPI = () => api.get("/api/profile/");
export const profileByUsernameAPI = (username) => api.get(`/api/profiles/${username}/`);