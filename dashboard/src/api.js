import axios from "axios";

//1. Central Axios Instance
const API = axios.create({
    baseURL:"http://localhost:5000",
});

//2. Request Intercepter: with each api call we will add a token in header
API.interceptors.request.use((req) =>{
    const token = localStorage.getItem("token");
    if(token){
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

//3. Response Interceptor: if 401 Unauthorized  means token expired
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if(error.response && error.response.status === 401){
            console.warn("Session expired or unauthorized! Redirecting to login...");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "http://localhost:5173/signup";
        }
        return Promise.reject(error);
    }
);

export default API;