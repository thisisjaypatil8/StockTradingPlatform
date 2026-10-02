import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const wwwURL = import.meta.env.VITE_WWW_URL || "http://localhost:5173";

// 1. Central Axios Instance
const API = axios.create({
    baseURL,
});

// 2. Request Interceptor: with each api call we attach token in header
API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

// 3. Response Interceptor: auto-redirect on 401 Unauthorized
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or unauthorized! Redirecting to login...");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = `${wwwURL}/signup`;
        }
        return Promise.reject(error);
    }
);

export default API;
