// src/pages/manage-support-ticket/SupportTicketTable.jsx
import React, { useMemo } from "react";
import { Button, Empty, Popconfirm, Table, Tag } from "antd";

const statusColor = (s) =>
  ({
    OPEN: "blue",
    PENDING: "gold",
    IN_PROGRESS: "processing",
    RESOLVED: "green",
    CANCELED: "red",
  }[s] || "default");

const statusLabel = (s) =>
  ({
    OPEN: "Mở",
    PENDING: "Chờ xử lý",
    IN_PROGRESS: "Đang xử lý",
    RESOLVED: "Đã xử lý",
    CANCELED: "Đã hủy",
  }[s] || s);

const fmt = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN") : "");

const SupportTicketTable = ({
  tickets,
  loading,
  driverMap,
  stationsMap,
  resolvingId,
  onResolve,
}) => {
  const columns = useMemo(
    () => [
      {
        title: "Mã ticket",
        dataIndex: "ticketId",
        key: "ticketId",
        width: 90,
        fixed: "left",
      },
      {
        title: "Tài xế",
        key: "driver",
        width: 230,
        fixed: "left",
        render: (_, record) => {
          const d = driverMap.get(record.driverId);
          if (!d)
            return (
              <div>
                <div style={{ fontWeight: 500 }}>
                  Tài xế #{record.driverId || "?"}
                </div>
              </div>
            );
          return (
            <div>
              <div style={{ fontWeight: 500 }}>
                {d.fullName || d.userName || "Không rõ tên"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                }}
              >
                {d.email}
              </div>
            </div>
          );
        },
      },
      {
        title: "Trạm",
        key: "station",
        width: 260,
        render: (_, record) => {
          if (!record.stationId) return <span>—</span>;
          const st = stationsMap.get(record.stationId);
          if (!st) return `Trạm #${record.stationId}`;
          return (
            <div>
              <div style={{ fontWeight: 500 }}>
                {st.name || `Trạm #${st.stationId}`}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                }}
              >
                {st.address}
              </div>
            </div>
          );
        },
      },
      {
        title: "Loại sự cố",
        key: "issueType",
        width: 140,
        render: (_, record) => (
          <Tag style={{ fontSize: 12, padding: "2px 8px" }}>
            {record.issueType ?? record.issuetype ?? "Không rõ"}
          </Tag>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (v) => (
          <Tag
            color={statusColor(v)}
            style={{ fontSize: 12, padding: "2px 10px" }}
          >
            {statusLabel(v)}
          </Tag>
        ),
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        width: 380,
        render: (text) => (
          <div
            style={{
              whiteSpace: "normal",
              wordWrap: "break-word",
            }}
          >
            {text || "—"}
          </div>
        ),
      },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        render: fmt,
        width: 170,
      },
      {
        title: "Đã xử lý lúc",
        dataIndex: "resolvedAt",
        key: "resolvedAt",
        render: fmt,
        width: 170,
      },
      {
        title: "Thao tác",
        key: "action",
        width: 170,
        fixed: "right",
        render: (_, record) => {
          const isResolved = record.status === "RESOLVED";
          return (
            <Popconfirm
              title={`Đánh dấu ticket #${record.ticketId} đã xử lý?`}
              okText="Xác nhận"
              cancelText="Hủy"
              onConfirm={() => onResolve(record.ticketId)}
              disabled={isResolved}
            >
              <Button
                type="primary"
                ghost
                size="small"
                loading={resolvingId === record.ticketId}
                disabled={isResolved}
              >
                {isResolved ? "Đã xử lý" : "Đánh dấu đã xử lý"}
              </Button>
            </Popconfirm>
          );
        },
      },
    ],
    [driverMap, stationsMap, resolvingId, onResolve]
  );

  const tableComponents = {
    header: {
      cell: (props) => (
        <th
          {...props}
          style={{
            ...props.style,
            paddingTop: 6,
            paddingBottom: 6,
            fontSize: 13,
            whiteSpace: "nowrap",
            background: "#fafafa",
          }}
        />
      ),
    },
  };

  return (
    <Table
      rowKey="ticketId"
      loading={loading}
      dataSource={tickets}
      columns={columns}
      size="middle"
      tableLayout="fixed"
      components={tableComponents}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
      }}
      scroll={{ x: 1200 }}
      locale={{
        emptyText: <Empty description="Chưa có ticket" />,
      }}
    />
  );
};

export default SupportTicketTable;
