import axios from "axios";

const api = axios.create({
  baseURL: "https://interviewiq-backend-rd38.onrender.com",
  withCredentials: true
});

export default api;
