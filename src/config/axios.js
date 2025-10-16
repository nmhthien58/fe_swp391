import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: "https://ev-battery-swap-station-m-ngement-system.onrender.com/",
});

// Các URL public (không cần token & không xử lý lỗi 401)
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
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // 🔹 BỎ QUA toast 401 nếu API nằm trong publicUrls
    if (status === 401 && !publicUrls.some((pub) => url.includes(pub))) {
      console.warn("Token hết hạn hoặc không hợp lệ. Đăng xuất...");
      localStorage.removeItem("token");
      toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
      // window.location.href = "/login"; // tuỳ chọn redirect
    }

    return Promise.reject(error);
  }
);

export default api;
