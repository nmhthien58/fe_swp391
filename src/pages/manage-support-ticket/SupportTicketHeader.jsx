import React from "react";
import { Space, Typography } from "antd";

const { Title, Text } = Typography;

const SupportTicketHeader = ({ totalTickets }) => {
  return (
    <div
      style={{
        marginBottom: 24,
        padding: 16,
        borderRadius: 12,
        background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(148,163,184,0.25)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div>
        <Title
          level={4}
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 4,
          }}
        >
          Quản lý phiếu hỗ trợ
        </Title>
        <Text type="secondary">
          Xem và xử lý các ticket do tài xế gửi lên hệ thống.
        </Text>
      </div>

      <Space direction="vertical" align="end">
        <Text type="secondary" style={{ fontSize: 12 }}>
          Tổng số ticket
        </Text>

        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          {totalTickets}
        </div>
      </Space>
    </div>
  );
};

export default SupportTicketHeader;
