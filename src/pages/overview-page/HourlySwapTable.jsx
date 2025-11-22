// src/pages/AdminRevenue/HourlySwapRow.jsx
import React from "react";
import { Card, Row, Col } from "antd";
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

const HourlySwapTable = ({ hourlySwapData }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24}>
        <Card
          title="Phân bố lượt đổi pin theo khung giờ (mỗi khung 2 tiếng)"
          style={{ borderRadius: 14 }}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hourlySwapData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => `${value} lượt`} />
              <Legend />
              <Bar dataKey="swaps" name="Số lượt đổi" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );
};

export default HourlySwapTable;
