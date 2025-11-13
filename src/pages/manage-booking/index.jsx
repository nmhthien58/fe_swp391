// src/pages/ManageSwap.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Tabs,
  Table,
  Tag,
  Space,
  Button,
  message,
  Popconfirm,
  Input,
  Typography,
  Modal,
  Form,
  InputNumber,
  Select,
} from "antd";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarCircleOutlined,
  ToolOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import api from "../../config/axios";
import { toast } from "react-toastify";

dayjs.extend(utc);

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// API endpoints
const GET_BOOKINGS_URL = `/api/booking/view`;
const GET_SWAPS_URL = `/api/swaps`;
const CONFIRM_SWAP_URL = (bookingId) => `/api/swaps/${bookingId}/confirm`;
const CANCEL_BOOKING_URL = (bookingId) => `/api/booking/${bookingId}/cancel`;
const PAY_SWAP_URL = (swapId) => `/api/swaps/${swapId}/pay`;
const INSPECT_SWAP_URL = (swapId) => `/api/swaps/${swapId}/inspect-return`;

const fmtVN = (iso) =>
  iso ? dayjs(iso).add(7, "hour").format("DD/MM/YYYY HH:mm") : "-";

const formatVnd = (n) =>
  typeof n === "number"
    ? n.toLocaleString("vi-VN") + " đ"
    : n
    ? Number(n).toLocaleString("vi-VN") + " đ"
    : "-";

const bookingStatusTag = (s) => {
  const map = {
    PENDING: { color: "default", text: "PENDING" },
    CONFIRMED: { color: "blue", text: "CONFIRMED" },
    CANCELLED: { color: "red", text: "CANCELLED" },
  };
  const m = map[s] || { color: "default", text: s || "—" };
  return <Tag color={m.color}>{m.text}</Tag>;
};

const swapStatusTag = (s) => {
  const map = {
    PENDING: { color: "blue" },
    CONFIRMED: { color: "blue" },
    PAID: { color: "gold" },
    COMPLETED: { color: "green" },
  };
  const m = map[s] || { color: "default" };
  return <Tag color={m.color}>{s}</Tag>;
};

export default function ManageSwap() {
  // data
  const [bookings, setBookings] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [stationsMap, setStationsMap] = useState(new Map());

  // ui state
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  // modal pay
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payForm] = Form.useForm();
  const method = Form.useWatch("method", payForm);
  const [payingSwap, setPayingSwap] = useState(null);

  // modal inspect
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectForm] = Form.useForm();
  const [inspectingSwap, setInspectingSwap] = useState(null);

  // ===== fetch =====
  const fetchStations = async () => {
    try {
      const res = await api.get("/api/stations/search", {
        params: { keyword: " " },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      const map = new Map(
        list.map((s) => [s.stationId, s.name || `Trạm #${s.stationId}`])
      );
      setStationsMap(map);
    } catch (e) {
      console.error(e);
      setStationsMap(new Map());
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      // booking
      const resB = await api.get(GET_BOOKINGS_URL);
      setBookings(Array.isArray(resB.data) ? resB.data : []);

      // swaps (của bạn trả result.content)
      const resS = await api.get(GET_SWAPS_URL, {
        params: { page: 0, size: 50, sort: "createdAt,desc" },
      });
      const swapData = resS?.data?.result?.content ?? [];
      setSwaps(swapData);
    } catch (e) {
      console.error(e);
      message.error("Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchStations();
  }, []);

  // ====== 1. Booking chờ xử lý ======
  const pendingBookings = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return bookings
      .filter((b) => b.status === "PENDING")
      .filter((b) => {
        if (!kw) return true;
        const stationName = stationsMap.get(b.stationId) || "";
        const txt =
          `${b.bookingId} ${b.driverId} ${b.stationId} ${stationName}`.toLowerCase();
        return txt.includes(kw);
      })
      .sort(
        (a, b) =>
          new Date(a.bookingTime ?? 0).getTime() -
          new Date(b.bookingTime ?? 0).getTime()
      );
  }, [bookings, keyword, stationsMap]);

  const handleConfirmSwap = async (record) => {
    try {
      await api.post(CONFIRM_SWAP_URL(record.bookingId));
      message.success(`Đã xác nhận swap cho booking #${record.bookingId}`);
      fetchAll();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Xác nhận swap thất bại.");
    }
  };

  const handleCancelBooking = async (record) => {
    try {
      await api.put(CANCEL_BOOKING_URL(record.bookingId));
      message.success(`Đã hủy booking #${record.bookingId}`);
      fetchAll();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Hủy booking thất bại.");
    }
  };

  const bookingColumns = [
    {
      title: "Booking ID",
      dataIndex: "bookingId",
      key: "bookingId",
      width: 90,
      render: (id) => <Text strong>#{id}</Text>,
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
      width: 200,
      render: (id) => {
        const name = stationsMap.get(id);
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{name || `Trạm #${id}`}</div>
            <div style={{ fontSize: 12, color: "#999" }}>ID: {id}</div>
          </div>
        );
      },
    },
    {
      title: "Giờ hẹn",
      dataIndex: "bookingTime",
      key: "bookingTime",
      width: 160,
      render: (iso) => fmtVN(iso),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: bookingStatusTag,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 240,
      render: (_, record) => (
        <Space>
          <Popconfirm
            title={`Xác nhận swap cho booking #${record.bookingId}?`}
            onConfirm={() => handleConfirmSwap(record)}
          >
            <Button type="primary" icon={<CheckCircleOutlined />}>
              Confirm swap
            </Button>
          </Popconfirm>
          <Popconfirm
            title={`Hủy booking #${record.bookingId}?`}
            onConfirm={() => handleCancelBooking(record)}
          >
            <Button danger icon={<CloseCircleOutlined />}>
              Hủy
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ====== 2. Swap đang thực hiện ======
  // theo yêu cầu: swap đang thực hiện = status = CONFIRMED, PAID
  const activeSwaps = useMemo(
    () => swaps.filter((s) => ["CONFIRMED", "PAID"].includes(s.status)),
    [swaps]
  );

  const openPayModal = (swap) => {
    setPayingSwap(swap);
    payForm.setFieldsValue({
      method: "CASH",
      amountVnd: swap.amountVnd ?? 0,
    });
    setPayModalOpen(true);
  };

  const submitPay = async () => {
    try {
      const values = await payForm.validateFields();

      // Nếu chọn SUBSCRIPTION → override amountVnd & voucherId = 0
      let payload = { ...values };

      if (values.method === "SUBSCRIPTION") {
        payload.amountVnd = 0;
        payload.voucherId = 0;
      }

      await api.post(PAY_SWAP_URL(payingSwap.swapId), payload);

      toast.success("Thanh toán thành công");
      setPayModalOpen(false);
      setPayingSwap(null);
      fetchAll();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Thanh toán thất bại.");
    }
  };

  const openInspectModal = (swap) => {
    setInspectingSwap(swap);
    inspectForm.setFieldsValue({
      batteryId: swap.returnedBatteryId || 0,
      condition: "GOOD",
      socPercent: 0,
      notes: "",
    });
    setInspectModalOpen(true);
  };

  const submitInspect = async () => {
    try {
      const values = await inspectForm.validateFields();
      await api.post(INSPECT_SWAP_URL(inspectingSwap.swapId), values);
      message.success("Đã ghi nhận pin trả về");
      setInspectModalOpen(false);
      setInspectingSwap(null);
      fetchAll();
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Ghi nhận pin trả về thất bại."
      );
    }
  };

  const activeSwapColumns = [
    {
      title: "Swap ID",
      dataIndex: "swapId",
      key: "swapId",
      width: 80,
      render: (id) => <Text strong>#{id}</Text>,
    },
    {
      title: "Booking ID",
      dataIndex: "bookingId",
      key: "bookingId",
      width: 90,
    },
    {
      title: "Tài xế",
      dataIndex: "driverId",
      key: "driverId",
      width: 90,
    },
    {
      title: "ID Pin đã đặt",
      dataIndex: "reservedBatteryId",
      key: "reservedBatteryId",
      width: 110,
      render: (v) => (v != null ? v : "-"),
    },

    {
      title: "Trạm",
      dataIndex: "stationId",
      key: "stationId",
      width: 200,
      render: (id) => {
        const name = stationsMap.get(id);
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{name || `Trạm #${id}`}</div>
            <div style={{ fontSize: 12, color: "#999" }}>ID: {id}</div>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: swapStatusTag,
    },
    {
      title: "Tạo lúc",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (iso) => fmtVN(iso),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 240,
      render: (_, record) => {
        const canPay = record.status === "CONFIRMED";
        const canInspect = record.status === "PAID";
        return (
          <Space>
            <Button
              icon={<DollarCircleOutlined />}
              type="primary"
              onClick={() => openPayModal(record)}
              disabled={!canPay}
            >
              Pay
            </Button>
            <Button
              icon={<ToolOutlined />}
              onClick={() => openInspectModal(record)}
              disabled={!canInspect}
            >
              Inspect return
            </Button>
          </Space>
        );
      },
    },
  ];

  // ====== 3. Lịch sử ======
  const completedSwaps = swaps
    .filter((s) => s.status === "COMPLETED")
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? b.updatedAt ?? 0).getTime() -
        new Date(a.completedAt ?? a.updatedAt ?? 0).getTime()
    );

  const cancelledBookings = bookings
    .filter((b) => b.status === "CANCELLED")
    .sort(
      (a, b) =>
        new Date(b.bookingTime ?? 0).getTime() -
        new Date(a.bookingTime ?? 0).getTime()
    );

  const historySwapColumns = [
    {
      title: "Swap ID",
      dataIndex: "swapId",
      key: "swapId",
      width: 80,
      render: (id) => <Text strong>#{id}</Text>,
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
      width: 160,
      render: (id) => stationsMap.get(id) || `Trạm #${id}`,
    },
    {
      title: "Pin đã đổi",
      dataIndex: "reservedBatteryId",
      key: "reservedBatteryId",
      width: 110,
      render: (v) => (v != null ? v : "-"),
    },
    {
      title: "Pin trả về",
      dataIndex: "returnedBatteryId",
      key: "returnedBatteryId",
      width: 110,
      render: (v) => (v != null ? v : "-"),
    },
    {
      title: "Số tiền",
      dataIndex: "amountVnd",
      key: "amountVnd",
      width: 120,
      render: (v) => formatVnd(v),
    },
    {
      title: "Hoàn thành lúc",
      dataIndex: "completedAt",
      key: "completedAt",
      width: 180,
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
    <Card
      bordered={false}
      style={{ borderRadius: 10 }}
      title={<Title level={4}>Quản lý đổi pin</Title>}
      extra={
        <Space>
          <Input
            allowClear
            placeholder="Tìm booking theo mã / trạm / tài xế…"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 280 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAll}
            loading={loading}
          >
            Làm mới
          </Button>
        </Space>
      }
    >
      <Tabs defaultActiveKey="pending">
        {/* TAB 1 */}
        <TabPane tab="1. Booking chờ xử lý" key="pending">
          <Table
            rowKey="bookingId"
            columns={bookingColumns}
            dataSource={pendingBookings}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </TabPane>

        {/* TAB 2 */}
        <TabPane tab="2. Swap đang thực hiện" key="active">
          <Table
            rowKey="swapId"
            columns={activeSwapColumns}
            dataSource={activeSwaps}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </TabPane>

        {/* TAB 3 */}
        <TabPane tab="3. Lịch sử" key="history">
          <Title level={5}>Swap đã hoàn tất</Title>
          <Table
            rowKey="swapId"
            columns={historySwapColumns}
            dataSource={completedSwaps}
            loading={loading}
            pagination={{ pageSize: 5 }}
            style={{ marginBottom: 24 }}
          />

          <Title level={5}>Booking đã hủy</Title>
          <Table
            rowKey="bookingId"
            columns={historyBookingColumns}
            dataSource={cancelledBookings}
            loading={loading}
            pagination={{ pageSize: 5 }}
          />
        </TabPane>
      </Tabs>
      {/* PAY MODAL */}

      <Modal
        open={payModalOpen}
        title={`Thanh toán swap #${payingSwap?.swapId || ""}`}
        onCancel={() => setPayModalOpen(false)}
        onOk={submitPay}
        okText="Thanh toán"
        destroyOnClose
      >
        <Form form={payForm} layout="vertical">
          <Form.Item
            label="Phương thức"
            name="method"
            rules={[{ required: true, message: "Chọn phương thức" }]}
          >
            <Select
              options={[
                { value: "CASH", label: "CASH" },
                { value: "SUBSCRIPTION", label: "SUBSCRIPTION" },
              ]}
            />
          </Form.Item>

          {/* ẨN nếu là SUBSCRIPTION */}
          {method !== "SUBSCRIPTION" && (
            <Form.Item
              label="Số tiền (VND)"
              name="amountVnd"
              rules={[{ required: true, message: "Nhập số tiền" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          )}

          {method !== "SUBSCRIPTION" && (
            <Form.Item label="Mã giảm giá (ID)" name="voucherId">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          )}
        </Form>
      </Modal>
      {/* INSPECT MODAL */}
      <Modal
        open={inspectModalOpen}
        title={`Inspect return swap #${inspectingSwap?.swapId || ""}`}
        onCancel={() => setInspectModalOpen(false)}
        onOk={submitInspect}
        okText="Ghi nhận"
        destroyOnClose
      >
        <Form form={inspectForm} layout="vertical">
          <Form.Item
            label="Battery ID"
            name="batteryId"
            rules={[{ required: true, message: "Nhập batteryId" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Tình trạng"
            name="condition"
            rules={[{ required: true, message: "Chọn tình trạng" }]}
          >
            <Select
              options={[
                { value: "GOOD", label: "GOOD" },
                { value: "DEGRADED", label: "DEGRADED" },
                { value: "DAMAGED", label: "DAMAGED" },
              ]}
            />
          </Form.Item>
          <Form.Item label="SOC (%)" name="socPercent">
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Ghi chú" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
