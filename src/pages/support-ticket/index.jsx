// src/pages/Support.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Typography,
  message,
  Space,
  Table,
  Tag,
  Empty,
} from "antd";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/accountSlice";
import api from "../../config/axios";

const { Title, Text } = Typography;
const { TextArea } = Input;

// ==== chỉ còn 2 loại issue như yêu cầu ====
const ISSUE_TYPES = ["BATTERY_ISSUE", "STATION_ISSUE"];
const CATEGORIES = ["BATTERY", "STATION", "PAYMENT", "SYSTEM", "OTHER"];

// Tag màu cho status/priority
// eslint-disable-next-line no-unused-vars
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

const Support = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // UI mode: 'create' | 'list'
  const [mode, setMode] = useState("create");

  // tickets state
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Lấy driverId từ Redux
  const user = useSelector(selectUser);
  const driverId = useMemo(() => {
    if (user?.driverId) return user.driverId;
    if (user?.driver?.driverId) return user.driver.driverId;
    if (user?.id) return user.id;
    return undefined;
  }, [user]);

  // Submit tạo ticket
  const onFinish = async (values) => {
    if (!driverId) {
      message.error("Không tìm thấy driverId trong phiên đăng nhập.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/support/create`, values, { params: { driverId } });
      message.success("Gửi ticket thành công!");
      form.resetFields();
      setMode("list");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Gửi ticket thất bại. Vui lòng thử lại.";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Load tickets của tôi
  const fetchMyTickets = async () => {
    if (!driverId) {
      message.error("Không tìm thấy driverId trong phiên đăng nhập.");
      return;
    }
    setLoadingTickets(true);
    try {
      const res = await api.get(`/api/support/driver/${driverId}`);
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không tải được danh sách ticket.";
      message.error(msg);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (mode === "list") fetchMyTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, driverId]);

  // Bảng tickets
  const columns = [
    { title: "Ticket ID", dataIndex: "ticketId", key: "ticketId", width: 110 },
    {
      title: "Station ID",
      dataIndex: "stationId",
      key: "stationId",
      width: 110,
    },
    {
      title: "Issue Type",
      dataIndex: "issueType",
      key: "issueType",
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (v) => <Tag>{v ?? "—"}</Tag>,
    },
    // {
    //   title: "Priority",
    //   dataIndex: "priority",
    //   key: "priority",
    //   render: (v) => <Tag color={priorityColor(v)}>{v}</Tag>,
    // },
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
      title: "Resolved At",
      dataIndex: "resolvedAt",
      key: "resolvedAt",
      render: fmt,
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space
          align="center"
          style={{ justifyContent: "space-between", width: "100%" }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Hỗ trợ
            </Title>
            <Text type="secondary">
              Driver ID: <b>{driverId ?? "N/A"}</b>
            </Text>
          </div>

          <Space>
            <Button
              type={mode === "create" ? "primary" : "default"}
              onClick={() => setMode("create")}
            >
              Tạo ticket
            </Button>
            <Button
              type={mode === "list" ? "primary" : "default"}
              onClick={() => setMode("list")}
            >
              Ticket của tôi
            </Button>
          </Space>
        </Space>

        {mode === "create" ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              // priority mặc định LOW và ẩn
              priority: "LOW",
              issuetype: "BATTERY_ISSUE",
              category: "BATTERY",
            }}
          >
            {/* Trường priority ẩn nhưng vẫn submit lên API */}
            <Form.Item name="priority" initialValue="LOW" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              name="stationId"
              label="Station ID"
              rules={[{ required: true, message: "Vui lòng nhập Station ID" }]}
            >
              <InputNumber placeholder="VD: 101" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="issuetype"
              label="Issue Type"
              rules={[{ required: true, message: "Vui lòng chọn Issue Type" }]}
            >
              <Select
                allowClear
                options={ISSUE_TYPES.map((v) => ({ value: v, label: v }))}
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Vui lòng chọn Category" }]}
            >
              <Select
                allowClear
                options={CATEGORIES.map((v) => ({ value: v, label: v }))}
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả chi tiết"
              rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
            >
              <TextArea rows={4} placeholder="Mô tả sự cố bạn gặp phải..." />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  Gửi ticket
                </Button>
                <Button
                  htmlType="button"
                  onClick={() => form.resetFields()}
                  disabled={submitting}
                >
                  Xoá form
                </Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <Table
            rowKey="ticketId"
            loading={loadingTickets}
            dataSource={tickets}
            columns={columns}
            pagination={{ pageSize: 8, showSizeChanger: true }}
            locale={{ emptyText: <Empty description="Chưa có ticket nào" /> }}
          />
        )}
      </Space>
    </Card>
  );
};

export default Support;
