// src/pages/AdminRevenue/StationAndPlanRow.jsx
import React from "react";
import { Card, Row, Col, Table, Tag } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PlanRevenueTable = ({ stationChartData, revenuePerPlan }) => {
  const planColumns = [
    {
      title: "Gói",
      dataIndex: "name",
      key: "name",
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Giá (VND)",
      dataIndex: "price",
      key: "price",
      render: (v) => v?.toLocaleString("vi-VN"),
    },
    {
      title: "Số lượt mua",
      dataIndex: "totalSubscriptions",
      key: "totalSubscriptions",
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      render: (v) => v?.toLocaleString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (v) => (v ? <Tag color="green">Đang bán</Tag> : <Tag>Ngừng</Tag>),
    },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} lg={12}>
        <Card title="Doanh thu theo trạm" style={{ borderRadius: 14 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stationChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="station" />
              <YAxis />
              <Tooltip
                formatter={(value) => value.toLocaleString("vi-VN") + " VND"}
              />
              <Legend />
              <Bar dataKey="revenue" name="Doanh thu" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Doanh thu theo gói đăng ký" style={{ borderRadius: 14 }}>
          <Table
            columns={planColumns}
            dataSource={revenuePerPlan}
            size="small"
            pagination={false}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default PlanRevenueTable;
