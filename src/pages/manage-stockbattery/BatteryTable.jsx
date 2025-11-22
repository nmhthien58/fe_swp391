// src/pages/manage-stockbattery/BatteryTable.jsx
import React from "react";
import { Table, Tag, Button, Space } from "antd";
import { statusStyle } from "./statusConfig";

const BatteryTable = ({
  data,
  loading,
  page,
  setPage,
  pageSize,
  onOpenPatch,
  BATTERY_STATUS, // hiện tại chỉ dùng cho filters nếu muốn
}) => {
  const columns = [
    {
      title: "Mã Pin (Serial)",
      dataIndex: "serialNumber",
      key: "serialNumber",
      sorter: true,
      render: (v) => v || "-",
    },
    {
      title: "Dung lượng (Wh)",
      dataIndex: "capacityWh",
      key: "capacityWh",
      sorter: true,
      render: (v) => (v ?? v === 0 ? v : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      filters: BATTERY_STATUS.map((s) => ({
        text: statusStyle[s]?.text || s,
        value: s,
      })),
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const cfg = statusStyle[status] || {
          color: "default",
          text: status || "-",
        };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => onOpenPatch(record)}>
            Cập nhật
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey={(r) => String(r.batteryId)}
      loading={loading}
      dataSource={data}
      columns={columns}
      // eslint-disable-next-line no-unused-vars
      onChange={(pagination, _filters, _sorterArg) => {
        setPage(pagination.current);
      }}
      pagination={{
        current: page,
        pageSize,
        total: data.length,
        showSizeChanger: false,
      }}
    />
  );
};

export default BatteryTable;
