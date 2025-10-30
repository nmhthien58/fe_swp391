import React, { useState } from "react";
import {
  Form,
  Input,
  Checkbox,
  Button,
  Card,
  Row,
  Col,
  message,
  Spin,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) =>
    /^(?!.*\.\.)([^\s@]+@[^\s@]+\.[^\s@]{2,4})$/.test(email);

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const { userName, fullName, email, password } = values;

      const payload = {
        userName: userName?.trim(),
        password,
        email: email?.trim(),
        fullName: fullName?.trim(),
        status: true,
      };

      const { data } = await api.post("/api/register", payload);

      if (data?.code === 1010) {
        message.success("Đăng ký thành công!");
        toast.success("Đăng ký thành công!");
        form.resetFields();
        navigate("/login");
      } else {
        message.error(data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Đăng ký thất bại. Vui lòng thử lại.";
      message.error(msg);
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
              Đang tạo tài khoản...
            </div>
          </div>
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 600 }}>
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
              Tạo tài khoản
            </h2>
            <p style={{ color: "#8c8c8c", fontSize: 15, margin: 0 }}>
              Tham gia cùng EV Battery Swap Station ngay hôm nay
            </p>
          </div>

          {/* Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ agree: false }}
            requiredMark={false}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Họ và tên</span>}
                  name="fullName"
                  rules={[
                    { required: true, message: "Vui lòng nhập họ và tên!" },
                    {
                      validator: (_, v) =>
                        v && v.trim()
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Họ và tên không thể để trống")
                            ),
                    },
                  ]}
                >
                  <Input
                    placeholder="Nguyễn Văn A"
                    prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                    size="large"
                    style={{ borderRadius: 10 }}
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Tên tài khoản</span>}
                  name="userName"
                  rules={[
                    { required: true, message: "Vui lòng nhập tài khoản!" },
                  ]}
                >
                  <Input
                    placeholder="Tên đăng nhập"
                    prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                    size="large"
                    style={{ borderRadius: 10 }}
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Email</span>}
                  name="email"
                  rules={[
                    { required: true, message: "Vui lòng nhập email!" },
                    {
                      validator: (_, v) =>
                        !v || validateEmail(v)
                          ? Promise.resolve()
                          : Promise.reject(new Error("Email không hợp lệ")),
                    },
                  ]}
                >
                  <Input
                    placeholder="example@gmail.com"
                    type="email"
                    prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                    size="large"
                    style={{ borderRadius: 10 }}
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 500 }}>Mật khẩu</span>}
                  name="password"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu!" },
                    { min: 4, message: "Mật khẩu phải có ít nhất 4 ký tự" },
                  ]}
                  hasFeedback
                >
                  <Input.Password
                    placeholder="Tạo mật khẩu"
                    prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <span style={{ fontWeight: 500 }}>Xác nhận mật khẩu</span>
                  }
                  name="confirmPassword"
                  dependencies={["password"]}
                  hasFeedback
                  rules={[
                    { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value)
                          return Promise.resolve();
                        return Promise.reject(new Error("Mật khẩu không khớp"));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    placeholder="Nhập lại mật khẩu"
                    prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="agree"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, v) =>
                    v
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error("Vui lòng đồng ý với điều khoản")
                        ),
                },
              ]}
              style={{ marginTop: 8 }}
            >
              <Checkbox style={{ fontSize: 14 }}>
                Tôi đồng ý với{" "}
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: "#1890ff", fontWeight: 500 }}
                >
                  Điều khoản sử dụng
                </a>{" "}
                và{" "}
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: "#1890ff", fontWeight: 500 }}
                >
                  Chính sách bảo mật
                </a>
              </Checkbox>
            </Form.Item>

            <Form.Item style={{ marginTop: 24, marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
                className="register-submit-btn"
                style={{
                  height: 48,
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 16,
                  boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
                  transition: "all 0.3s ease",
                }}
              >
                {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              </Button>
            </Form.Item>

            <div
              style={{ textAlign: "center", fontSize: 14, color: "#595959" }}
            >
              Đã có tài khoản?{" "}
              <a
                href="/login"
                style={{
                  color: "#1890ff",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
                className="login-link"
              >
                Đăng nhập ngay
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
            Nền tảng quản lý trạm đổi pin thông minh cho xe điện
          </p>
        </div>
      </div>

      {/* CSS for hover effects */}
      <style>
        {`
          .register-submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4) !important;
          }

          .login-link:hover {
            color: #096dd9 !important;
          }

          .ant-input-affix-wrapper:focus,
          .ant-input-affix-wrapper-focused {
            border-color: #1890ff;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
          }

          .ant-input:focus,
          .ant-input-focused {
            border-color: #1890ff;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
          }
        `}
      </style>
    </div>
  );
};

export default RegisterPage;
