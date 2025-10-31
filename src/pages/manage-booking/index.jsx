// src/pages/ManageBooking.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  message,
  Popconfirm,
  Input,
  Typography,
} from "antd";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import api from "../../config/axios";

dayjs.extend(utc);

const { Title, Text } = Typography;

const CONFIRM_URL = (id) => `/api/booking/${id}/confirm`;
const CANCEL_URL = (id) => `/api/booking/${id}/cancel`;

const fmtVN = (iso) =>
  iso ? dayjs(iso).add(7, "hour").format("DD/MM/YYYY HH:mm") : "-";

const statusColor = (s) =>
  ({
    PENDING: "default",
    CONFIRMED: "blue",
    ACTIVE: "processing",
    COMPLETED: "green",
    CANCELLED: "red",
    EXPIRED: "gold",
  }[s] || "default");

export default function ManageBooking() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [viewMode, setViewMode] = useState("pending"); // 'pending' | 'processed'

  const [stationsMap, setStationsMap] = useState(new Map());
  const [stationsLoading, setStationsLoading] = useState(false);

  const fetchStations = async () => {
    setStationsLoading(true);
    try {
      const res = await api.get("/api/stations/search", {
        params: { keyword: " " },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      const map = new Map(
        list.map((s) => [s.stationId, s.name || `Trạm #${s.stationId}`])
      );
      setStationsMap(map);
    } catch {
      setStationsMap(new Map());
    } finally {
      setStationsLoading(false);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/booking/view");
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);
    } catch (e) {
      console.error(e);
      message.error("Không tải được danh sách đặt lịch.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    fetchStations();
  }, []);

  const patchRow = (updated) =>
    setItems((prev) =>
      prev.map((x) => (x.bookingId === updated.bookingId ? updated : x))
    );

  const onConfirm = async (record) => {
    try {
      const res = await api.put(CONFIRM_URL(record.bookingId));
      patchRow(
        res?.data || { ...record, status: "CONFIRMED", confirmed: true }
      );
      message.success(`Đã xác nhận #${record.bookingId}`);
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Xác nhận thất bại.");
    }
  };

  const onCancel = async (record) => {
    try {
      const res = await api.put(CANCEL_URL(record.bookingId));
      patchRow(
        res?.data || { ...record, status: "CANCELLED", confirmed: false }
      );
      message.success(`Đã hủy #${record.bookingId}`);
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Hủy đặt lịch thất bại.");
    }
  };

  const searchFilter = (b) => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return true;
    const stationName = stationsMap.get(b.stationId) || "";
    const txt = `${b.bookingId} ${b.driverId} ${b.stationId} ${stationName} ${
      b.reservedBatteryId ?? ""
    } ${b.status || ""}`.toLowerCase();
    return txt.includes(kw);
  };

  const dataForView = useMemo(() => {
    let filtered = items.filter(searchFilter);
    if (viewMode === "pending") {
      filtered = filtered.filter((b) => b.status === "PENDING");
    } else {
      filtered = filtered.filter(
        (b) => b.status === "CONFIRMED" || b.status === "CANCELLED"
      );
    }
    // ✅ Mặc định sort ASCENDING theo bookingTime
    filtered.sort(
      (a, b) =>
        new Date(a.bookingTime ?? 0).getTime() -
        new Date(b.bookingTime ?? 0).getTime()
    );
    return filtered;
  }, [items, viewMode, keyword, stationsMap]);

  const stationCell = (stationId) => {
    const name = stationsMap.get(stationId);
    return (
      <div>
        <div style={{ fontWeight: 600 }}>
          {name || "—"}
          {stationsLoading && !name ? " (đang tải…)" : ""}
        </div>
        <div style={{ color: "#8c8c8c", fontSize: 12 }}>ID: {stationId}</div>
      </div>
    );
  };

  const actionCell = (record) => {
    const isConfirmed = record.status === "CONFIRMED";
    const isCancelled = record.status === "CANCELLED";
    const disableConfirm = isCancelled || isConfirmed || record.confirmed;
    const disableCancel = isCancelled || isConfirmed;
    return (
      <Space>
        <Popconfirm
          title={`Xác nhận lịch #${record.bookingId}?`}
          okText="Xác nhận"
          cancelText="Hủy"
          onConfirm={() => onConfirm(record)}
          disabled={disableConfirm}
        >
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            disabled={disableConfirm}
          >
            Xác nhận
          </Button>
        </Popconfirm>

        <Popconfirm
          title={`Hủy lịch #${record.bookingId}?`}
          okText="Hủy lịch"
          cancelText="Đóng"
          onConfirm={() => onCancel(record)}
          disabled={disableCancel}
        >
          <Button
            danger
            icon={<CloseCircleOutlined />}
            disabled={disableCancel}
            style={disableCancel ? { opacity: 0.4, cursor: "not-allowed" } : {}}
          >
            Hủy
          </Button>
        </Popconfirm>
      </Space>
    );
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "bookingId",
      key: "bookingId",
      width: 90,
      fixed: "left",
      sorter: (a, b) => a.bookingId - b.bookingId,
      render: (id) => <Text strong>#{id}</Text>,
    },
    { title: "Tài xế", dataIndex: "driverId", key: "driverId", width: 90 },
    {
      title: "Trạm",
      dataIndex: "stationId",
      key: "stationId",
      width: 220,
      render: stationCell,
    },
    {
      title: "Thời gian hẹn",
      dataIndex: "bookingTime",
      key: "bookingTime",
      width: 180,
      render: (iso) => fmtVN(iso),
      sorter: (a, b) =>
        new Date(a.bookingTime ?? 0).getTime() -
        new Date(b.bookingTime ?? 0).getTime(),
      defaultSortOrder: "ascend", // ✅ Mặc định ascending
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (s) => <Tag color={statusColor(s)}>{s || "—"}</Tag>,
    },
    ...(viewMode === "processed"
      ? [
          {
            title: "Đã xác nhận?",
            dataIndex: "confirmed",
            key: "confirmed",
            width: 120,
            render: (v) => (v ? <Tag color="green">YES</Tag> : <Tag>NO</Tag>),
          },
        ]
      : []),
    {
      title: "Thao tác",
      key: "actions",
      width: 210,
      fixed: "right",
      render: (_, record) => actionCell(record),
    },
  ];

  const tabBtn = (active) =>
    active
      ? { background: "#1677ff", color: "#fff" }
      : { background: "#f5f5f5", color: "#333" };

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 10 }}
      title={
        <Title level={4} style={{ margin: 0 }}>
          Quản lý đặt lịch
        </Title>
      }
      extra={
        <Space>
          <Input
            allowClear
            placeholder="Tìm theo mã, tài xế, tên trạm…"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 300 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchList();
              fetchStations();
            }}
            loading={loading || stationsLoading}
          >
            Làm mới
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <Button
          style={tabBtn(viewMode === "pending")}
          onClick={() => setViewMode("pending")}
        >
          Chưa xử lý
        </Button>
        <Button
          style={tabBtn(viewMode === "processed")}
          onClick={() => setViewMode("processed")}
        >
          Đã xử lý
        </Button>
      </div>

      <Table
        rowKey="bookingId"
        columns={columns}
        dataSource={dataForView}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        locale={{
          emptyText:
            viewMode === "pending"
              ? "Không có booking chờ xử lý"
              : "Chưa có booking đã xử lý",
        }}
      />
    </Card>
  );
}
