// src/pages/AdminRevenue/SummaryCards.jsx
import React from "react";
import { Card, Row, Col, Statistic } from "antd";
import {
  DollarOutlined,
  SwapOutlined,
  RiseOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const SummaryCards = ({
  totalRevenueFromPlans,
  totalRevenueFromSwaps,
  swapCount,
  bestPlan,
  peakHourSlot,
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{ borderRadius: 14 }}
          bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "999px",
              background: "rgba(79,70,229,0.1)",
              display: "grid",
              placeItems: "center",
              color: "#4f46e5",
            }}
          >
            <DollarOutlined />
          </div>
          <Statistic
            title="Tổng tiền từ gói"
            value={totalRevenueFromPlans}
            valueStyle={{ fontSize: 20 }}
            formatter={(v) => v.toLocaleString("vi-VN")}
            suffix=" VND"
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{ borderRadius: 14 }}
          bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "999px",
              background: "rgba(14,165,233,0.1)",
              display: "grid",
              placeItems: "center",
              color: "#0ea5e9",
            }}
          >
            <SwapOutlined />
          </div>
          <Statistic
            title="Tổng tiền đổi pin"
            value={totalRevenueFromSwaps}
            valueStyle={{ fontSize: 20 }}
            formatter={(v) => v.toLocaleString("vi-VN")}
            suffix=" VND"
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{ borderRadius: 14 }}
          bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "999px",
              background: "rgba(249,115,22,0.1)",
              display: "grid",
              placeItems: "center",
              color: "#f97316",
            }}
          >
            <BarChartOutlined />
          </div>
          <Statistic
            title="Số giao dịch swap"
            value={swapCount}
            suffix=" lượt"
            valueStyle={{ fontSize: 20 }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card
          style={{ borderRadius: 14 }}
          bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "999px",
              background: "rgba(34,197,94,0.1)",
              display: "grid",
              placeItems: "center",
              color: "#22c55e",
            }}
          >
            <RiseOutlined />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#999" }}>Gói bán chạy nhất</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
              {bestPlan ? bestPlan.name : "—"}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Khung giờ cao điểm:{" "}
              {peakHourSlot && peakHourSlot.swaps > 0
                ? `${peakHourSlot.label} (${peakHourSlot.swaps} lượt)`
                : "chưa có dữ liệu"}
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default SummaryCards;
