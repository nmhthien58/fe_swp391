// src/pages/AdminRevenue/StationRevenueTable.jsx
import React from "react";
import { Card, Table } from "antd";
import { HomeOutlined } from "@ant-design/icons";

const StationRevenueTable = ({ revenueByStation }) => {
  const stationColumns = [
    {
      title: "Trạm",
      dataIndex: "name",
      key: "name",
      render: (v) => (
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <HomeOutlined />
          {v}
        </span>
      ),
    },
    {
      title: "Số lượt đổi",
      dataIndex: "swaps",
      key: "swaps",
    },
    {
      title: "Doanh thu (VND)",
      dataIndex: "revenue",
      key: "revenue",
      render: (v) => v?.toLocaleString("vi-VN"),
      align: "right",
    },
  ];

  return (
    <Card title="Chi tiết doanh thu theo trạm" style={{ borderRadius: 14 }}>
      <Table
        columns={stationColumns}
        dataSource={revenueByStation.map((s, idx) => ({
          key: s.stationId || idx,
          ...s,
        }))}
        pagination={{ pageSize: 8 }}
      />
    </Card>
  );
};

export default StationRevenueTable;
