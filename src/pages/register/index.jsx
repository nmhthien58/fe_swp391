// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { Form, Input, Checkbox, Button, Card, Row, Col, message } from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
// Nếu muốn chuyển trang sau khi đăng ký:
// import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // const navigate = useNavigate();

  const validateEmail = (email) =>
    /^(?!.*\.\.)([^\s@]+@[^\s@]+\.[^\s@]{2,4})$/.test(email);

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const { userName, fullName, email, password } = values;

      // ✅ Payload đúng theo API /api/register trong Swagger
      const payload = {
        userName: userName?.trim(),
        password,
        email: email?.trim(),
        fullName: fullName?.trim(),
        status: true,
      };

      const { data } = await api.post("/api/register", payload);

      // Theo Swagger: code = 1010 là thành công
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
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#f0f2f5" }}
    >
      <div className="relative z-10 w-full max-w-xl mx-4">
        <Card
          className="backdrop-blur-sm"
          style={{ borderRadius: 16 }}
          bodyStyle={{ padding: 24 }}
        >
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Tạo tài khoản</h2>
            <p className="text-gray-500">Tạo mới tài khoản.</p>
          </div>

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
                  label="Họ và tên"
                  name="fullName"
                  rules={[
                    { required: true, message: "Cần điền họ và tên!" },
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
                    prefix={<UserOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  label="Tên tài khoản"
                  name="userName"
                  rules={[{ required: true, message: "Cần điền tài khoản!" }]}
                >
                  <Input
                    placeholder="Tên tài khoản (dùng để đăng nhập)"
                    prefix={<UserOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Cần điền email!" },
                    {
                      validator: (_, v) =>
                        !v || validateEmail(v)
                          ? Promise.resolve()
                          : Promise.reject(new Error("Điền email hợp lệ.")),
                    },
                  ]}
                >
                  <Input
                    placeholder="abc@gmail.com"
                    type="email"
                    prefix={<MailOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Mật khẩu"
                  name="password"
                  rules={[
                    { required: true, message: "Cần điền mật khẩu!" },
                    { min: 4, message: "Mật khẩu phải có ít nhất 4 ký tự" },
                  ]}
                  hasFeedback
                >
                  <Input.Password
                    placeholder="Mật khẩu"
                    prefix={<LockOutlined />}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  dependencies={["password"]}
                  hasFeedback
                  rules={[
                    { required: true, message: "Vui lòng xác nhận mật khẩu" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value)
                          return Promise.resolve();
                        return Promise.reject(
                          new Error("Mật khẩu không giống nhau")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    placeholder="Xác nhận mật khẩu"
                    prefix={<LockOutlined />}
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
                          new Error("Bạn phải đồng ý với các điều khoản.")
                        ),
                },
              ]}
            >
              <Checkbox>
                Tôi đồng ý với{" "}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Điều khoản &amp; chính sách
                </a>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
              >
                {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              </Button>
            </Form.Item>

            <div className="text-center text-sm text-gray-600">
              Đã có tài khoản?{" "}
              <a href="/login" className="text-blue-600 hover:text-blue-500">
                Đăng nhập
              </a>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
