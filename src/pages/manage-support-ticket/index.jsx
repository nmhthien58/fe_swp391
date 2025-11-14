// src/pages/ManageSupportTicket.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Space,
  Form,
  Button,
  Table,
  Tag,
  message,
  Popconfirm,
  Empty,
  Select,
} from "antd";
import api from "../../config/axios";

const { Title, Text } = Typography;
const { Option } = Select;

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

const ManageSupportTicket = () => {
  const [form] = Form.useForm();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  const [drivers, setDrivers] = useState([]);
  const [driverMap, setDriverMap] = useState(new Map());
  const [stationsMap, setStationsMap] = useState(new Map());

  const [filterDriverId, setFilterDriverId] = useState(null);

  // ===== LOAD DATA: drivers + stations + all tickets =====
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Lấy driver & station
      const [driversRes, stationsRes] = await Promise.all([
        api.get("/api/getDrivers"),
        api.get("/api/stations", {
          params: { page: 0, size: 100, sort: "name,asc" },
        }),
      ]);

      const driverList = driversRes?.data?.result || [];
      setDrivers(driverList);
      setDriverMap(new Map(driverList.map((d) => [d.driverId, d])));

      const stationContent = stationsRes?.data?.content || [];
      setStationsMap(
        new Map(stationContent.map((s) => [s.stationId ?? s.id, s]))
      );

      // 2. Gọi tất cả ticket theo từng driver (do BE chưa có API get-all)
      const ticketResults = await Promise.all(
        driverList.map((d) =>
          api
            .get(`/api/support/driver/${d.driverId}`)
            .then((res) => ({
              driverId: d.driverId,
              tickets: res.data,
            }))
            .catch(() => ({
              driverId: d.driverId,
              tickets: [],
            }))
        )
      );

      const mergedTickets = [];
      ticketResults.forEach(({ driverId, tickets }) => {
        const arr = Array.isArray(tickets) ? tickets : tickets?.result || [];
        arr.forEach((t) => {
          mergedTickets.push({
            ...t,
            driverId: t.driverId ?? driverId,
          });
        });
      });

      setTickets(mergedTickets);
    } catch (err) {
      console.error(err);
      message.error("Không tải được dữ liệu ticket / tài xế / trạm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ===== FILTER CLIENT-SIDE =====
  const handleSearch = () => {
    const val = form.getFieldValue("driverId");
    setFilterDriverId(val || null);
  };

  const handleClearFilter = () => {
    form.resetFields(["driverId"]);
    setFilterDriverId(null);
  };

  const filteredTickets = useMemo(
    () =>
      filterDriverId
        ? tickets.filter((t) => t.driverId === filterDriverId)
        : tickets,
    [tickets, filterDriverId]
  );

  const totalTickets = tickets.length;

  // ===== ACTION: RESOLVE =====
  const handleResolve = async (ticketId) => {
    setResolvingId(ticketId);
    try {
      await api.put(`/api/support/${ticketId}/resolve`);
      message.success(`Đã đánh dấu ticket #${ticketId} là đã xử lý.`);
      await loadAllData();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Xử lý ticket thất bại.";
      message.error(msg);
    } finally {
      setResolvingId(null);
    }
  };

  // ===== COLUMNS =====
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
                {isResolved ? "Đã xử lý" : "Đánh dấu đã xử lý"}
              </Button>
            </Popconfirm>
          );
        },
      },
    ],
    [driverMap, stationsMap, resolvingId]
  );

  // custom header cell để header thấp hơn
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
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
        border: "1px solid #e5e7eb",
      }}
      bodyStyle={{ padding: 24 }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Quản lý phiếu hỗ trợ (Support Ticket)
            </Title>
            <Text type="secondary">
              Xem và xử lý các ticket do tài xế gửi lên hệ thống.
            </Text>
          </div>
          <Space direction="vertical" align="end">
            <Text type="secondary" style={{ fontSize: 12 }}>
              Tổng số ticket
            </Text>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {totalTickets}
            </div>
          </Space>
        </div>

        {/* FILTER BAR */}
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <Form form={form} layout="inline" onFinish={handleSearch}>
            <Form.Item
              label="Lọc theo tài xế"
              name="driverId"
              style={{ marginBottom: 0 }}
            >
              <Select
                showSearch
                allowClear
                placeholder="Chọn tài xế..."
                style={{ width: 280 }}
                optionFilterProp="label"
                loading={loading && !drivers.length}
              >
                {drivers.map((d) => (
                  <Option
                    key={d.driverId}
                    value={d.driverId}
                    label={`${d.fullName || d.userName || ""} (#${d.driverId})`}
                  >
                    {d.fullName || d.userName || "Không rõ tên"} (ID:{" "}
                    {d.driverId})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Áp dụng lọc
                </Button>
                <Button onClick={handleClearFilter} disabled={!filterDriverId}>
                  Xóa lọc
                </Button>
                <Button onClick={loadAllData} loading={loading}>
                  Tải lại dữ liệu
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>

        {/* TABLE */}
        <Table
          rowKey="ticketId"
          loading={loading}
          dataSource={filteredTickets}
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
      </Space>
    </Card>
  );
};

export default ManageSupportTicket;
