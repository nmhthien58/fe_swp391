// src/pages/manage-station/StationTable.jsx
import React from "react";
import { Table, Tag, Space, Button, Popconfirm, Empty, Spin } from "antd";

/**
 * Bảng trạm + bảng pin expand phía dưới.
 * Nhận toàn bộ data & callback từ trang ManageStation.
 */
const StationTable = ({
  data,
  loading,
  pagination,
  onChange,
  expandedRowKeys,
  onToggleExpand,
  batteriesByStation,
  loadingBatteries,
  onEdit,
  onDelete,
  onOpenBatteryHistory,
  onOpenBatteryHealth,
}) => {
  const batteryCols = [
    {
      title: "Mã pin",
      dataIndex: "batteryId",
      key: "batteryId",
      width: 90,
    },
    {
      title: "Mã serial",
      dataIndex: "serialNumber",
      key: "serialNumber",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const map = {
          FULL: "green",
          CHARGING: "blue",
          DAMAGED: "error",
          UNKNOWN: "default",
          AVAILABLE: "green",
          MAINTENANCE: "orange",
          IN_USE: "purple",
          EMPTY: "red",
          RESERVED: "black",
          FULLY_CHARGED: "green",
        };
        return <Tag color={map[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Dung lượng (Wh)",
      dataIndex: "capacityWh",
      key: "capacityWh",
      width: 130,
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
    },
    {
      title: "Sức khỏe (%)",
      dataIndex: "healthPercent",
      key: "healthPercent",
      width: 120,
      render: (v) => (v != null ? `${v}%` : "-"),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => onOpenBatteryHistory(record)}>
            Lịch sử
          </Button>
          <Button size="small" onClick={() => onOpenBatteryHealth(record)}>
            Sức khỏe
          </Button>
        </Space>
      ),
    },
  ];

  const columns = [
    {
      title: "Tên trạm",
      dataIndex: "name",
      key: "name",
      render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    { title: "Địa chỉ", dataIndex: "address", key: "address" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const isActive = status === "ACTIVE";
        return (
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
          </Tag>
        );
      },
    },
    {
      title: "Sức chứa pin tối đa",
      dataIndex: "capacity",
      key: "capacity",
      width: 140,
    },
    {
      title: "Số pin khả dụng (FULL)",
      dataIndex: "availableBatteries",
      key: "availableBatteries",
      width: 170,
      render: (v) => (
        <Tag color={v > 0 ? "green" : "red"} style={{ fontWeight: 600 }}>
          {v ?? 0}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 260,
      render: (_, record) => {
        const key = record.stationId ?? record.id;
        const isOpen = expandedRowKeys.includes(key);
        return (
          <Space>
            <Button onClick={() => onToggleExpand(record)}>
              {isOpen ? "Ẩn danh sách pin" : "Xem pin"}
            </Button>
            <Button
              type="default"
              onClick={() => {
                onEdit(record);
              }}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xóa trạm?"
              description="Bạn có chắc chắn muốn xóa trạm này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => onDelete(record.stationId)}
            >
              <Button danger>Xóa</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      rowKey={(record) => record.stationId ?? record.id}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      onChange={onChange}
      scroll={{ x: 1000 }}
      expandable={{
        expandedRowKeys,
        onExpand: (_expanded, record) => onToggleExpand(record),
        expandedRowRender: (record) => {
          const sid = record.stationId ?? record.id;
          const loadingRow = !!loadingBatteries[sid];
          const list =
            batteriesByStation[sid] ??
            (Array.isArray(record.batteries) ? record.batteries : []);

          if (loadingRow) {
            return (
              <div style={{ padding: 12, textAlign: "center" }}>
                <Spin /> Đang tải danh sách pin…
              </div>
            );
          }

          if (!list || list.length === 0) {
            return (
              <div style={{ padding: 12 }}>
                <Empty description="Không có pin nào cho trạm này" />
              </div>
            );
          }

          return (
            <div
              style={{
                background: "#f9fafb",
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Table
                columns={batteryCols}
                dataSource={list}
                rowKey={(r) => r.batteryId ?? r.id}
                pagination={{ pageSize: 8 }}
                size="small"
                bordered
              />
            </div>
          );
        },
      }}
    />
  );
};

export default StationTable;
