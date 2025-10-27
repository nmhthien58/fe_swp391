// src/pages/Homepage.jsx
import React from "react";
import { Typography, Button, Row, Col, Card, Space, theme } from "antd";
import {
  ThunderboltOutlined,
  EnvironmentOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

export default function Homepage() {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  return (
    <div
      style={{
        marginTop: "100px",
        padding: "32px 16px 56px",
        background: "#f0f2f5", // nhạt, hợp AntD
      }}
    >
      {/* Container */}
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            EV Battery Swap Station System
          </Title>
          <Paragraph style={{ color: token.colorTextSecondary, margin: 0 }}>
            Nền tảng giúp bạn <b>tìm trạm gần nhất</b>,{" "}
            <b>đăng ký gói dịch vụ</b> và
            <b> đổi pin</b> nhanh chóng.
          </Paragraph>
        </div>

        {/* Features */}
        <Row gutter={[16, 16]} justify="center" style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <Card
              bordered
              style={{ height: "100%", borderRadius: 10 }}
              bodyStyle={{ padding: 16, textAlign: "center" }}
            >
              <Space direction="vertical" size={8}>
                <ThunderboltOutlined style={{ fontSize: 28 }} />
                <Text strong>Đổi pin nhanh chóng</Text>
                <Text type="secondary">Hỗ trợ trạm trên toàn quốc</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              bordered
              style={{ height: "100%", borderRadius: 10 }}
              bodyStyle={{ padding: 16, textAlign: "center" }}
            >
              <Space direction="vertical" size={8}>
                <EnvironmentOutlined style={{ fontSize: 28 }} />
                <Text strong>Tìm trạm dễ dàng</Text>
                <Text type="secondary">Hiển thị vị trí gần bạn</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              bordered
              style={{ height: "100%", borderRadius: 10 }}
              bodyStyle={{ padding: 16, textAlign: "center" }}
            >
              <Space direction="vertical" size={8}>
                <CarOutlined style={{ fontSize: 28 }} />
                <Text strong>Quản lý phương tiện</Text>
                <Text type="secondary">Liên kết xe & theo dõi dịch vụ</Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <Paragraph style={{ marginBottom: 12 }}>
            Đăng ký để sử dụng dịch vụ ngay.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/register")}
          >
            Đăng ký ngay
          </Button>
        </div>
      </div>
    </div>
  );
}
