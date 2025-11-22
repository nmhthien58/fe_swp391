// src/pages/manage-booking/SummaryStats.jsx
import React from "react";
import { Space, Typography } from "antd";
import {
  SwapOutlined,
  DollarCircleOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const SummaryStats = ({ pendingCount, activeCount, completedCount }) => {
  return (
    <div
      style={{
        marginBottom: 16,
        padding: "10px 16px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.9)",
        border: "1px solid #e5e7eb",
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      <div
        style={{
          padding: "10px 20px",
          background: "#eff6ff",
        }}
      >
        <Space direction="vertical" size={0}>
          <Space>
            <SwapOutlined />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Booking chờ xử lý
            </Text>
          </Space>
          <Text style={{ fontSize: 18, fontWeight: 700 }}>{pendingCount}</Text>
        </Space>
      </div>
      <div
        style={{
          padding: "10px 20px",
          background: "#eff6ff",
        }}
      >
        <Space direction="vertical" size={0}>
          <Space>
            <DollarCircleOutlined />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Swap đang thực hiện
            </Text>
          </Space>
          <Text style={{ fontSize: 18, fontWeight: 700 }}>{activeCount}</Text>
        </Space>
      </div>
      <div
        style={{
          padding: "10px 20px",
          background: "#eff6ff",
        }}
      >
        <Space direction="vertical" size={0}>
          <Space>
            <HistoryOutlined />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Swap đã hoàn tất
            </Text>
          </Space>
          <Text style={{ fontSize: 18, fontWeight: 700 }}>
            {completedCount}
          </Text>
        </Space>
      </div>
    </div>
  );
};

export default SummaryStats;
