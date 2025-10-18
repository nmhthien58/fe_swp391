import React from "react";
import { Layout, Row, Col, Space, Menu, Typography, Button } from "antd";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  PhoneOutlined,
  MailOutlined,
  FacebookFilled,
  YoutubeFilled,
  FacebookOutlined,
} from "@ant-design/icons";
import { FaFacebook, FaYoutube } from "react-icons/fa";

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const Homepage = () => {
  const location = useLocation();

  // map path -> key menu
  const keyByPath = (path) => {
    if (path.startsWith("/stations")) return "tim-tram";
    if (path.startsWith("/history")) return "lich-su";
    if (path.startsWith("/support")) return "ho-tro";
    if (path.startsWith("/account")) return "tai-khoan";
    return "trang-chu";
  };

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <Header
        style={{
          backgroundColor: "white",
          padding: "0 50px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              {/* Nút tạm test */}
              <Button type="default">
                <NavLink to="/dashboard">Admin Page</NavLink>
              </Button>
              <Button type="default">
                <NavLink to="/staff">Staff Page</NavLink>
              </Button>
            </Space>
          </Col>

          <Col>
            <Menu
              mode="horizontal"
              selectedKeys={[keyByPath(location.pathname)]}
              style={{ borderBottom: "none" }}
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

          <Col>
            <Space align="center">
              <Button type="primary">
                <NavLink to="/login">Login</NavLink>
              </Button>
              <Button>
                <NavLink to="/register">Register</NavLink>
              </Button>
            </Space>
          </Col>
        </Row>
      </Header>

      {/* PHẦN THÂN THAY ĐỔI BỞI CÁC ROUTE CON */}
      <Content style={{ padding: "24px 50px" }}>
        <Outlet />
      </Content>

      <Footer style={{ padding: 0, background: "#f5f7f8" }}>
        {/* khối nội dung chính */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          <Row gutter={[32, 24]}>
            {/* Cột 1: Logo + thông tin công ty */}
            <Col xs={24} md={12} lg={10}>
              <Space align="start" size={16} style={{ marginBottom: 12 }}>
                {/* <img
                  src=""
                  alt="Logo"
                  style={{ height: 28, objectFit: "contain" }}
                /> */}
              </Space>
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

            {/* Cột 2: Nhóm liên kết */}
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

            {/* Cột 3: Hotline + liên hệ */}
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

        {/* dải dưới cùng */}
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            background: "#f5f7f8",
          }}
        >
          <div
            style={{
              width: "100%", // chiếm toàn chiều ngang
              padding: "10px 24px",
              textAlign: "center", // căn giữa dòng chữ
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
};

export default Homepage;
