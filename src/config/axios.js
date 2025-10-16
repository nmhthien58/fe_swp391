import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: "https://ev-battery-swap-station-m-ngement-system.onrender.com/",
});

// Các URL public (không cần token)
const publicUrls = ["/auth/login", "/auth/register"];

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")?.replaceAll('"', "");

    // Bỏ qua token cho các URL công khai
    if (token && !publicUrls.some((url) => config.url.includes(url))) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu server trả về 401 (Unauthorized)
    if (error?.response?.status === 401) {
      console.warn("Token hết hạn hoặc không hợp lệ. Đăng xuất...");

      // Xóa token khỏi localStorage
      localStorage.removeItem("token");

      // Tùy tình huống bạn có thể điều hướng:
      // Cách 1: redirect thẳng về login
      // window.location.href = "/login";

      // Cách 2 (nếu bạn dùng toast):
      toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
    }

    return Promise.reject(error);
  }
);

export default api;
