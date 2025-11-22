// src/pages/manage-booking/ActiveSwapsTable.jsx
import React from "react";
import { Table, Typography, Space, Button } from "antd";
import {
  DollarCircleOutlined,
  ToolOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { fmtVN, swapStatusTag } from "./helpers";

const { Text } = Typography;

const ActiveSwapsTable = ({
  data,
  loading,
  stationsMap,
  onOpenPay,
  onOpenInspect,
  onOpenLatest,
}) => {
  const columns = [
    {
      title: "Swap ID",
      dataIndex: "swapId",
      key: "swapId",
      width: 80,
      render: (id) => <Text strong>#{id}</Text>,
    },
    {
      title: "Tài xế",
      dataIndex: "driverId",
      key: "driverId",
      width: 90,
    },
    {
      title: "ID Pin đã đặt",
      dataIndex: "reservedBatteryId",
      key: "reservedBatteryId",
      width: 120,
      render: (v) => (v != null ? v : "-"),
    },
    {
      title: "Trạm",
      dataIndex: "stationId",
      key: "stationId",
      width: 220,
      render: (id) => {
        const name = stationsMap.get(id);
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{name || `Trạm #${id}`}</div>
            <div style={{ fontSize: 12, color: "#999" }}>ID: {id}</div>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: swapStatusTag,
    },
    {
      title: "Tạo lúc",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (iso) => fmtVN(iso),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 380,
      render: (_, record) => {
        const canPay = record.status === "CONFIRMED";
        const canInspect = record.status === "PAID";
        return (
          <Space wrap>
            <Button
              icon={<DollarCircleOutlined />}
              type="primary"
              onClick={() => onOpenPay(record)}
              disabled={!canPay}
              size="small"
            >
              Pay
            </Button>
            <Button
              icon={<ToolOutlined />}
              onClick={() => onOpenInspect(record)}
              disabled={!canInspect}
              size="small"
            >
              Inspect return
            </Button>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => onOpenLatest(record.driverId)}
              size="small"
              type="default"
            >
              Giao dịch gần nhất
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="swapId"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 10, size: "small" }}
      size="middle"
      bordered={false}
    />
  );
};

export default ActiveSwapsTable;
