// src/pages/ManageSupportTicket.jsx
import React, { useCallback, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Space,
  Form,
  InputNumber,
  Button,
  Table,
  Tag,
  message,
  Popconfirm,
  Empty,
} from "antd";
import api from "../../config/axios";

const { Title } = Typography;

const priorityColor = (p) =>
  ({ LOW: "blue", NORMAL: "default", HIGH: "orange", URGENT: "red" }[p] ||
  "default");

const statusColor = (s) =>
  ({
    OPEN: "blue",
    PENDING: "gold",
    IN_PROGRESS: "processing",
    RESOLVED: "green",
    CANCELED: "red",
  }[s] || "default");

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : "");

const ManageSupportTicket = () => {
  const [form] = Form.useForm();
  const [driverId, setDriverId] = useState();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  const fetchTickets = useCallback(
    async (id) => {
      if (!id && !driverId) {
        message.warning("Nhập driverId trước khi tìm.");
        return;
      }
      const targetId = id ?? driverId;
      setLoading(true);
      try {
        const res = await api.get(`/api/support/driver/${targetId}`);
        setTickets(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Không tải được ticket.";
        message.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [driverId]
  );

  const handleSearch = () => {
    const val = form.getFieldValue("driverId");
    if (val == null) {
      message.warning("Vui lòng nhập driverId.");
      return;
    }
    setDriverId(val);
    fetchTickets(val);
  };

  const handleResolve = async (ticketId) => {
    setResolvingId(ticketId);
    try {
      await api.put(`/api/support/${ticketId}/resolve`);
      message.success(`Đã resolve ticket #${ticketId}`);
      fetchTickets(); // reload theo driverId hiện tại
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Resolve thất bại.";
      message.error(msg);
    } finally {
      setResolvingId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Ticket ID",
        dataIndex: "ticketId",
        key: "ticketId",
        width: 100,
      },
      {
        title: "Driver ID",
        dataIndex: "driverId",
        key: "driverId",
        width: 100,
      },
      {
        title: "Station ID",
        dataIndex: "stationId",
        key: "stationId",
        width: 110,
      },
      {
        title: "Issue Type",
        key: "issueType",
        render: (_, record) => (
          <Tag>{record.issueType ?? record.issuetype}</Tag>
        ),
      },
      {
        title: "Category",
        dataIndex: "category",
        key: "category",
        render: (v) => <Tag>{v ?? "—"}</Tag>,
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        render: (v) => <Tag color={priorityColor(v)}>{v}</Tag>,
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (v) => <Tag color={statusColor(v)}>{v}</Tag>,
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
      },
      {
        title: "Created At",
        dataIndex: "createdAt",
        key: "createdAt",
        render: fmt,
      },
      {
        title: "Updated At",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: fmt,
      },
      {
        title: "Resolved At",
        dataIndex: "resolvedAt",
        key: "resolvedAt",
        render: fmt,
      },
      {
        title: "Action",
        key: "action",
        width: 140,
        render: (_, record) => {
          const isResolved = record.status === "RESOLVED";
          return (
            <Popconfirm
              title={`Resolve ticket #${record.ticketId}?`}
              okText="Resolve"
              cancelText="Hủy"
              onConfirm={() => handleResolve(record.ticketId)}
              disabled={isResolved}
            >
              <Button
                type="primary"
                ghost
                size="small"
                loading={resolvingId === record.ticketId}
                disabled={isResolved}
              >
                Resolve
              </Button>
            </Popconfirm>
          );
        },
      },
    ],
    [resolvingId]
  );

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={4} style={{ margin: 0 }}>
          Quản lý Support Ticket
        </Title>

        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item
            label="Driver ID"
            name="driverId"
            rules={[{ required: true, message: "Nhập driverId" }]}
            initialValue={driverId}
          >
            <InputNumber min={1} style={{ width: 200 }} placeholder="VD: 15" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Tìm ticket
              </Button>
              <Button
                onClick={() => fetchTickets()}
                disabled={!driverId}
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          rowKey="ticketId"
          loading={loading}
          dataSource={tickets}
          columns={columns}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: <Empty description="Chưa có ticket" /> }}
        />
      </Space>
    </Card>
  );
};

export default ManageSupportTicket;
