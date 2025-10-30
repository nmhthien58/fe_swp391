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
  Segmented,
  Tooltip,
} from "antd";
import {
  ReloadOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/accountSlice";
import api from "../../config/axios";

const { Title, Text } = Typography;
const { TextArea } = Input;

// ==== các loại vấn đề & danh mục (dịch tiếng Việt) ====
const ISSUE_TYPES = [
  { value: "BATTERY_ISSUE", label: "Vấn đề về pin" },
  { value: "STATION_ISSUE", label: "Vấn đề về trạm" },
];

const CATEGORY_MAP = {
  BATTERY: "Pin",
  STATION: "Trạm",
  PAYMENT: "Thanh toán",
  SYSTEM: "Hệ thống",
  OTHER: "Khác",
};

const CATEGORIES = Object.keys(CATEGORY_MAP);

const statusColor = (s) =>
  ({
    OPEN: "blue",
    PENDING: "gold",
    IN_PROGRESS: "processing",
    RESOLVED: "green",
    CANCELED: "red",
  }[s] || "default");

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : "");

const glassCard = {
  borderRadius: 12,
  boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
};

const Support = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState("create"); // 'create' | 'list'
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const user = useSelector(selectUser);
  const driverId = useMemo(() => {
    if (user?.driverId) return user.driverId;
    if (user?.driver?.driverId) return user.driver.driverId;
    if (user?.id) return user.id;
    return undefined;
  }, [user]);

  // === Gửi ticket ===
  const onFinish = async (values) => {
    if (!driverId) {
      message.error("Không tìm thấy driverId trong phiên đăng nhập.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        issueType: values.issuetype,
        priority: values.priority ?? "LOW",
      };
      delete payload.issuetype;

      await api.post(`/api/support/create`, payload, { params: { driverId } });
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

  // === Lấy danh sách ticket ===
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

  // === Cột bảng ===
  const columns = [
    { title: "Ticket ID", dataIndex: "ticketId", key: "ticketId", width: 100 },
    {
      title: "Station ID",
      dataIndex: "stationId",
      key: "stationId",
      width: 100,
      render: (v) => v ?? "—",
    },
    {
      title: "Loại vấn đề",
      dataIndex: "issueType",
      key: "issueType",
      width: 160,
      render: (v) => {
        if (v === "BATTERY_ISSUE") return <Tag color="blue">Vấn đề về pin</Tag>;
        if (v === "STATION_ISSUE")
          return <Tag color="orange">Vấn đề về trạm</Tag>;
        return <Tag>{v}</Tag>;
      },
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      width: 140,
      render: (v) => <Tag color="geekblue">{CATEGORY_MAP[v] || v || "—"}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (v) => <Tag color={statusColor(v)}>{v}</Tag>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Tạo lúc",
      dataIndex: "createdAt",
      key: "createdAt",
      render: fmt,
      width: 180,
    },
    {
      title: "Hoàn thành lúc",
      dataIndex: "resolvedAt",
      key: "resolvedAt",
      render: fmt,
      width: 180,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* Header */}
      <Card bordered={false} style={glassCard} bodyStyle={{ padding: 16 }}>
        <Space
          align="center"
          style={{
            justifyContent: "space-between",
            width: "100%",
            flexWrap: "wrap",
            gap: 12,
          }}
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
            <Segmented
              size="large"
              value={mode}
              onChange={setMode}
              options={[
                {
                  label: "Tạo ticket",
                  value: "create",
                  icon: <PlusCircleOutlined />,
                },
                {
                  label: "Ticket của tôi",
                  value: "list",
                  icon: <UnorderedListOutlined />,
                },
              ]}
            />
            {mode === "list" && (
              <Tooltip title="Tải lại danh sách">
                <Button icon={<ReloadOutlined />} onClick={fetchMyTickets} />
              </Tooltip>
            )}
            <Tooltip title="BATTERY_ISSUE = Vấn đề về pin, STATION_ISSUE = Vấn đề về trạm">
              <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
            </Tooltip>
          </Space>
        </Space>
      </Card>

      {/* Nội dung */}
      {mode === "create" ? (
        <Card bordered={false} style={glassCard} bodyStyle={{ padding: 16 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              priority: "LOW",
              issuetype: "BATTERY_ISSUE",
              category: "BATTERY",
            }}
          >
            {/* priority ẩn */}
            <Form.Item name="priority" hidden>
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
              label="Loại vấn đề"
              rules={[{ required: true, message: "Vui lòng chọn loại vấn đề" }]}
            >
              <Select
                allowClear
                options={ISSUE_TYPES}
                placeholder="Chọn loại vấn đề"
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="Danh mục"
              rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
            >
              <Select
                allowClear
                placeholder="Chọn danh mục"
                options={CATEGORIES.map((v) => ({
                  value: v,
                  label: CATEGORY_MAP[v],
                }))}
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả chi tiết"
              rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
            >
              <TextArea rows={4} placeholder="Mô tả sự cố bạn gặp phải..." />
            </Form.Item>

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
          </Form>

          {/* <div
            style={{
              marginTop: 16,
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            <Text type="secondary">
              <b>Vấn đề về pin:</b> Các sự cố liên quan đến đổi pin, sạc pin,
              pin lỗi, v.v. <br />
              <b>Vấn đề về trạm:</b> Các sự cố liên quan đến trạm, thiết bị hoặc
              nhân viên trạm.
            </Text>
          </div> */}
        </Card>
      ) : (
        <Card bordered={false} style={glassCard} bodyStyle={{ padding: 16 }}>
          <Table
            rowKey="ticketId"
            loading={loadingTickets}
            dataSource={tickets}
            columns={columns}
            pagination={{ pageSize: 8, showSizeChanger: true }}
            scroll={{ x: 950 }}
            locale={{ emptyText: <Empty description="Chưa có ticket nào" /> }}
            size="middle"
          />
        </Card>
      )}
    </Space>
  );
};

export default Support;
