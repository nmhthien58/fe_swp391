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
  DownOutlined,
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
    if (path.startsWith("/history/swap")) return "lich-su";
    if (path.startsWith("/history/plans")) return "lich-su";
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
          <div style={{ padding: "8px 0" }}>
            <strong
              style={{ display: "block", fontSize: 15, color: "#262626" }}
            >
              {user?.fullName}
            </strong>
            <span style={{ fontSize: 13, color: "#8c8c8c" }}>
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
            style={{ color: "#ff4d4f", fontWeight: 600 }}
            onClick={handleLogout}
          >
            Đăng xuất
          </span>
        ),
      },
    ],
  };

  const menuItems = !token
    ? [
        { key: "home", label: <NavLink to="/home">Trang chủ</NavLink> },
        {
          key: "tim-tram",
          label: <NavLink to="/stations">Tìm Trạm</NavLink>,
        },
      ]
    : [
        {
          key: "tim-tram",
          label: <NavLink to="/stations">Tìm Trạm & Đặt Lịch</NavLink>,
        },
        {
          key: "plans",
          label: <NavLink to="/plans">Gói đăng ký</NavLink>,
        },
        {
          key: "lich-su",
          label: "Lịch Sử",
          children: [
            {
              key: "lich-su-doi-pin",
              label: <NavLink to="/history/swap">Lịch sử đổi pin</NavLink>,
            },
            {
              key: "lich-su-dang-ky-goi",
              label: <NavLink to="/history/plans">Lịch sử đăng ký gói</NavLink>,
            },
            {
              key: "lich-su-booking",
              label: <NavLink to="/history/booking">Lịch hẹn</NavLink>,
            },
          ],
        },
        {
          key: "ho-tro",
          label: <NavLink to="/support">Hỗ Trợ</NavLink>,
        },
      ];

  const selectedMenuKey = keyByPath(location.pathname);

  return (
    <>
      <Layout style={{ minHeight: "100vh" }}>
        {/* ================= HEADER ================= */}
        <Header
          className="app-header"
          style={{
            backgroundColor: "white",
            padding: "0 50px",
            borderBottom: "1px solid #f0f0f0",
            height: 72,
            display: "flex",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            position: "sticky",
            top: 0,
            zIndex: 999,
            overflow: "hidden",
          }}
        >
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
                transition: "all 0.3s ease",
              }}
            >
              <ThunderboltOutlined
                style={{
                  color: "#fff",
                  fontSize: 22,
                }}
              />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 19,
                letterSpacing: 0.3,
                background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              EV Battery Swap Station
            </span>
          </div>

          {/* Menu Center */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "auto",
              zIndex: 1,
            }}
          >
            <Menu
              mode="horizontal"
              selectedKeys={[selectedMenuKey]}
              disabledOverflow
              style={{
                borderBottom: "none",
                fontWeight: 500,
                fontSize: 15,
              }}
              items={menuItems}
            />
          </div>

          {/* Auth Buttons */}
          <div style={{ marginLeft: "auto" }}>
            {!token ? (
              <Space align="center" size={12}>
                <Button
                  type="primary"
                  size="middle"
                  className="header-btn-login"
                  style={{
                    fontWeight: 600,
                    height: 40,
                    borderRadius: 6,
                    padding: "0 24px",
                    boxShadow: "0 2px 8px rgba(24, 144, 255, 0.3)",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </Button>
                <Button
                  size="middle"
                  className="header-btn-register"
                  style={{
                    fontWeight: 600,
                    height: 40,
                    borderRadius: 6,
                    padding: "0 24px",
                    borderColor: "#1890ff",
                    color: "#1890ff",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => navigate("/register")}
                >
                  Đăng ký
                </Button>
              </Space>
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", height: 72 }}
              >
                {bootstrapping ? (
                  <Spin size="small" />
                ) : (
                  <Dropdown menu={userMenu} trigger={["click"]}>
                    <Button
                      type="text"
                      className="user-dropdown-btn"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 16px",
                        fontWeight: 600,
                        fontSize: 14,
                        color: "#262626",
                        borderRadius: 20,
                        transition: "all 0.3s ease",
                      }}
                    >
                      <Avatar
                        size={36}
                        icon={<UserOutlined />}
                        style={{
                          background:
                            "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                        }}
                      />
                      <span>{user?.fullName}</span>
                      <DownOutlined style={{ fontSize: 10 }} />
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
        <Footer
          style={{ padding: 0, background: "#fafafa", marginTop: "auto" }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "60px 50px 40px",
            }}
          >
            <Row gutter={[48, 32]}>
              {/* Column 1 */}
              <Col xs={24} md={12} lg={10}>
                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ThunderboltOutlined
                        style={{ color: "#fff", fontSize: 18 }}
                      />
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 17,
                        background:
                          "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      EV Battery Swap Station
                    </span>
                  </div>
                  <Text
                    style={{
                      color: "#595959",
                      lineHeight: 1.8,
                      fontSize: 14,
                      display: "block",
                    }}
                  >
                    Nền tảng quản lý trạm đổi pin thông minh, mang đến trải
                    nghiệm nhanh chóng và tiện lợi cho người dùng xe điện.
                  </Text>
                </div>
                <div
                  style={{ color: "#595959", lineHeight: 1.8, fontSize: 14 }}
                >
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <strong style={{ color: "#262626" }}>Địa chỉ:</strong>
                    <span>Số 1 Lưu Hữu Phước, Đông Hoà, Dĩ An, TP. HCM</span>
                  </div>
                </div>
              </Col>

              {/* Column 2 */}
              <Col xs={24} md={8} lg={8}>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#262626",
                    marginBottom: 16,
                    fontSize: 16,
                  }}
                >
                  Về chúng tôi
                </div>
                <Space direction="vertical" size={10} style={{ fontSize: 14 }}>
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

              {/* Column 3 */}
              <Col xs={24} md={8} lg={6}>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#262626",
                    marginBottom: 16,
                    fontSize: 16,
                  }}
                >
                  Liên hệ
                </div>
                <Space direction="vertical" size={10} style={{ fontSize: 14 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <PhoneOutlined style={{ color: "#1890ff" }} />
                    <span style={{ color: "#595959" }}>0968 086 521</span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <MailOutlined style={{ color: "#1890ff" }} />
                    <span style={{ color: "#595959" }}>
                      thiennmhse172145@fpt.edu.vn
                    </span>
                  </div>
                </Space>

                <div
                  style={{
                    fontWeight: 700,
                    color: "#262626",
                    margin: "24px 0 12px",
                    fontSize: 16,
                  }}
                >
                  Mạng xã hội
                </div>
                <Space size={12}>
                  <a
                    href="https://www.facebook.com/nmhthien/"
                    target="_blank"
                    rel="noreferrer"
                    className="social-icon"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#f0f0f0",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <FaFacebook style={{ fontSize: 18, color: "#262626" }} />
                  </a>
                  <a
                    href="#"
                    className="social-icon"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#f0f0f0",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <FaYoutube style={{ fontSize: 18, color: "#262626" }} />
                  </a>
                </Space>
              </Col>
            </Row>
          </div>

          <div
            style={{
              borderTop: "1px solid #f0f0f0",
              background: "#fff",
              textAlign: "center",
              padding: "20px 0",
              fontSize: 13,
              color: "#8c8c8c",
            }}
          >
            © 2025{" "}
            <strong style={{ color: "#262626" }}>
              EV Battery Swap Station
            </strong>
            . All rights reserved.
          </div>
        </Footer>
      </Layout>

      {/* Global Styles */}
      <style>
        {`
          /* Logo hover effect */
          .logo-wrapper:hover {
            transform: translateY(-2px);
          }

          .logo-wrapper:hover > div {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4) !important;
          }

          /* Header buttons */
          .header-btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4) !important;
          }

          .header-btn-register:hover {
            background: #1890ff !important;
            color: #fff !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
          }

          /* User dropdown */
          .user-dropdown-btn:hover {
            background: #f5f5f5 !important;
          }

          /* Footer links */
          .footer-link {
            color: #595959;
            transition: all 0.3s ease;
            display: inline-block;
          }

          .footer-link:hover {
            color: #1890ff;
            transform: translateX(4px);
          }

          /* Social icons */
          .social-icon:hover {
            background: #1890ff !important;
            transform: translateY(-3px);
          }

          .social-icon:hover svg {
            color: #fff !important;
          }

          /* Menu items */
          .ant-menu-horizontal > .ant-menu-item::after,
          .ant-menu-horizontal > .ant-menu-submenu::after {
            border-bottom: 2px solid #1890ff !important;
          }

          .ant-menu-horizontal > .ant-menu-item:hover,
          .ant-menu-horizontal > .ant-menu-submenu:hover {
            color: #1890ff !important;
          }

          /* Smooth scrolling */
          html {
            scroll-behavior: smooth;
          }


            /* FIX: Loại bỏ gạch chân cho menu items không được chọn */
    .ant-menu-horizontal > .ant-menu-item::after,
    .ant-menu-horizontal > .ant-menu-submenu::after {
      border-bottom: 2px solid transparent !important;
      transition: border-color 0.3s ease;
    }

    /* Chỉ hiện gạch chân khi selected hoặc hover */
    .ant-menu-horizontal > .ant-menu-item-selected::after,
    .ant-menu-horizontal > .ant-menu-submenu-selected::after {
      border-bottom: 2px solid #1890ff !important;
    }

    .ant-menu-horizontal > .ant-menu-item:hover::after,
    .ant-menu-horizontal > .ant-menu-submenu:hover::after {
      border-bottom: 2px solid #1890ff !important;
    }

        `}
      </style>
    </>
  );
}

const Text = ({ children, style }) => <span style={style}>{children}</span>;
