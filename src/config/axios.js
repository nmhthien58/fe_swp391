// src/config/axios.js
import axios from "axios";
import { toast } from "react-toastify";
import { logout } from "../redux/accountSlice"; // ĐƯỜNG DẪN slice của bạn

let reduxStore = null;
// Gọi injectStore(store) một lần ở bootstrap để axios truy cập Redux
export const injectStore = (store) => {
  reduxStore = store;
};

const api = axios.create({
  baseURL: "https://ev-battery-swap-station-m-ngement-system.onrender.com/",
});

// Các URL công khai (không cần token & không hiển thị toast 401)
const PUBLIC_URLS = ["/login", "/auth/register"];

const isPublicUrl = (url = "") => PUBLIC_URLS.some((p) => url.includes(p));

// ===== Request interceptor =====
api.interceptors.request.use(
  (config) => {
    const token = reduxStore?.getState()?.account?.token;
    // Chỉ gắn Authorization nếu có token & không phải public URL
    if (token && !isPublicUrl(config.url || "")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Response interceptor =====
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu request đã bị huỷ (AbortController / cancel), bỏ qua
    if (axios.isCancel(error) || error?.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const currentPath = window.location?.pathname || "";

    // 401: token hết hạn / không hợp lệ
    if (status === 401 && !isPublicUrl(url)) {
      // Xoá trạng thái đăng nhập trong Redux
      reduxStore?.dispatch(logout());
      if (currentPath !== "/stations") {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
    }

    // 403: đã đăng nhập nhưng thiếu quyền
    if (status === 403) {
      // Tuỳ chọn: điều hướng đến trang không đủ quyền
      // window.location.assign("/unauthorized");
      toast.error("Bạn không có quyền thực hiện thao tác này.");
    }

    return Promise.reject(error);
  }
);

export default api;
