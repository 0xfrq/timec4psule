import axios from "axios";

const BASE_URL = "http://localhost:8000"; // ganti sesuai backend kamu

export const generateVideoFromTextAPI = (token, payload) => {
  return axios.post(`${BASE_URL}/ai/video/text`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const uploadVideoAPI = (token, formData) => {
  return axios.post(`${BASE_URL}/ai/video/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};
