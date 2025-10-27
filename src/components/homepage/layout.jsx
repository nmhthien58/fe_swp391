// src/layouts/Layout.jsx
import React, { useEffect, useState } from "react";
import {
  Layout,
  Row,
  Col,
  Space,
  Menu,
  Button,
  Dropdown,
  Spin,
  Avatar,
} from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FaFacebook, FaYoutube } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  selectToken,
  selectUser,
  setUser,
  logout,
} from "../../redux/accountSlice";
import api from "../../config/axios";
import { persistor } from "../../redux/store";

const { Header, Content, Footer } = Layout;

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);
  const [bootstrapping, setBootstrapping] = useState(false);

  // Fetch user info when token available
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token || user) return;
      setBootstrapping(true);
      try {
        const me = await api.get("/api/myInfo");
        if (!cancelled) {
          dispatch(setUser(me?.data?.result || me?.data));
        }
      } catch {
        /* empty */
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => (cancelled = true);
  }, [token, user, dispatch]);

  const keyByPath = (path) => {
    if (path.startsWith("/stations")) return "tim-tram";
    if (path.startsWith("/history")) return "lich-su";
    if (path.startsWith("/support")) return "ho-tro";
    if (path.startsWith("/account")) return "tai-khoan";
    if (path.startsWith("/plans")) return "plans";
    if (path.startsWith("/home")) return "home";
    return "trang-chu";
  };

  const handleLogout = async () => {
    try {
      dispatch(logout());
      await persistor.purge();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const userMenu = {
    items: [
      {
        key: "profile-head",
        disabled: true,
        label: (
          <div>
            <strong style={{ display: "block", fontSize: 14 }}>
              {user?.fullName}
            </strong>
            <span style={{ fontSize: 12, color: "#999" }}>
              {(user?.roles && user?.roles[0]?.userType) || "USER"}
            </span>
          </div>
        ),
      },
      { type: "divider" },
      {
        key: "account",
        label: <NavLink to="/account">Quản lý tài khoản</NavLink>,
      },
      {
        key: "logout",
        label: (
          <span
            style={{ color: "red", fontWeight: 600 }}
            onClick={handleLogout}
          >
            Đăng xuất
          </span>
        ),
      },
    ],
  };

  // === Menu hiển thị theo token ===
  const menuItems = !token
    ? [{ key: "home", label: <NavLink to="/home">Trang chủ</NavLink> }]
    : [
        { key: "tim-tram", label: <NavLink to="/stations">Tìm Trạm</NavLink> },
        { key: "plans", label: <NavLink to="/plans">Gói đăng ký</NavLink> },
        { key: "lich-su", label: <NavLink to="/history">Lịch Sử</NavLink> },
        { key: "ho-tro", label: <NavLink to="/support">Hỗ Trợ</NavLink> },
      ];

  const selectedMenuKey = !token ? "home" : keyByPath(location.pathname);

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      {/* ================= HEADER ================= */}
      <Header
        style={{
          backgroundColor: "white",
          padding: "0 50px",
          borderBottom: "1px solid #e5e7eb",
          height: 72,
          display: "flex",
          alignItems: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          position: "relative", // 👈 quan trọng để menu absolute bám theo
          overflow: "hidden",
        }}
      >
        {/* Trái: Logo */}
        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <ThunderboltOutlined
            style={{
              color: "#186381ff",
              fontSize: 26,
              transform: "translateY(-1px)",
            }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: 0.2,
              color: "#186381ff",
            }}
          >
            EV Battery Swap Station
          </span>
        </div>

        {/* Giữa: Menu — CENTER ABSOLUTE */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)", // căn giữa thật sự
            pointerEvents: "auto",
            zIndex: 1,
          }}
        >
          <Menu
            mode="horizontal"
            selectedKeys={[selectedMenuKey]}
            disabledOverflow
            style={{
              borderBottom: "none", // bỏ border mặc định
              fontWeight: 600,
              fontSize: 16,
            }}
            items={menuItems}
          />
        </div>

        {/* Phải: Auth (đẩy về phải bằng margin-left:auto) */}
        <div style={{ marginLeft: "auto" }}>
          {!token ? (
            <Space align="center">
              <Button
                type="primary"
                size="middle"
                style={{ fontWeight: 500 }}
                onClick={() => navigate("/login")}
              >
                Đăng nhập
              </Button>
              <Button
                size="middle"
                style={{ fontWeight: 500 }}
                onClick={() => navigate("/register")}
              >
                Đăng ký
              </Button>
            </Space>
          ) : (
            <div style={{ display: "flex", alignItems: "center", height: 72 }}>
              {bootstrapping ? (
                <Spin size="small" />
              ) : (
                <Dropdown menu={userMenu} trigger={["click"]}>
                  <Button
                    type="text"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0 12px",
                      fontWeight: 600,
                      fontSize: 15,
                      color: "#1677ff",
                    }}
                  >
                    <Avatar
                      size={32}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#1677ff" }}
                    />
                    <span>{user?.fullName}</span>
                  </Button>
                </Dropdown>
              )}
            </div>
          )}
        </div>
      </Header>

      {/* ================= BODY ================= */}
      <Content style={{ padding: "24px 50px" }}>
        <Outlet />
      </Content>

      {/* ================= FOOTER ================= */}
      <Footer style={{ padding: 0, background: "#f9fafb" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
          <Row gutter={[32, 24]}>
            {/* --- Cột 1 --- */}
            <Col xs={24} md={12} lg={10}>
              <div style={{ color: "#374151", lineHeight: 1.7, fontSize: 15 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: 12,
                    fontSize: 16,
                  }}
                >
                  EV Battery Swap Station Management System
                </div>
                <div>
                  <b>Địa chỉ:</b> Số 1 Lưu Hữu Phước, Đông Hoà, Dĩ An, TP. Hồ
                  Chí Minh
                </div>
              </div>
            </Col>

            {/* --- Cột 2 --- */}
            <Col xs={24} md={8} lg={8}>
              <div
                style={{
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 12,
                  fontSize: 16,
                }}
              >
                Về chúng tôi
              </div>
              <Space direction="vertical" size={8} style={{ fontSize: 14 }}>
                <a href="#" className="footer-link">
                  Giới thiệu
                </a>
                <a href="#" className="footer-link">
                  Cách thức hoạt động
                </a>
                <a href="#" className="footer-link">
                  Tuyển dụng
                </a>
                <a href="#" className="footer-link">
                  Điều khoản & Chính sách
                </a>
              </Space>
            </Col>

            {/* --- Cột 3 --- */}
            <Col xs={24} md={8} lg={6}>
              <div
                style={{
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 12,
                  fontSize: 16,
                }}
              >
                Liên hệ
              </div>
              <Space direction="vertical" size={6} style={{ fontSize: 14 }}>
                <span>
                  <PhoneOutlined /> 0968 086 521
                </span>
                <span>
                  <MailOutlined /> thiennmhse172145@fpt.edu.vn
                </span>
              </Space>

              <div
                style={{
                  fontWeight: 700,
                  color: "#111827",
                  margin: "20px 0 8px",
                  fontSize: 16,
                }}
              >
                Mạng xã hội
              </div>
              <Space size={16}>
                <a
                  href="https://www.facebook.com/nmhthien/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaFacebook style={{ fontSize: 20, color: "black" }} />
                </a>
                <a href="#">
                  <FaYoutube style={{ fontSize: 22, color: "black" }} />
                </a>
              </Space>
            </Col>
          </Row>
        </div>

        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            background: "#f9fafb",
            textAlign: "center",
            padding: "14px 0",
            fontSize: 13.5,
            color: "#6b7280",
          }}
        >
          © 2025 <b style={{ color: "#111827" }}>EV Battery Swap Station</b>.
          All rights reserved.
        </div>
      </Footer>
    </Layout>
  );
}
