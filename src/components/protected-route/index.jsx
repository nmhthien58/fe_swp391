// src/components/auth/AuthGate.jsx
import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../config/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  selectToken,
  selectUser,
  selectRole,
  setUser,
  logout,
} from "../../redux/accountSlice";

const FullscreenSpinner = ({ tip = "Đang kiểm tra phiên đăng nhập..." }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
    }}
  >
    <Spin size="large" tip={tip} />
  </div>
);

/**
 * AuthGate:
 * - Kiểm tra có token (Redux) không -> nếu không có, chuyển /login
 * - Nếu có token nhưng chưa có user -> gọi /api/myInfo để lấy hồ sơ + role và lưu Redux
 * - Hỗ trợ prop `allow` = ["ADMIN", "STAFF", ...] để kiểm tra quyền truy cập route
 * - 401 => logout + /login ; 403 hoặc không đủ quyền => /unauthorized
 *
 * Cách dùng:
 *  <AuthGate allow={["ADMIN"]}>
 *    <Dashboard />
 *  </AuthGate>
 *
 *  // Nếu không truyền allow => chỉ cần đăng nhập là vào được
 */
const AuthGate = ({ allow = [], children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const token = useSelector(selectToken);
  const user = useSelector(selectUser);
  const role = useSelector(selectRole);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      // 1) Chưa đăng nhập -> về login
      if (!token) {
        navigate("/login", { replace: true, state: { from: location } });
        return;
      }

      // 2) Đã có token và user trong Redux -> khỏi gọi API
      if (user && role) {
        setChecking(false);
        return;
      }

      // 3) Lấy hồ sơ từ backend
      setChecking(true);
      try {
        const me = await api.get("/api/myInfo");
        if (cancelled) return;
        const profile = me?.data?.result || me?.data;

        // Đồng bộ vào Redux (accountSlice.setUser cần map role từ roles[0].userType)
        dispatch(setUser(profile));
      } catch (err) {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 401) {
          // token hết hạn/không hợp lệ
          dispatch(logout());
          navigate("/login", { replace: true, state: { from: location } });
          return;
        }
        // Lỗi khác thì cho về trang lỗi/unauthorized tuỳ ý
        navigate("/unauthorized", { replace: true });
        return;
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // khi token đổi, re-check

  // Đang kiểm tra
  if (checking) return <FullscreenSpinner />;

  // Đến đây: đã có token; nếu allow có giá trị thì kiểm tra quyền
  const isAllowed = allow.length === 0 ? true : allow.includes(role);

  if (!isAllowed) {
    // Đã đăng nhập nhưng thiếu quyền
    // Hoặc điều hướng cứng (nếu bạn muốn):
    navigate("/", { replace: true });
  }

  return <>{children}</>;
};

export default AuthGate;
