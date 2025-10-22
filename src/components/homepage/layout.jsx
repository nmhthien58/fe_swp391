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
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { PhoneOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
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

  // Nếu đã có token mà chưa có user -> gọi /api/myInfo để lấy tên/role (chống F5 bị trống)
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
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        // 401/403 đã được interceptor xử lý
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user, dispatch]);

  const keyByPath = (path) => {
    if (path.startsWith("/stations")) return "tim-tram";
    if (path.startsWith("/history")) return "lich-su";
    if (path.startsWith("/support")) return "ho-tro";
    if (path.startsWith("/account")) return "tai-khoan";
    return "trang-chu";
  };

  const handleLogout = async () => {
    try {
      // Xóa dữ liệu trong Redux (accountSlice)
      dispatch(logout());

      // Xóa toàn bộ cache redux-persist trong localStorage
      await persistor.purge();

      // Chuyển hướng về trang chủ
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };
  const userNameToShow = user?.fullName;

  const userMenu = {
    items: [
      {
        key: "profile-head",
        disabled: true,
        label: (
          <div>
            <strong style={{ display: "block" }}>{userNameToShow}</strong>
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

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      {/* HEADER */}
      <Header
        className="site-header"
        style={{
          backgroundColor: "white",
          padding: "0 50px",
          borderBottom: "1px solid #f0f0f0",
          height: 64, // chuẩn AntD
        }}
      >
        <Row justify="space-between" align="middle" style={{ height: 64 }}>
          {/* Trái: quick nav (test) */}
          {/* <Col>
            <Space>
              <Button type="default">
                <NavLink to="/dashboard">Admin Page</NavLink>
              </Button>
              <Button type="default">
                <NavLink to="/staff">Staff Page</NavLink>
              </Button>
            </Space>
          </Col> */}

          {/* Giữa: menu */}
          <Col
            flex="auto"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Menu
              mode="horizontal"
              selectedKeys={[keyByPath(location.pathname)]}
              style={{ borderBottom: "none", height: 64, lineHeight: "64px" }}
              items={[
                {
                  key: "trang-chu",
                  label: <NavLink to="/">Trang chủ</NavLink>,
                },
                {
                  key: "tim-tram",
                  label: <NavLink to="/stations">Tìm Trạm</NavLink>,
                },
                {
                  key: "plans",
                  label: <NavLink to="/plans">Gói đăng ký</NavLink>,
                },
                {
                  key: "lich-su",
                  label: <NavLink to="/history">Lịch Sử</NavLink>,
                },
                {
                  key: "ho-tro",
                  label: <NavLink to="/support">Hỗ Trợ</NavLink>,
                },
                {
                  key: "tai-khoan",
                  label: <NavLink to="/account">Tài Khoản</NavLink>,
                },
              ]}
            />
          </Col>

          {/* Phải: auth area */}
          <Col>
            {!token ? (
              <Space align="center">
                <Button type="primary" onClick={() => navigate("/login")}>
                  Đăng nhập
                </Button>
                <Button onClick={() => navigate("/register")}>Đăng ký</Button>
              </Space>
            ) : (
              <div
                style={{ height: 64, display: "flex", alignItems: "center" }}
              >
                {bootstrapping ? (
                  <Spin size="small" />
                ) : (
                  <Dropdown
                    menu={userMenu}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <Button
                      type="text"
                      style={{
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0 12px",
                        fontWeight: 500,
                        color: "#1677ff",
                      }}
                    >
                      <Avatar
                        size={28}
                        icon={<UserOutlined />}
                        style={{
                          backgroundColor: "#1677ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />
                      <span style={{ lineHeight: 1 }}>{userNameToShow}</span>
                    </Button>
                  </Dropdown>
                )}
              </div>
            )}
          </Col>
        </Row>
      </Header>

      {/* BODY */}
      <Content style={{ padding: "24px 50px" }}>
        <Outlet />
      </Content>

      {/* FOOTER */}
      <Footer style={{ padding: 0, background: "#f5f7f8" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          <Row gutter={[32, 24]}>
            {/* Cột 1 */}
            <Col xs={24} md={12} lg={10}>
              <div style={{ color: "#4b5563", lineHeight: 1.7, fontSize: 13 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#1f2937",
                    marginBottom: 10,
                  }}
                >
                  EV Battery Swap Station Management System
                </div>
                <div>
                  <b>Địa chỉ trụ sở chính:</b> Số 1 Lưu Hữu Phước, Đông Hoà, Dĩ
                  An, Thành phố Hồ Chí Minh.
                </div>
              </div>
            </Col>

            {/* Cột 2 */}
            <Col xs={24} md={8} lg={8}>
              <Row gutter={[16, 12]}>
                <Col span={24}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#111827",
                      marginBottom: 10,
                    }}
                  >
                    Về chúng tôi
                  </div>
                  <Space direction="vertical" size={6} style={{ fontSize: 13 }}>
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
                      Điều khoản chính sách
                    </a>
                  </Space>
                </Col>
              </Row>
            </Col>

            {/* Cột 3 */}
            <Col xs={24} md={8} lg={6}>
              <div
                style={{ fontWeight: 600, color: "#111827", marginBottom: 10 }}
              >
                HOTLINE
              </div>
              <Space direction="vertical" size={6} style={{ fontSize: 13 }}>
                <span>
                  <PhoneOutlined /> &nbsp;0968086521
                </span>
                <span>
                  <MailOutlined /> &nbsp;thiennmhse172145@fpt.edu.vn
                </span>
              </Space>

              <div
                style={{
                  fontWeight: 600,
                  color: "#111827",
                  margin: "16px 0 8px",
                }}
              >
                LIÊN HỆ
              </div>
              <Space size={12}>
                <a
                  href="https://www.facebook.com/nmhthien/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="footer-link"
                >
                  <FaFacebook
                    className="social-icon"
                    style={{ fontSize: 18 }}
                  />
                </a>
                <a href="#" aria-label="YouTube">
                  <FaYoutube className="social-icon" style={{ fontSize: 18 }} />
                </a>
              </Space>
            </Col>
          </Row>
        </div>

        <div style={{ borderTop: "1px solid #e5e7eb", background: "#f5f7f8" }}>
          <div
            style={{
              width: "100%",
              padding: "10px 24px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: 13,
            }}
          >
            <span style={{ color: "#111827" }}>
              © 2025 EV Battery Swap Station Management System. All rights
              reserved.
            </span>
          </div>
        </div>
      </Footer>
    </Layout>
  );
}
