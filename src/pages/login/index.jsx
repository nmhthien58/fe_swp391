import React, { useState } from "react";
import { Form, Input, Button, Card, Divider, Row, Col, Spin } from "antd";
import {
  LockOutlined,
  UserOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import api from "../../config/axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials, setUser } from "../../redux/accountSlice";

const LoginPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", {
        userName: values.userName,
        password: values.password,
      });
      const token = response?.data?.result?.token;
      const refreshToken = response?.data?.result?.refreshToken;
      if (!token) {
        toast.error("Không nhận được token từ server!");
        return;
      }

      localStorage.setItem("token", token);
      dispatch(setCredentials({ token, refreshToken }));

      const me = await api.get("/api/myInfo");
      const profile = me?.data?.result;
      dispatch(setUser(profile));

      const role = profile?.roles?.[0]?.userType;
      if (role === "ADMIN") {
        navigate("/dashboard");
      } else if (role === "STAFF") {
        navigate("/staff");
      } else {
        navigate("/");
      }

      toast.success("Đăng nhập thành công!");
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.status === 401) {
        toast.error("Sai tài khoản hoặc mật khẩu!");
      } else {
        toast.error("Đăng nhập thất bại. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 280px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
      }}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Spin size="large" />
            <div
              style={{
                marginTop: 16,
                fontSize: 16,
                color: "#1890ff",
                fontWeight: 500,
              }}
            >
              Đang đăng nhập...
            </div>
          </div>
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 480 }}>
        <Card
          style={{
            borderRadius: 20,
            boxShadow: "0 8px 32px rgba(24, 144, 255, 0.12)",
            border: "1px solid rgba(24, 144, 255, 0.08)",
          }}
          bodyStyle={{ padding: "48px 40px" }}
        >
          {/* Logo & Title */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: "0 auto 20px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(24, 144, 255, 0.3)",
              }}
            >
              <ThunderboltOutlined style={{ color: "#fff", fontSize: 32 }} />
            </div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                margin: "0 0 8px 0",
                background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Đăng nhập
            </h2>
            <p style={{ color: "#8c8c8c", fontSize: 15, margin: 0 }}>
              Chào mừng bạn trở lại với EV Battery Swap Station
            </p>
          </div>

          {/* Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item
              label={<span style={{ fontWeight: 500 }}>Tài khoản</span>}
              name="userName"
              rules={[{ required: true, message: "Vui lòng nhập tài khoản!" }]}
            >
              <Input
                placeholder="Nhập tên tài khoản"
                prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                size="large"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500 }}>Mật khẩu</span>}
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                { min: 4, message: "Mật khẩu phải có ít nhất 4 ký tự" },
              ]}
            >
              <Input.Password
                placeholder="Nhập mật khẩu"
                prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                size="large"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Row
              justify="space-between"
              align="middle"
              style={{ marginBottom: 24 }}
            >
              <Col>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{
                    color: "#1890ff",
                    fontSize: 14,
                    fontWeight: 500,
                    transition: "all 0.3s ease",
                  }}
                  className="forgot-password-link"
                >
                  Quên mật khẩu?
                </a>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                className="login-submit-btn"
                style={{
                  height: 48,
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 16,
                  boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
                  transition: "all 0.3s ease",
                }}
              >
                Đăng nhập
              </Button>
            </Form.Item>

            <Divider style={{ margin: "24px 0", borderColor: "#f0f0f0" }} />

            <div
              style={{ textAlign: "center", fontSize: 14, color: "#595959" }}
            >
              Chưa có tài khoản?{" "}
              <a
                href="/register"
                style={{
                  color: "#1890ff",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
                className="register-link"
              >
                Đăng ký ngay
              </a>
            </div>
          </Form>
        </Card>

        {/* Additional Info */}
        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            color: "#8c8c8c",
            fontSize: 13,
          }}
        >
          <p style={{ margin: 0 }}>
            Bằng việc đăng nhập, bạn đồng ý với{" "}
            <a href="#" style={{ color: "#1890ff" }}>
              Điều khoản sử dụng
            </a>{" "}
            và{" "}
            <a href="#" style={{ color: "#1890ff" }}>
              Chính sách bảo mật
            </a>
          </p>
        </div>
      </div>

      {/* CSS for hover effects */}
      <style>
        {`
          .login-submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4) !important;
          }

          .forgot-password-link:hover {
            color: #096dd9 !important;
          }

          .register-link:hover {
            color: #096dd9 !important;
          }
        `}
      </style>
    </div>
  );
};

export default LoginPage;
