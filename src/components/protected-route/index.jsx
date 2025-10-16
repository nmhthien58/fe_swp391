// src/components/auth/AuthGate.jsx
import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../../config/axios";

const FullscreenSpinner = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
    }}
  >
    <Spin size="large" tip="Đang kiểm tra phiên đăng nhập..." />
  </div>
);

/**
 * AuthGate sẽ:
 * - Gọi API backend để xác thực token (vd: /auth/me hoặc /auth/validate)
 * - Nếu 200 -> render children
 * - Nếu 401 -> redirect /login (không render children, tránh flash)
 */
const AuthGate = ({ children }) => {
  const [status, setStatus] = useState("checking"); // 'checking' | 'ok' | 'fail'
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const token = localStorage.getItem("token")?.replaceAll('"', "");
      if (!token) {
        // Chưa đăng nhập -> tới login ngay
        navigate(`/login`, { replace: true });
        return;
      }

      try {
        // Gọi endpoint validate session (đổi path cho đúng backend của bạn)
        // Ưu tiên dùng 1 trong các endpoint sau tùy server:
        // - /auth/me
        // - /api/auth/me
        // - /auth/validate
        // eslint-disable-next-line no-unused-vars
        const res = await api.get("/api/getDrivers");
        if (!cancelled) setStatus("ok");
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        if (cancelled) return;
        // Nếu 401 (unauthenticated) -> về login
        navigate(`/login`, { replace: true });
      }
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "checking") return <FullscreenSpinner />;
  if (status === "ok") return <>{children}</>;
  // Trạng thái 'fail' hầu như không tới vì đã navigate, nhưng giữ cho chắc
  return null;
};

export default AuthGate;
