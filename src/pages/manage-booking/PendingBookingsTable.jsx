// src/pages/manage-booking/PendingBookingsTable.jsx
import React from "react";
import { Table, Typography, Space, Button, Popconfirm } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { fmtVN, bookingStatusTag } from "./helpers";

const { Text } = Typography;

const PendingBookingsTable = ({
  data,
  loading,
  stationsMap,
  onConfirmSwap,
  onCancelBooking,
}) => {
  const columns = [
    {
      title: "Booking ID",
      dataIndex: "bookingId",
      key: "bookingId",
      width: 90,
      render: (id) => <Text strong>#{id}</Text>,
    },
    {
      title: "Tài xế",
      dataIndex: "driverId",
      key: "driverId",
      width: 90,
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
      title: "Giờ hẹn",
      dataIndex: "bookingTime",
      key: "bookingTime",
      width: 170,
      render: (iso) => fmtVN(iso),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: bookingStatusTag,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 260,
      render: (_, record) => (
        <Space>
          <Popconfirm
            title={`Xác nhận swap cho booking #${record.bookingId}?`}
            onConfirm={() => onConfirmSwap(record)}
          >
            <Button type="primary" icon={<CheckCircleOutlined />} size="small">
              Confirm swap
            </Button>
          </Popconfirm>
          <Popconfirm
            title={`Hủy booking #${record.bookingId}?`}
            onConfirm={() => onCancelBooking(record)}
          >
            <Button danger icon={<CloseCircleOutlined />} size="small">
              Hủy
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="bookingId"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 10, size: "small" }}
      size="middle"
      bordered={false}
    />
  );
};

export default PendingBookingsTable;
