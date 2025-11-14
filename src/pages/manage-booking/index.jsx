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
  Radio,
} from "antd";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarCircleOutlined,
  ToolOutlined,
  SearchOutlined,
  SwapOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { createBatteryAtStation } from "../../services/batteries";

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
  const [paySubmitting, setPaySubmitting] = useState(false); // loading nút OK pay

  // modal inspect
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectForm] = Form.useForm();
  const [inspectingSwap, setInspectingSwap] = useState(null);
  const [inspectSubmitting, setInspectSubmitting] = useState(false); // loading nút OK inspect

  // modal xem giao dịch completed gần nhất
  const [latestModalOpen, setLatestModalOpen] = useState(false);
  const [latestSwap, setLatestSwap] = useState(null);

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

  // ====== helper: swap completed gần nhất theo driver ======
  const getLatestCompletedSwapOfDriver = (driverId) => {
    if (driverId == null) return null;

    const target = String(driverId);
    const list = swaps.filter(
      (s) => s.status === "COMPLETED" && String(s.driverId) === target // so sánh theo string cho chắc
    );

    if (!list.length) return null;

    return list.reduce((latest, cur) => {
      const t1 = new Date(
        latest.completedAt || latest.updatedAt || latest.createdAt || 0
      ).getTime();
      const t2 = new Date(
        cur.completedAt || cur.updatedAt || cur.createdAt || 0
      ).getTime();
      return t2 > t1 ? cur : latest;
    });
  };

  const openLatestSwapModal = (driverId) => {
    const latest = getLatestCompletedSwapOfDriver(driverId);

    // luôn mở modal để user thấy có phản hồi
    setLatestSwap(latest);
    setLatestModalOpen(true);

    if (!latest) {
      message.info("Tài xế này chưa có giao dịch COMPLETED nào.");
    }
  };

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
      width: 220,
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
      width: 170,
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
      width: 260,
      render: (_, record) => (
        <Space>
          <Popconfirm
            title={`Xác nhận swap cho booking #${record.bookingId}?`}
            onConfirm={() => handleConfirmSwap(record)}
          >
            <Button type="primary" icon={<CheckCircleOutlined />} size="small">
              Confirm swap
            </Button>
          </Popconfirm>
          <Popconfirm
            title={`Hủy booking #${record.bookingId}?`}
            onConfirm={() => handleCancelBooking(record)}
          >
            <Button danger icon={<CloseCircleOutlined />} size="small">
              Hủy
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ====== 2. Swap đang thực hiện ======
  // swap đang thực hiện = status = CONFIRMED, PAID
  const activeSwaps = useMemo(
    () => swaps.filter((s) => ["CONFIRMED", "PAID"].includes(s.status)),
    [swaps]
  );

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

  // ====== summary numbers cho thanh thống kê ======
  const pendingCount = pendingBookings.length;
  const activeCount = activeSwaps.length;
  const completedCount = completedSwaps.length;

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
      setPaySubmitting(true);

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
      payForm.resetFields();
      fetchAll();
    } catch (e) {
      console.error(e);
      if (e?.errorFields) {
        // lỗi validate form
        return;
      }
      toast.error(e?.response?.data?.message || "Thanh toán thất bại.");
    } finally {
      setPaySubmitting(false);
    }
  };

  const openInspectModal = (swap) => {
    setInspectingSwap(swap);
    inspectForm.setFieldsValue({
      batterySource: "EXISTING",
      batteryId: swap.returnedBatteryId || 0,
      condition: "GOOD",
      socPercent: 0,
      notes: "",
    });
    setInspectModalOpen(true);
  };

  const submitInspect = async () => {
    try {
      setInspectSubmitting(true);

      const values = await inspectForm.validateFields();

      const { batterySource, batteryId: formBatteryId, ...rest } = values;
      let finalBatteryId = formBatteryId;

      // Nếu chọn Pin ngoài trạm -> tạo pin mới với status IN_USE
      if (batterySource === "EXTERNAL") {
        if (!inspectingSwap?.stationId) {
          message.error("Không xác định được trạm của swap.");
          return;
        }

        try {
          const created = await createBatteryAtStation(
            inspectingSwap.stationId,
            "IN_USE"
          );

          // tuỳ service trả về, lấy batteryId
          finalBatteryId =
            created?.batteryId || created?.data?.batteryId || null;

          if (!finalBatteryId) {
            message.error("Tạo pin mới thất bại (không lấy được batteryId).");
            return;
          }

          message.success(`Đã tạo pin mới #${finalBatteryId} (IN_USE).`);
        } catch (err) {
          console.error(err);
          message.error(
            err?.response?.data?.message || "Tạo pin mới thất bại."
          );
          return;
        }
      }

      const payload = {
        ...rest,
        batteryId: finalBatteryId,
      };

      await api.post(INSPECT_SWAP_URL(inspectingSwap.swapId), payload);
      message.success("Đã ghi nhận pin trả về");
      setInspectModalOpen(false);
      setInspectingSwap(null);
      inspectForm.resetFields();
      fetchAll();
    } catch (e) {
      console.error(e);
      if (e?.errorFields) {
        // lỗi validate form
        return;
      }
      message.error(
        e?.response?.data?.message || "Ghi nhận pin trả về thất bại."
      );
    } finally {
      setInspectSubmitting(false);
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
      width: 120,
      render: (v) => (v != null ? v : "-"),
    },

    {
      title: "Trạm",
      dataIndex: "stationId",
      key: "stationId",
      width: 220,
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
      width: 170,
      render: (iso) => fmtVN(iso),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 380,
      render: (_, record) => {
        const canPay = record.status === "CONFIRMED";
        const canInspect = record.status === "PAID";
        return (
          <Space wrap>
            <Button
              icon={<DollarCircleOutlined />}
              type="primary"
              onClick={() => openPayModal(record)}
              disabled={!canPay}
              size="small"
            >
              Pay
            </Button>
            <Button
              icon={<ToolOutlined />}
              onClick={() => openInspectModal(record)}
              disabled={!canInspect}
              size="small"
            >
              Inspect return
            </Button>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => openLatestSwapModal(record.driverId)}
              size="small"
              type="default"
            >
              Giao dịch gần nhất
            </Button>
          </Space>
        );
      },
    },
  ];

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
      width: 200,
      render: (id) => stationsMap.get(id) || `Trạm #${id}`,
    },
    {
      title: "Pin đã đổi",
      dataIndex: "reservedBatteryId",
      key: "reservedBatteryId",
      width: 120,
      render: (v) => (v != null ? v : "-"),
    },
    {
      title: "Pin trả về",
      dataIndex: "returnedBatteryId",
      key: "returnedBatteryId",
      width: 120,
      render: (v) => (v != null ? v : "-"),
    },
    {
      title: "Số tiền",
      dataIndex: "amountVnd",
      key: "amountVnd",
      width: 140,
      render: (v) => formatVnd(v),
    },
    {
      title: "Hoàn thành lúc",
      dataIndex: "completedAt",
      key: "completedAt",
      width: 190,
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
      style={{
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
        background:
          "linear-gradient(135deg, #f9fafb 0%, #eff6ff 40%, #ffffff 100%)",
      }}
      bodyStyle={{ padding: 20 }}
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Quản lý đổi pin
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Xác nhận booking, xử lý swap và theo dõi lịch sử giao dịch.
          </Text>
        </div>
      }
      extra={
        <Space>
          <Input
            allowClear
            placeholder="Tìm booking theo mã / trạm / tài xế…"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 280, borderRadius: 999 }}
            size="middle"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAll}
            loading={loading}
            type="default"
          >
            Làm mới
          </Button>
        </Space>
      }
    >
      {/* Thanh thống kê tổng quan */}
      <div
        style={{
          marginBottom: 16,
          padding: "10px 16px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid #e5e7eb",
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            background: "#eff6ff",
          }}
        >
          <Space direction="vertical" size={0}>
            <Space>
              <SwapOutlined />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Booking chờ xử lý
              </Text>
            </Space>
            <Text style={{ fontSize: 18, fontWeight: 700 }}>
              {pendingCount}
            </Text>
          </Space>
        </div>
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            background: "#ecfdf3",
          }}
        >
          <Space direction="vertical" size={0}>
            <Space>
              <DollarCircleOutlined />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Swap đang thực hiện
              </Text>
            </Space>
            <Text style={{ fontSize: 18, fontWeight: 700 }}>{activeCount}</Text>
          </Space>
        </div>
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            background: "#fef3c7",
          }}
        >
          <Space direction="vertical" size={0}>
            <Space>
              <HistoryOutlined />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Swap đã hoàn tất
              </Text>
            </Space>
            <Text style={{ fontSize: 18, fontWeight: 700 }}>
              {completedCount}
            </Text>
          </Space>
        </div>
      </div>

      <Tabs
        defaultActiveKey="pending"
        type="card"
        tabBarGutter={24}
        tabBarStyle={{ marginBottom: 12 }}
      >
        {/* TAB 1 */}
        <TabPane tab="1. Booking chờ xử lý" key="pending">
          <Table
            rowKey="bookingId"
            columns={bookingColumns}
            dataSource={pendingBookings}
            loading={loading}
            pagination={{ pageSize: 10, size: "small" }}
            size="middle"
            bordered={false}
          />
        </TabPane>

        {/* TAB 2 */}
        <TabPane tab="2. Swap đang thực hiện" key="active">
          <Table
            rowKey="swapId"
            columns={activeSwapColumns}
            dataSource={activeSwaps}
            loading={loading}
            pagination={{ pageSize: 10, size: "small" }}
            size="middle"
            bordered={false}
          />
        </TabPane>

        {/* TAB 3 */}
        <TabPane tab="3. Lịch sử" key="history">
          <Title level={5} style={{ marginTop: 4 }}>
            Swap đã hoàn tất
          </Title>
          <Table
            rowKey="swapId"
            columns={historySwapColumns}
            dataSource={completedSwaps}
            loading={loading}
            pagination={{ pageSize: 5, size: "small" }}
            size="middle"
            bordered={false}
            style={{ marginBottom: 24 }}
          />

          <Title level={5}>Booking đã hủy</Title>
          <Table
            rowKey="bookingId"
            columns={historyBookingColumns}
            dataSource={cancelledBookings}
            loading={loading}
            pagination={{ pageSize: 5, size: "small" }}
            size="middle"
            bordered={false}
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
        confirmLoading={paySubmitting}
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
        onCancel={() => {
          setInspectModalOpen(false);
          setInspectingSwap(null);
          inspectForm.resetFields();
        }}
        onOk={submitInspect}
        okText="Ghi nhận"
        confirmLoading={inspectSubmitting}
        destroyOnClose
      >
        <Form form={inspectForm} layout="vertical">
          {/* CHỌN NGUỒN PIN */}
          <Form.Item
            label="Nguồn pin trả về"
            name="batterySource"
            initialValue="EXISTING"
            rules={[{ required: true, message: "Chọn nguồn pin" }]}
          >
            <Radio.Group>
              <Radio value="EXISTING">Pin đã có trong trạm</Radio>
              <Radio value="EXTERNAL">Pin ngoài trạm</Radio>
            </Radio.Group>
          </Form.Item>

          {/* Battery ID: nếu Pin ngoài trạm thì disable + không required */}
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) =>
              prev.batterySource !== cur.batterySource
            }
          >
            {({ getFieldValue }) => {
              const isExternal = getFieldValue("batterySource") === "EXTERNAL";
              return (
                <Form.Item
                  label="Battery ID"
                  name="batteryId"
                  rules={
                    isExternal
                      ? []
                      : [{ required: true, message: "Nhập batteryId" }]
                  }
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    disabled={isExternal}
                  />
                </Form.Item>
              );
            }}
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

      {/* LATEST SWAP MODAL */}
      <Modal
        open={latestModalOpen}
        title="Giao dịch COMPLETED gần nhất của tài xế"
        onCancel={() => {
          setLatestModalOpen(false);
          setLatestSwap(null);
        }}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setLatestModalOpen(false);
              setLatestSwap(null);
            }}
          >
            Đóng
          </Button>,
        ]}
      >
        {latestSwap ? (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Text>
              <Text strong>Swap ID: </Text>#{latestSwap.swapId}
            </Text>
            <Text>
              <Text strong>ID pin đã đổi: </Text>
              {latestSwap.reservedBatteryId ?? "-"}
            </Text>
            <Text>
              <Text strong>Thời gian hoàn thành: </Text>
              {fmtVN(
                latestSwap.completedAt ||
                  latestSwap.updatedAt ||
                  latestSwap.createdAt
              )}
            </Text>
            <Text>
              <Text strong>Trạm: </Text>
              {stationsMap.get(latestSwap.stationId) ||
                `Trạm #${latestSwap.stationId}`}
            </Text>
          </Space>
        ) : (
          <Text>Tài xế này chưa có giao dịch COMPLETED nào.</Text>
        )}
      </Modal>
    </Card>
  );
}
