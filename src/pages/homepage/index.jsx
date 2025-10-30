// src/pages/Homepage.jsx
import React from "react";
import { Typography, Button, Row, Col, Card, Space } from "antd";
import {
  ThunderboltOutlined,
  EnvironmentOutlined,
  CarOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

export default function Homepage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        margin: "-24px -50px",
        minHeight: "calc(100vh - 72px - 48px)",
        background: "#f5f7fa",
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #1890ff 0%, #0050b3 100%)",
          padding: "100px 50px 120px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated decorative elements */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "5%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.08)",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-50px",
            left: "10%",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.06)",
            animation: "float 6s ease-in-out infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: "20%",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.05)",
            animation: "float 10s ease-in-out infinite",
          }}
        />

        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Title
            level={1}
            style={{
              color: "#fff",
              fontSize: "3rem",
              fontWeight: 700,
              marginBottom: 20,
              textShadow: "0 2px 10px rgba(0,0,0,0.1)",
              animation: "fadeInUp 0.8s ease-out",
            }}
          >
            EV Battery Swap Station
          </Title>
          <Paragraph
            style={{
              color: "rgba(255, 255, 255, 0.95)",
              fontSize: "1.2rem",
              maxWidth: 750,
              margin: "0 auto 40px",
              lineHeight: 1.8,
              animation: "fadeInUp 0.8s ease-out 0.2s both",
            }}
          >
            Nền tảng thông minh giúp bạn <strong>tìm kiếm trạm gần nhất</strong>
            , <strong>đăng ký gói dịch vụ</strong> và <strong>đổi pin</strong>{" "}
            chỉ trong vài phút
          </Paragraph>
          <div style={{ animation: "fadeInUp 0.8s ease-out 0.4s both" }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              onClick={() => navigate("/register")}
              className="hero-button"
              style={{
                height: 56,
                padding: "0 48px",
                fontSize: "1.1rem",
                fontWeight: 600,
                borderRadius: 28,
                background: "#fff",
                color: "#1890ff",
                border: "none",
                boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Đăng ký ngay
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        style={{
          maxWidth: 1200,
          margin: "-70px auto 0",
          padding: "0 50px 100px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Row gutter={[24, 24]}>
          {[
            {
              icon: <ThunderboltOutlined />,
              title: "Đổi pin nhanh chóng",
              desc: "Hỗ trợ trạm đổi pin trên toàn quốc với thời gian chỉ 3-5 phút",
              color: "#1890ff",
              gradient: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
              delay: "0s",
            },
            {
              icon: <EnvironmentOutlined />,
              title: "Tìm trạm dễ dàng",
              desc: "Hiển thị trạm gần nhất với bản đồ tương tác thời gian thực",
              color: "#52c41a",
              gradient: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
              delay: "0.1s",
            },
            {
              icon: <CarOutlined />,
              title: "Quản lý phương tiện",
              desc: "Liên kết xe của bạn và theo dõi lịch sử dịch vụ chi tiết",
              color: "#faad14",
              gradient: "linear-gradient(135deg, #faad14 0%, #d48806 100%)",
              delay: "0.2s",
            },
          ].map((feature, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card
                bordered={false}
                className="feature-card"
                style={{
                  height: "100%",
                  borderRadius: 16,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  animation: `fadeInUp 0.6s ease-out ${feature.delay} both`,
                  cursor: "pointer",
                }}
                bodyStyle={{ padding: 40, textAlign: "center" }}
              >
                <Space direction="vertical" size={20} style={{ width: "100%" }}>
                  <div
                    className="icon-wrapper"
                    style={{
                      width: 80,
                      height: 80,
                      margin: "0 auto",
                      borderRadius: "50%",
                      background: feature.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 36,
                      color: "#fff",
                      boxShadow: `0 8px 24px ${feature.color}40`,
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {feature.icon}
                  </div>
                  <Text
                    strong
                    style={{
                      fontSize: "1.25rem",
                      color: "#262626",
                      display: "block",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "0.95rem",
                      lineHeight: 1.7,
                      display: "block",
                      color: "#595959",
                    }}
                  >
                    {feature.desc}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* CTA Section */}
        <div
          style={{
            marginTop: 100,
            padding: "60px 40px",
            background: "linear-gradient(135deg, #f0f9ff 0%, #e6f4ff 100%)",
            borderRadius: 20,
            boxShadow: "0 4px 20px rgba(24, 144, 255, 0.1)",
            textAlign: "center",
            border: "1px solid rgba(24, 144, 255, 0.1)",
            animation: "fadeInUp 0.6s ease-out 0.3s both",
          }}
        >
          <Title
            level={2}
            style={{
              marginBottom: 16,
              color: "#1890ff",
              fontWeight: 700,
            }}
          >
            Sẵn sàng bắt đầu?
          </Title>
          <Paragraph
            style={{
              fontSize: "1.1rem",
              color: "#595959",
              marginBottom: 32,
              maxWidth: 650,
              margin: "0 auto 32px",
              lineHeight: 1.7,
            }}
          >
            Đăng ký ngay hôm nay để trải nghiệm dịch vụ đổi pin nhanh chóng và
            tiện lợi nhất
          </Paragraph>
          <Space size={16}>
            <Button
              type="primary"
              size="large"
              className="cta-button-primary"
              onClick={() => navigate("/register")}
              style={{
                height: 50,
                padding: "0 40px",
                fontSize: "1.05rem",
                fontWeight: 600,
                borderRadius: 25,
                boxShadow: "0 4px 14px rgba(24, 144, 255, 0.3)",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Đăng ký ngay
            </Button>
            {/* <Button
              size="large"
              className="cta-button-secondary"
              onClick={() => navigate("/stations")}
              style={{
                height: 50,
                padding: "0 40px",
                fontSize: "1.05rem",
                fontWeight: 600,
                borderRadius: 25,
                borderColor: "#1890ff",
                color: "#1890ff",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Xem trạm
            </Button> */}
          </Space>
        </div>
      </div>

      {/* Global Styles */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0) translateX(0);
            }
            50% {
              transform: translateY(-20px) translateX(20px);
            }
          }

          /* Hero Button Animation */
          .hero-button:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 12px 28px rgba(0,0,0,0.2) !important;
            background: #f0f9ff !important;
          }

          .hero-button:active {
            transform: translateY(-1px) scale(1.02);
          }

          /* Feature Cards Animation */
          .feature-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important;
          }

          .feature-card:hover .icon-wrapper {
            transform: scale(1.1) rotate(5deg);
          }

          /* CTA Buttons Animation */
          .cta-button-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4) !important;
          }

          .cta-button-secondary:hover {
            transform: translateY(-2px);
            background: #1890ff !important;
            color: #fff !important;
            box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
          }

          .cta-button-primary:active,
          .cta-button-secondary:active {
            transform: translateY(0);
          }
        `}
      </style>
    </div>
  );
}
