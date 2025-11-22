// src/pages/manage-batteryrentpackage/PackageTable.jsx
import React from "react";
import { Table, Tag, Tooltip, Space, Button, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const currencyVN = (n) =>
  typeof n === "number" ? n.toLocaleString("vi-VN") + " đ" : n;

const dateVN = (s) => {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN");
};

const PackageTable = ({ plans, loading, onEdit, onDelete }) => {
  const columns = [
    { title: "Mã gói", dataIndex: "planId", width: 90 },

    {
      title: "Tên gói",
      dataIndex: "name",
      width: 220,
      ellipsis: true,
      render: (t) => <Tooltip title={t}>{t}</Tooltip>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      width: 320,
      ellipsis: true,
      render: (t) => <Tooltip title={t}>{t}</Tooltip>,
    },

    {
      title: "Giá gói",
      dataIndex: "price",
      width: 110,
      align: "right",
      render: currencyVN,
    },
    {
      title: "Thời hạn",
      dataIndex: "durationDays",
      width: 90,
      align: "center",
    },
    {
      title: "Giới hạn swap",
      dataIndex: "swapLimit",
      width: 110,
      align: "center",
      render: (v) => (v === 0 ? "Không giới hạn" : v),
    },
    {
      title: "Giá / swap",
      dataIndex: "pricePerSwap",
      width: 110,
      align: "right",
      render: currencyVN,
    },
    {
      title: "Giá vượt",
      dataIndex: "pricePerExtraSwap",
      width: 110,
      align: "right",
      render: currencyVN,
    },

    {
      title: "Trạng thái",
      dataIndex: "active",
      width: 120,
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Đang bán" : "Đã vô hiệu hóa"}
        </Tag>
      ),
    },

    {
      title: "Tạo / Cập nhật",
      width: 240,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Tạo: {dateVN(r.createdAt)}
          </span>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Cập nhật: {dateVN(r.updatedAt)}
          </span>
        </Space>
      ),
    },

    {
      title: "Thao tác",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Vô hiệu hóa gói thuê?"
            okText="Vô hiệu hóa"
            cancelText="Hủy"
            onConfirm={() => onDelete(record.planId)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Vô hiệu hóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      loading={loading}
      columns={columns}
      dataSource={plans}
      rowKey="planId"
      bordered
      size="middle"
      scroll={{ x: 1100 }}
    />
  );
};

export default PackageTable;
