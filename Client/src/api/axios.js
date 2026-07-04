import axios from "axios";
import { store } from "../store/store";
import { logoutAction } from "../store/slices/authSlice";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const requestUrl = error.config?.url || "";
            // Do NOT clear cart/session on failed login/register credential attempts
            if (!requestUrl.includes("/auth/login") && !requestUrl.includes("/auth/register")) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                store.dispatch(logoutAction());
            }
        }
        return Promise.reject(error);
    }
);

export default api;