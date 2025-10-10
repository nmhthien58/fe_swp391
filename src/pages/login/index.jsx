import React, { useState } from "react";
import {
  Form,
  Input,
  Checkbox,
  Button,
  Card,
  Divider,
  Row,
  Col,
  message,
} from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../config/axios";
import { useNavigate } from "react-router-dom";
// If using AntD v5, remember to import base reset once in your app root:
// import "antd/dist/reset.css";

const LoginPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", values);
      toast.success("Successfully logged in!");
      console.log(response);
      const { token } = response.data;
      localStorage.setItem("token", token);
      navigate("/dashboard");
      // lưu state
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      message.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-blue-100 to-blue-50 justify-center relative ">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[url('')]   bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 "></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-gray-500">Sign in to your account</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{ rememberMe: false }}
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item label="Email address" name="email">
              <Input placeholder="Enter your email" prefix={<MailOutlined />} />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Password is required" },
                { min: 4, message: "Password must be at least 8 characters" },
              ]}
              hasFeedback
            >
              <Input.Password
                placeholder="Enter password"
                prefix={<LockOutlined />}
              />
            </Form.Item>

            <Row justify="space-between" align="middle">
              <Col>
                <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
              </Col>
              <Col>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Forgot your password?
                </a>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
              >
                {isLoading ? "Signing in..." : "Sign in"}
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
