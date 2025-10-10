import React, { useState } from "react";
import { Card, Row, Col, Statistic, Select, DatePicker, Table } from "antd";
import {
  DollarOutlined,
  SwapOutlined,
  RiseOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const { RangePicker } = DatePicker;

const Overview = () => {
  const [timeRange, setTimeRange] = useState("month");
  // eslint-disable-next-line no-unused-vars
  const [selectedDates, setSelectedDates] = useState(null);

  // Mock data - thay thế bằng API call thực tế
  const summaryStats = {
    totalRevenue: 125600000,
    totalSwaps: 3456,
    averagePerSwap: 36340,
    growthRate: 12.5,
  };

  // Dữ liệu doanh thu theo thời gian
  const revenueData = [
    { month: "T1", revenue: 85000000, swaps: 2340 },
    { month: "T2", revenue: 92000000, swaps: 2531 },
    { month: "T3", revenue: 98000000, swaps: 2697 },
    { month: "T4", revenue: 105000000, swaps: 2889 },
    { month: "T5", revenue: 112000000, swaps: 3082 },
    { month: "T6", revenue: 125600000, swaps: 3456 },
  ];

  // Dữ liệu tần suất đổi pin theo giờ
  const hourlySwapData = [
    { hour: "0h", swaps: 45 },
    { hour: "2h", swaps: 23 },
    { hour: "4h", swaps: 12 },
    { hour: "6h", swaps: 89 },
    { hour: "8h", swaps: 234 },
    { hour: "10h", swaps: 198 },
    { hour: "12h", swaps: 267 },
    { hour: "14h", swaps: 245 },
    { hour: "16h", swaps: 289 },
    { hour: "18h", swaps: 356 },
    { hour: "20h", swaps: 298 },
    { hour: "22h", swaps: 187 },
  ];

  // Dữ liệu phân bố theo loại pin
  const batteryTypeData = [
    { name: "48V 20Ah", value: 1234, color: "#0088FE" },
    { name: "60V 32Ah", value: 987, color: "#00C49F" },
    { name: "48V 12Ah", value: 756, color: "#FFBB28" },
    { name: "72V 40Ah", value: 479, color: "#FF8042" },
  ];

  // Bảng top trạm đổi pin
  const topStationsColumns = [
    {
      title: "Xếp hạng",
      dataIndex: "rank",
      key: "rank",
      width: 100,
      render: (rank) => (
        <span style={{ fontWeight: "bold", color: "#1890ff" }}>#{rank}</span>
      ),
    },
    {
      title: "Tên trạm",
      dataIndex: "stationName",
      key: "stationName",
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Số lượt đổi",
      dataIndex: "swaps",
      key: "swaps",
      render: (swaps) => swaps.toLocaleString("vi-VN"),
    },
    {
      title: "Doanh thu (VND)",
      dataIndex: "revenue",
      key: "revenue",
      render: (revenue) => revenue.toLocaleString("vi-VN"),
    },
  ];

  const topStationsData = [
    {
      key: 1,
      rank: 1,
      stationName: "Trạm Quận 1",
      address: "123 Nguyễn Huệ, Q.1",
      swaps: 567,
      revenue: 20618000,
    },
    {
      key: 2,
      rank: 2,
      stationName: "Trạm Thủ Đức",
      address: "456 Võ Văn Ngân, Thủ Đức",
      swaps: 489,
      revenue: 17776600,
    },
    {
      key: 3,
      rank: 3,
      stationName: "Trạm Bình Thạnh",
      address: "789 Điện Biên Phủ, Bình Thạnh",
      swaps: 423,
      revenue: 15369820,
    },
    {
      key: 4,
      rank: 4,
      stationName: "Trạm Quận 7",
      address: "321 Nguyễn Văn Linh, Q.7",
      swaps: 398,
      revenue: 14463320,
    },
    {
      key: 5,
      rank: 5,
      stationName: "Trạm Tân Bình",
      address: "654 Cộng Hòa, Tân Bình",
      swaps: 367,
      revenue: 13336780,
    },
  ];

  // Giờ cao điểm
  const peakHours = [
    { time: "18:00 - 19:00", swaps: 356, percentage: 10.3 },
    { time: "16:00 - 17:00", swaps: 289, percentage: 8.4 },
    { time: "20:00 - 21:00", swaps: 298, percentage: 8.6 },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#1a1a1a",
            marginBottom: 8,
          }}
        >
          Báo cáo & Thống kê
        </h2>
        <p style={{ color: "#666", fontSize: 14 }}>
          Tổng quan về doanh thu và hoạt động đổi pin
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col>
            <span style={{ marginRight: 8 }}>Khoảng thời gian:</span>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 150 }}
            >
              <Select.Option value="day">Hôm nay</Select.Option>
              <Select.Option value="week">Tuần này</Select.Option>
              <Select.Option value="month">Tháng này</Select.Option>
              <Select.Option value="year">Năm này</Select.Option>
              <Select.Option value="custom">Tùy chỉnh</Select.Option>
            </Select>
          </Col>
          {timeRange === "custom" && (
            <Col>
              <RangePicker
                onChange={setSelectedDates}
                format="DD/MM/YYYY"
                placeholder={["Từ ngày", "Đến ngày"]}
              />
            </Col>
          )}
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={summaryStats.totalRevenue}
              precision={0}
              valueStyle={{ color: "#3f8600" }}
              prefix={<DollarOutlined />}
              suffix="VND"
              formatter={(value) => value.toLocaleString("vi-VN")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng lượt đổi pin"
              value={summaryStats.totalSwaps}
              valueStyle={{ color: "#1890ff" }}
              prefix={<SwapOutlined />}
              suffix="lượt"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Trung bình/lượt"
              value={summaryStats.averagePerSwap}
              precision={0}
              valueStyle={{ color: "#cf1322" }}
              suffix="VND"
              formatter={(value) => value.toLocaleString("vi-VN")}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tăng trưởng"
              value={summaryStats.growthRate}
              precision={1}
              valueStyle={{ color: "#3f8600" }}
              prefix={<RiseOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Biểu đồ doanh thu & số lượt đổi pin">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "Doanh thu") {
                      return [value.toLocaleString("vi-VN") + " VND", name];
                    }
                    return [value.toLocaleString("vi-VN") + " lượt", name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Doanh thu"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="swaps"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Số lượt đổi"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Phân bố loại pin">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={batteryTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {batteryTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Hourly Swap Frequency */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center" }}>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                Tần suất đổi pin theo giờ
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlySwapData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip
                  formatter={(value) => value.toLocaleString("vi-VN") + " lượt"}
                />
                <Legend />
                <Bar dataKey="swaps" fill="#8884d8" name="Số lượt đổi" />
              </BarChart>
            </ResponsiveContainer>

            {/* Peak Hours Summary */}
            <div
              style={{
                marginTop: 24,
                padding: "16px",
                background: "#f5f5f5",
                borderRadius: 8,
              }}
            >
              <h4 style={{ marginBottom: 12, fontWeight: "bold" }}>
                🔥 Giờ cao điểm
              </h4>
              <Row gutter={16}>
                {peakHours.map((peak, index) => (
                  <Col xs={24} sm={8} key={index}>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: "#1890ff",
                        }}
                      >
                        {peak.time}
                      </div>
                      <div style={{ fontSize: 16, color: "#666" }}>
                        {peak.swaps} lượt ({peak.percentage}%)
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Top Stations Table */}
      <Row gutter={16}>
        <Col xs={24}>
          <Card title="Top 5 trạm đổi pin hiệu quả nhất">
            <Table
              columns={topStationsColumns}
              dataSource={topStationsData}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Overview;
