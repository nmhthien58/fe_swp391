import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Divider,
  Row,
  Col,
  Spin,
  message,
} from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { FaGoogle } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../config/axios";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      // 🔹 Gọi API login
      const response = await api.post("/auth/login", null, {
        params: {
          userName: values.userName,
          password: values.password,
        },
      });

      // 🔹 Lấy token
      const token = response?.data?.result?.token;
      if (!token) {
        toast.error("Không nhận được token từ server!");
        return;
      }

      // 🔹 Lưu token
      localStorage.setItem("token", token);
      toast.success("Đăng nhập thành công!");

      // 🔹 Kiểm tra quyền hoặc token hợp lệ
      try {
        const res = await api.get("/api/getDrivers");
        if (res.status === 200) {
          navigate("/dashboard");
        } else {
          navigate("/");
        }
      } catch (error) {
        console.warn("Kiểm tra quyền thất bại:", error);
        navigate("/");
      }
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
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #ffffffff 0%, #e2e1e1ff 100%)",
        position: "relative",
      }}
    >
      {/* 🔹 Overlay loading toàn trang */}
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(255,255,255,0.7)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin size="large" tip="Đang đăng nhập..." />
        </div>
      )}

      <div className="relative z-10 w-full max-w-md mx-4">
        <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-gray-500">Sign in to your account</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item
              label="Username"
              name="userName"
              rules={[{ required: true, message: "Username is required" }]}
            >
              <Input
                placeholder="Enter your username"
                prefix={<UserOutlined />}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Password is required" },
                { min: 4, message: "Password must be at least 4 characters" },
              ]}
            >
              <Input.Password
                placeholder="Enter password"
                prefix={<LockOutlined />}
              />
            </Form.Item>

            <Row justify="space-between" align="middle">
              <Col>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Forgot your password?
                </a>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 8 }}>
              <Button type="primary" htmlType="submit" block size="large">
                Sign in
              </Button>
            </Form.Item>

            <Divider>Or continue with</Divider>

            <div>
              <Button
                type="default"
                block
                icon={<FaGoogle />}
                onClick={() => message.info("Google OAuth not implemented")}
              >
                Google
              </Button>
            </div>
            <Divider />
            <div className="text-center">
              Don't have an account?{" "}
              <a href="/register" className="text-blue-600 hover:text-blue-500">
                Register here
              </a>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
