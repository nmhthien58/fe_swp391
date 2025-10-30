import React, { useState } from "react";
import { Form, Input, Button, Card, Divider, Row, Col, Spin } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
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
      // 1) Đăng nhập -> token
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

      // (Khuyên dùng Redux Persist thay cho localStorage thủ công)
      localStorage.setItem("token", token);

      dispatch(setCredentials({ token, refreshToken }));

      // 2) Lấy hồ sơ -> role
      const me = await api.get("/api/myInfo");
      const profile = me?.data?.result;
      dispatch(setUser(profile));

      // 3) Điều hướng theo role ở client
      const role = profile?.roles?.[0]?.userType;
      if (role === "ADMIN") {
        navigate("/dashboard");
      } else if (role === "STAFF") {
        navigate("/staff");
      } else {
        // Role DRIVER
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
      className="flex justify-center"
      style={{
        background: "#f0f2f5",
        alignItems: "flex-start",
        paddingTop: 100,
        paddingBottom: 120, // chừa khoảng nhỏ dưới cho đẹp
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

      <div className="relative z-10 w-full max-w-lg mx-4">
        <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Đăng nhập</h2>
            <p className="text-gray-500">Chào mừng bạn trở lại</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item
              label="Tài khoản"
              name="userName"
              rules={[{ required: true, message: "Cần điền tài khoản!" }]}
            >
              <Input
                placeholder="Điền tài khoản của bạn"
                prefix={<UserOutlined />}
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: "Cần nhập mật khẩu!" },
                { min: 4, message: "Mật khẩu phải có ít nhất 4 ký tự" },
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
                  Quên mật khẩu?
                </a>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 8 }}>
              <Button type="primary" htmlType="submit" block size="large">
                Đăng nhập
              </Button>
            </Form.Item>

            <Divider />
            <div className="text-center">
              Chưa có tài khoản?{" "}
              <a href="/register" className="text-blue-600 hover:text-blue-500">
                Đăng ký ở đây
              </a>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
