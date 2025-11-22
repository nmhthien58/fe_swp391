// src/pages/manage-booking/HistorySection.jsx
import React from "react";
import { Table, Typography } from "antd";
import { fmtVN, formatVnd, bookingStatusTag } from "./helpers";

const { Title } = Typography;

const HistorySection = ({
  completedSwaps,
  cancelledBookings,
  stationsMap,
  loading,
}) => {
  const historySwapColumns = [
    {
      title: "Swap ID",
      dataIndex: "swapId",
      key: "swapId",
      width: 80,
      render: (id) => <strong>#{id}</strong>,
    },
    {
      title: "Driver",
      dataIndex: "driverId",
      key: "driverId",
      width: 80,
    },
    {
      title: "Trạm",
      dataIndex: "stationId",
      key: "stationId",
      width: 200,
      render: (id) => stationsMap.get(id) || `Trạm #${id}`,
    },
    {
      title: "Pin đã đổi",
      dataIndex: "reservedBatteryId",
      key: "reservedBatteryId",
      width: 120,
      render: (v) => (v != null ? v : "-"),
    },
    {
      title: "Pin trả về",
      dataIndex: "returnedBatteryId",
      key: "returnedBatteryId",
      width: 120,
      render: (v) => (v != null ? v : "-"),
    },
    {
      title: "Số tiền",
      dataIndex: "amountVnd",
      key: "amountVnd",
      width: 140,
      render: (v) => formatVnd(v),
    },
    {
      title: "Hoàn thành lúc",
      dataIndex: "completedAt",
      key: "completedAt",
      width: 190,
      render: (iso, record) =>
        fmtVN(iso || record.updatedAt || record.inspectedAt),
    },
  ];

  const historyBookingColumns = [
    {
      title: "Booking ID",
      dataIndex: "bookingId",
      key: "bookingId",
      width: 100,
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
      render: (id) => stationsMap.get(id) || `Trạm #${id}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: bookingStatusTag,
    },
    {
      title: "Giờ hẹn",
      dataIndex: "bookingTime",
      key: "bookingTime",
      render: (iso) => fmtVN(iso),
    },
  ];

  return (
    <>
      <Title level={5} style={{ marginTop: 4 }}>
        Swap đã hoàn tất
      </Title>
      <Table
        rowKey="swapId"
        columns={historySwapColumns}
        dataSource={completedSwaps}
        loading={loading}
        pagination={{ pageSize: 5, size: "small" }}
        size="middle"
        bordered={false}
        style={{ marginBottom: 24 }}
      />

      <Title level={5}>Booking đã hủy</Title>
      <Table
        rowKey="bookingId"
        columns={historyBookingColumns}
        dataSource={cancelledBookings}
        loading={loading}
        pagination={{ pageSize: 5, size: "small" }}
        size="middle"
        bordered={false}
      />
    </>
  );
};

export default HistorySection;
