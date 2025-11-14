// src/pages/ManageStockBattery.jsx
import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  message,
  Space,
} from "antd";
import { useForm } from "antd/es/form/Form";
import {
  getBatteries,
  createBatteryAtStation,
  updateBatteryStatus,
  BATTERY_STATUS,
  getBatteriesByStationId,
} from "../../services/batteries";
import api from "../../config/axios";

const statusStyle = {
  FULL: { color: "green", text: "Đầy" },
  AVAILABLE: { color: "cyan", text: "Sẵn sàng" }, // AVAILABLE
  EMPTY: { color: "red", text: "Hết" },
  CHARGING: { color: "blue", text: "Đang sạc" },
  RESERVED: { color: "black", text: "Đã giữ chỗ" },
  FULLY_CHARGED: { color: "green", text: "Sạc đầy" },
  IN_USE: { color: "purple", text: "Đang sử dụng" },
  MAINTENANCE: { color: "orange", text: "Bảo dưỡng" },
  DAMAGED: { color: "error", text: "Hỏng" },
};

// số lượng pin lấy từ API mỗi lần
const API_PAGE_SIZE = 50;
// số lượng pin hiển thị trên table mỗi trang
const UI_PAGE_SIZE = 7;

export default function ManageStockBattery() {
  const [formCreate] = useForm();
  const [formPatch] = useForm();

  const [openCreate, setOpenCreate] = useState(false);
  const [openPatch, setOpenPatch] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [total, setTotal] = useState(0);

  // phân trang trên UI (Table)
  const [page, setPage] = useState(1);

  const [currentBattery, setCurrentBattery] = useState(null);

  const [stats, setStats] = useState({
    FULL: 0,
    AVAILABLE: 0,
    CHARGING: 0,
    MAINTENANCE: 0,
    IN_USE: 0,
    EMPTY: 0,
  });

  // ====== station dropdown ======
  const [stationQuery, setStationQuery] = useState("");
  const [isStationMode, setIsStationMode] = useState(false);
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);

  const applyStats = (items) => {
    const counts = {
      FULL: 0,
      AVAILABLE: 0,
      CHARGING: 0,
      MAINTENANCE: 0,
      IN_USE: 0,
      EMPTY: 0,
    };
    items.forEach((b) => {
      if (counts[b.status] !== undefined) counts[b.status] += 1;
    });
    setStats(counts);
  };

  // ====== FETCH PIN (mặc định 50 / page từ API, chỉ gọi 1 lần) ======
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getBatteries({
        page: 0,
        size: API_PAGE_SIZE,
      });

      const items = res?.content || [];
      setData(items);
      setTotal(res?.totalElements ?? items.length);
      applyStats(items);
      setPage(1); // reset về trang 1
    } finally {
      setLoading(false);
    }
  };

  // lấy danh sách trạm cho dropdown
  const fetchStations = async () => {
    setLoadingStations(true);
    try {
      const res = await api.get("/api/stations/search", {
        params: { keyword: " " },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setStations(list);
    } catch (e) {
      console.error(e);
      message.error("Không tải được danh sách trạm");
      setStations([]);
    } finally {
      setLoadingStations(false);
    }
  };

  useEffect(() => {
    fetchData(); // 🔹 gọi 1 lần khi mount
    fetchStations();
  }, []);

  const handleCreate = async (values) => {
    try {
      await createBatteryAtStation(values.stationId, values.status);
      message.success("Tạo pin thành công!");
      setOpenCreate(false);
      formCreate.resetFields();
      fetchData(); // reload
    } catch (e) {
      message.error(e?.response?.data?.message || "Tạo pin thất bại");
    }
  };

  const handlePatch = async (values) => {
    try {
      await updateBatteryStatus(currentBattery.batteryId, values);
      message.success("Cập nhật trạng thái thành công!");
      setOpenPatch(false);
      formPatch.resetFields();
      setCurrentBattery(null);
      fetchData(); // reload
    } catch (e) {
      message.error(e?.response?.data?.message || "Cập nhật thất bại");
    }
  };

  // ====================== Lọc theo trạm ======================
  const handleSearchByStation = async () => {
    if (!stationQuery) {
      return message.warning("Vui lòng chọn trạm");
    }
    setLoading(true);
    try {
      const list = await getBatteriesByStationId(stationQuery);
      setIsStationMode(true);
      setData(list);
      setTotal(list.length);
      applyStats(list);
      setPage(1);

      const station = stations.find((s) => s.stationId === stationQuery);
      const stationName =
        station?.name || `Trạm #${stationQuery ?? ""}` || "trạm đã chọn";

      message.success(`Đã tải ${list.length} pin của ${stationName}`);
    } catch (e) {
      message.error(
        e?.response?.data?.message || "Không thể tải danh sách pin theo trạm"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearStationFilter = async () => {
    setStationQuery("");
    setIsStationMode(false);
    fetchData();
  };
  // ==============================================================

  const columns = [
    {
      title: "Mã Pin (Serial)",
      dataIndex: "serialNumber",
      key: "serialNumber",
      sorter: true, // sort client-side, không gọi API
      render: (v) => v || "-",
    },
    {
      title: "Dung lượng (Wh)",
      dataIndex: "capacityWh",
      key: "capacityWh",
      sorter: true,
      render: (v) => (v ?? v === 0 ? v : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      filters: BATTERY_STATUS.map((s) => ({
        text: statusStyle[s]?.text || s,
        value: s,
      })),
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const cfg = statusStyle[status] || {
          color: "default",
          text: status || "-",
        };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setCurrentBattery(record);
              setOpenPatch(true);
              formPatch.setFieldsValue({
                status: record.status,
                reason: "",
                adminOverride: true,
              });
            }}
          >
            Cập nhật
          </Button>
        </Space>
      ),
    },
  ];

  // ============ STYLE helper ============
  const statCard = (bg, border) => ({
    flex: 1,
    padding: 18,
    background: bg,
    borderRadius: 12,
    border: `1px solid ${border}`,
    boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    justifyContent: "space-between",
    minWidth: 160,
  });

  return (
    <>
      {/* Header */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              color: "#111827",
            }}
          >
            Quản lý tồn kho pin
          </h2>
          <p
            style={{
              margin: 0,
              marginTop: 4,
              color: "#6b7280",
              fontSize: 13,
            }}
          >
            Theo dõi trạng thái pin tại các trạm và cập nhật nhanh.
          </p>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={statCard("#ecfdf5", "#a7f3d0")}>
          <div style={{ fontSize: 13, color: "#047857" }}>Pin Đầy</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#10b981" }}>
            {stats.FULL ?? 0}
          </div>
        </div>

        <div style={statCard("#e0f2fe", "#bae6fd")}>
          <div style={{ fontSize: 13, color: "#0369a1" }}>Pin Available</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#0891b2" }}>
            {stats.AVAILABLE ?? 0}
          </div>
        </div>

        <div style={statCard("#eff6ff", "#bfdbfe")}>
          <div style={{ fontSize: 13, color: "#1e40af" }}>Pin Đang Sạc</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#2563eb" }}>
            {stats.CHARGING ?? 0}
          </div>
        </div>

        <div style={statCard("#f5f3ff", "#ddd6fe")}>
          <div style={{ fontSize: 13, color: "#5b21b6" }}>Pin Đang Sử Dụng</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#7c3aed" }}>
            {stats.IN_USE ?? 0}
          </div>
        </div>

        <div style={statCard("#fff7ed", "#fed7aa")}>
          <div style={{ fontSize: 13, color: "#c2410c" }}>Pin Bảo Dưỡng</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#ea580c" }}>
            {stats.MAINTENANCE ?? 0}
          </div>
        </div>

        <div style={statCard("#fef2f2", "#fecaca")}>
          <div style={{ fontSize: 13, color: "#b91c1c" }}>Pin Hết</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#ef4444" }}>
            {stats.EMPTY ?? 0}
          </div>
        </div>
      </div>

      {/* Thanh điều khiển */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          padding: "10px 12px",
          borderRadius: 12,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
        }}
      >
        <Button type="primary" onClick={() => setOpenCreate(true)}>
          Thêm pin mới
        </Button>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Select
            showSearch
            placeholder="Chọn trạm…"
            style={{ width: 260 }}
            loading={loadingStations}
            allowClear
            optionFilterProp="label"
            value={stationQuery || undefined}
            onChange={(value) => setStationQuery(value || "")}
            options={stations.map((s) => ({
              value: s.stationId,
              label: `${s.name || `Trạm #${s.stationId}`} (ID: ${s.stationId})`,
            }))}
          />
          <Button onClick={handleSearchByStation}>Tìm theo trạm</Button>
          {isStationMode && (
            <Button onClick={handleClearStationFilter}>Xóa lọc</Button>
          )}
        </div>
      </div>

      {/* Bảng pin */}
      <Table
        rowKey={(r) => String(r.batteryId)}
        loading={loading}
        dataSource={data}
        columns={columns}
        // eslint-disable-next-line no-unused-vars
        onChange={(pagination, _filters, _sorterArg) => {
          // chỉ update page UI, không đụng tới sorter → không gọi API lại
          setPage(pagination.current);
        }}
        pagination={{
          current: page,
          pageSize: UI_PAGE_SIZE,
          total: data.length,
          showSizeChanger: false,
        }}
      />

      {/* Modal CREATE */}
      <Modal
        title="Thêm Pin Mới"
        open={openCreate}
        onCancel={() => setOpenCreate(false)}
        onOk={() => formCreate.submit()}
        okText="Tạo"
      >
        <Form form={formCreate} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="Trạm"
            name="stationId"
            rules={[{ required: true, message: "Vui lòng chọn trạm" }]}
          >
            <Select
              showSearch
              placeholder="Chọn trạm"
              loading={loadingStations}
              optionFilterProp="label"
              options={stations.map((s) => ({
                value: s.stationId,
                label: `${s.name || `Trạm #${s.stationId}`} (ID: ${
                  s.stationId
                })`,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Vui lòng chọn Status" }]}
          >
            <Select placeholder="Chọn status">
              {BATTERY_STATUS.map((s) => (
                <Select.Option key={s} value={s}>
                  {statusStyle[s]?.text || s}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal PATCH STATUS */}
      <Modal
        title={
          currentBattery
            ? `Đổi trạng thái: ${currentBattery.serialNumber}`
            : "Đổi trạng thái pin"
        }
        open={openPatch}
        onCancel={() => {
          setOpenPatch(false);
          setCurrentBattery(null);
        }}
        onOk={() => formPatch.submit()}
        okText="Lưu"
      >
        <Form form={formPatch} layout="vertical" onFinish={handlePatch}>
          <Form.Item
            label="Trạng thái mới"
            name="status"
            rules={[{ required: true, message: "Chọn trạng thái" }]}
          >
            <Select placeholder="Chọn status">
              {BATTERY_STATUS.map((s) => (
                <Select.Option key={s} value={s}>
                  {statusStyle[s]?.text || s}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Lý do (tuỳ chọn)" name="reason">
            <Input.TextArea placeholder="Nhập lý do thay đổi..." rows={3} />
          </Form.Item>

          <Form.Item
            name="adminOverride"
            valuePropName="checked"
            initialValue={true}
          >
            <Checkbox>Admin override</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
