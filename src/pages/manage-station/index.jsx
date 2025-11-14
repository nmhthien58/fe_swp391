// src/pages/ManageStation.jsx
import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
  Empty,
  Space,
  Upload,
  Descriptions,
  Spin,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { toast } from "react-toastify";
import api from "../../config/axios";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";

const ManageStation = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [form] = useForm();

  // Phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ==== Expand batteries theo station ====
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [batteriesByStation, setBatteriesByStation] = useState({}); // { [stationId]: Battery[] }
  const [loadingBatteries, setLoadingBatteries] = useState({}); // { [stationId]: boolean }

  // ====== MODALS: History & Health cho battery ======
  const [activeBattery, setActiveBattery] = useState(null);

  // History
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);

  // Health
  const [healthOpen, setHealthOpen] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthData, setHealthData] = useState(null);

  // Helper: đếm số pin khả dụng
  const calcAvailable = (arr) => {
    if (!Array.isArray(arr)) return 0;
    const OK = new Set(["FULL", "FULLY_CHARGED", "AVAILABLE"]);
    return arr.reduce((n, b) => (OK.has(b?.status) ? n + 1 : n), 0);
  };

  // ======= API calls =======
  const fetchStations = async (
    page = pagination.current,
    size = pagination.pageSize,
    sorter
  ) => {
    setLoading(true);
    try {
      const params = { page: page - 1, size };
      if (sorter && sorter.field && sorter.order) {
        const dir = sorter.order === "ascend" ? "asc" : "desc";
        params.sort = `${sorter.field},${dir}`;
      }

      const res = await api.get("/api/stations", { params });
      const data = res.data || {};
      const content = data.content || [];
      const total = data.totalElements ?? content.length;

      const withAvail = content.map((st) => ({
        ...st,
        availableBatteries:
          st.availableBatteries ?? calcAvailable(st.batteries),
      }));

      setStations(withAvail);
      setPagination({
        current: (data.pageable?.pageNumber ?? 0) + 1,
        pageSize: data.pageable?.pageSize ?? size,
        total,
      });
    } catch (err) {
      console.error("Fetch stations error:", err);
      toast.error("Không tải được danh sách trạm (cần quyền admin?).");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stationId) => {
    try {
      await api.delete(`/api/stations/${stationId}`);
      toast.success("Đã xóa trạm thành công!");
      setExpandedRowKeys((prev) => prev.filter((k) => k !== stationId));
      fetchStations();
    } catch (err) {
      console.error("Delete station error:", err);
      toast.error("Xóa trạm thất bại.");
    }
  };

  // === Create/Update station ===
  const handleSubmitForm = async (values) => {
    const payload = {
      name: values.name?.trim(),
      address: values.address?.trim(),
      latitude: parseFloat(values.latitude),
      longitude: parseFloat(values.longitude),
      capacity: parseInt(values.capacity, 10),
      status: values.status,
    };

    if (
      Number.isNaN(payload.latitude) ||
      Number.isNaN(payload.longitude) ||
      Number.isNaN(payload.capacity)
    ) {
      toast.error("Vĩ độ, kinh độ hoặc sức chứa phải là số hợp lệ!");
      return;
    }

    try {
      if (values.stationId) {
        await api.put(`/api/stations/${values.stationId}`, {
          ...payload,
          imageUrl: undefined,
        });
        toast.success("Cập nhật trạm thành công!");
      } else {
        const fd = new FormData();
        const file = values.image?.[0]?.originFileObj;
        if (file) fd.append("image", file);

        await api.post("/api/stations/create", fd, {
          params: {
            name: payload.name,
            address: payload.address,
            latitude: payload.latitude,
            longitude: payload.longitude,
            capacity: payload.capacity,
            status: payload.status,
          },
        });

        toast.success("Tạo trạm mới thành công!");
      }

      setOpen(false);
      form.resetFields();
      fetchStations();
    } catch (err) {
      console.error("Upsert station error:", err.response?.data || err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Tạo / sửa trạm thất bại.";
      toast.error(msg);
    }
  };

  // Lazy load batteries cho 1 station
  const loadBatteriesForStation = async (station) => {
    const sid = station.stationId ?? station.id;
    if (!sid) return;
    if (Array.isArray(station.batteries)) {
      setBatteriesByStation((m) => ({ ...m, [sid]: station.batteries }));
      return;
    }
    if (Array.isArray(batteriesByStation[sid])) return;

    try {
      setLoadingBatteries((m) => ({ ...m, [sid]: true }));
      let batteries = [];
      try {
        const detail = await api.get(`/api/stations/${sid}`);
        const b1 = detail?.data?.batteries;
        if (Array.isArray(b1)) batteries = b1;
      } catch {
        /* ignore */
      }
      if (!batteries.length) {
        try {
          const bRes = await api.get(`/api/stations/${sid}/batteries`);
          const b2 = bRes?.data;
          if (Array.isArray(b2)) batteries = b2;
        } catch {
          /* ignore */
        }
      }
      setBatteriesByStation((m) => ({ ...m, [sid]: batteries }));
    } catch (e) {
      console.error("Load batteries error:", e);
      toast.error("Không tải được danh sách pin cho trạm này.");
      setBatteriesByStation((m) => ({ ...m, [sid]: [] }));
    } finally {
      setLoadingBatteries((m) => ({ ...m, [sid]: false }));
    }
  };

  // ======= HISTORY & HEALTH handlers =======
  const openBatteryHistory = async (battery) => {
    setActiveBattery(battery);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const id = battery.batteryId ?? battery.id;
      // eslint-disable-next-line no-unused-vars
      let rows = [];
      // /history trả về giống hình bạn gửi (content + pageable)
      const res = await api.get(`/api/batteries/${id}/history`);
      const raw = res?.data?.content || res?.data?.result || res?.data || [];

      const norm = (Array.isArray(raw) ? raw : []).map((x, i) => ({
        key: i,
        time: x.time || x.timestamp || x.createdAt || x.updatedAt,
        event: x.event || x.type || x.action || "",
        note: x.note || x.description || x.notes || "",
        stationId: x.stationId ?? x.station?.id ?? null,
        stationName: x.stationName || x.station?.name || "",
        raw: x,
      }));

      setHistoryRows(norm);
    } catch (e) {
      console.error(e);
      toast.error("Không tải được lịch sử sử dụng pin.");
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openBatteryHealth = async (battery) => {
    setActiveBattery(battery);
    setHealthOpen(true);
    setHealthLoading(true);
    try {
      const id = battery.batteryId ?? battery.id;
      const res = await api.get(`/api/batteries/${id}/health`);
      const data = res?.data?.result || res?.data || null;
      setHealthData(data);
    } catch (e) {
      console.error(e);
      toast.error("Không tải được thông tin sức khỏe pin.");
      setHealthData(null);
    } finally {
      setHealthLoading(false);
    }
  };

  // ======= Effects =======
  useEffect(() => {
    fetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableChange = (pager, _filters, sorter) => {
    setPagination({
      ...pagination,
      current: pager.current,
      pageSize: pager.pageSize,
    });
    fetchStations(pager.current, pager.pageSize, sorter);
  };

  const toggleExpand = async (record) => {
    const key = record.stationId ?? record.id;
    const isOpen = expandedRowKeys.includes(key);
    if (isOpen) {
      setExpandedRowKeys((prev) => prev.filter((k) => k !== key));
    } else {
      setExpandedRowKeys((prev) => [...prev, key]);
      await loadBatteriesForStation(record);
    }
  };

  // ======= Columns =======
  const batteryCols = [
    {
      title: "Mã pin",
      dataIndex: "batteryId",
      key: "batteryId",
      width: 90,
    },
    {
      title: "Mã serial",
      dataIndex: "serialNumber",
      key: "serialNumber",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const map = {
          FULL: "green",
          CHARGING: "blue",
          DAMAGED: "error",
          UNKNOWN: "default",
          AVAILABLE: "green",
          MAINTENANCE: "orange",
          IN_USE: "purple",
          EMPTY: "red",
          RESERVED: "black",
          FULLY_CHARGED: "green",
        };
        return <Tag color={map[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Dung lượng (Wh)",
      dataIndex: "capacityWh",
      key: "capacityWh",
      width: 130,
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      render: (v) => v || "-",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openBatteryHistory(record)}>
            Lịch sử
          </Button>
          <Button size="small" onClick={() => openBatteryHealth(record)}>
            Sức khỏe
          </Button>
        </Space>
      ),
    },
  ];

  const columns = [
    {
      title: "Tên trạm",
      dataIndex: "name",
      key: "name",
      render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    { title: "Địa chỉ", dataIndex: "address", key: "address" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const isActive = status === "ACTIVE";
        return (
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
          </Tag>
        );
      },
    },
    {
      title: "Sức chứa pin tối đa",
      dataIndex: "capacity",
      key: "capacity",
      width: 140,
    },
    {
      title: "Số pin khả dụng (FULL)",
      dataIndex: "availableBatteries",
      key: "availableBatteries",
      width: 170,
      render: (v) => (
        <span style={{ fontWeight: 600, color: "#16a34a" }}>{v ?? 0}</span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 260,
      render: (_, record) => {
        const key = record.stationId ?? record.id;
        const isOpen = expandedRowKeys.includes(key);
        return (
          <Space>
            <Button onClick={() => toggleExpand(record)}>
              {isOpen ? "Ẩn danh sách pin" : "Xem pin"}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setOpen(true);
                form.setFieldsValue({
                  stationId: record.stationId,
                  name: record.name,
                  address: record.address,
                  status: record.status,
                  capacity: record.capacity,
                  latitude: record.latitude,
                  longitude: record.longitude,
                  image: [],
                });
              }}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xóa trạm?"
              description="Bạn có chắc chắn muốn xóa trạm này?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.stationId)}
            >
              <Button danger>Xóa</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // ======= UI =======
  return (
    <>
      {/* Header đẹp hơn */}
      <div
        style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 12,
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.08))",
          border: "1px solid rgba(148,163,184,0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 4,
            }}
          >
            Quản lý trạm sạc & kho pin
          </div>
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Xem danh sách trạm, số lượng pin khả dụng và tra cứu lịch sử / sức
            khỏe từng pin.
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setOpen(true);
          }}
          style={{
            fontWeight: 600,
            boxShadow: "0 6px 16px rgba(37,99,235,0.25)",
          }}
        >
          Thêm trạm mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={stations}
        rowKey={(r) => r.stationId ?? r.id ?? r.key}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng ${total} trạm`,
        }}
        onChange={handleTableChange}
        bordered
        size="middle"
        expandable={{
          expandedRowKeys,
          onExpand: async (expanded, record) => {
            const key = record.stationId ?? record.id;
            if (expanded) {
              setExpandedRowKeys((prev) => [...prev, key]);
              await loadBatteriesForStation(record);
            } else {
              setExpandedRowKeys((prev) => prev.filter((k) => k !== key));
            }
          },
          expandedRowRender: (record) => {
            const sid = record.stationId ?? record.id;
            const loadingRow = !!loadingBatteries[sid];
            const list =
              batteriesByStation[sid] ??
              (Array.isArray(record.batteries) ? record.batteries : []);

            if (loadingRow)
              return (
                <div style={{ padding: 12, textAlign: "center" }}>
                  <Spin /> Đang tải danh sách pin…
                </div>
              );
            if (!list || list.length === 0) {
              return (
                <div style={{ padding: 12 }}>
                  <Empty description="Không có pin nào cho trạm này" />
                </div>
              );
            }
            return (
              <div
                style={{
                  background: "#f9fafb",
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <Table
                  columns={batteryCols}
                  dataSource={list}
                  rowKey={(r) => r.batteryId ?? r.id}
                  pagination={{ pageSize: 8 }}
                  size="small"
                  bordered
                />
              </div>
            );
          },
        }}
      />

      {/* Modal tạo/sửa station */}
      <Modal
        title="Thông tin trạm"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          labelCol={{ span: 24 }}
          form={form}
          onFinish={handleSubmitForm}
          preserve={false}
        >
          <Form.Item label="ID" name="stationId" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Tên trạm"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên trạm" },
              { min: 3, message: "Tên trạm phải tối thiểu 3 ký tự" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Địa chỉ"
            name="address"
            rules={[
              { required: true, message: "Vui lòng nhập địa chỉ" },
              { max: 200, message: "Địa chỉ không vượt quá 200 ký tự" },
            ]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="ACTIVE">Đang hoạt động</Select.Option>
              <Select.Option value="INACTIVE">Ngừng hoạt động</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Sức chứa pin tối đa"
            name="capacity"
            rules={[{ required: true, message: "Vui lòng nhập sức chứa pin" }]}
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            label="Vĩ độ (Latitude)"
            name="latitude"
            rules={[
              { required: true, message: "Vui lòng nhập vĩ độ" },
              {
                validator: (_, value) => {
                  const n = parseFloat(value);
                  if (Number.isNaN(n))
                    return Promise.reject("Vĩ độ phải là số");
                  if (n < -90 || n > 90)
                    return Promise.reject("Vĩ độ nằm trong khoảng -90 đến 90");
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="Ví dụ: 10.7626" />
          </Form.Item>

          <Form.Item
            label="Kinh độ (Longitude)"
            name="longitude"
            rules={[
              { required: true, message: "Vui lòng nhập kinh độ" },
              {
                validator: (_, value) => {
                  const n = parseFloat(value);
                  if (Number.isNaN(n))
                    return Promise.reject("Kinh độ phải là số");
                  if (n < -180 || n > 180)
                    return Promise.reject(
                      "Kinh độ nằm trong khoảng -180 đến 180"
                    );
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="Ví dụ: 106.6602" />
          </Form.Item>

          <Form.Item
            label="Ảnh trạm (tuỳ chọn)"
            name="image"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
            tooltip="Gửi dưới dạng multipart/form-data, field 'image'"
          >
            <Upload listType="picture" beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* ===== Modal: Battery History ===== */}
      <Modal
        open={historyOpen}
        title={
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            Lịch sử sử dụng pin{" "}
            <span style={{ color: "#1677ff" }}>
              {activeBattery?.serialNumber
                ? `- ${activeBattery.serialNumber}`
                : activeBattery?.batteryId
                ? `#${activeBattery.batteryId}`
                : ""}
            </span>
          </div>
        }
        footer={null}
        onCancel={() => setHistoryOpen(false)}
        width={860}
        bodyStyle={{ padding: "18px 22px" }}
      >
        {historyLoading ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : historyRows.length ? (
          <>
            {(() => {
              // đếm số lần pin chuyển sang trạng thái IN_USE
              const inUseCount = historyRows.filter((r) => {
                const s = `${r.event || ""} ${r.note || ""} ${
                  r.raw?.notes || r.raw?.status || ""
                }`.toUpperCase();
                return s.includes("IN_USE");
              }).length;

              return (
                <div
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 8,
                    background: "#fffbeb",
                    border: "1px solid #fed7aa",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#92400e" }}>
                    Tổng số lần đã sử dụng: {inUseCount}
                  </div>
                </div>
              );
            })()}

            <Table
              size="small"
              rowKey={(r, i) => r.key ?? i}
              columns={[
                {
                  title: "Thời điểm",
                  dataIndex: "time",
                  key: "time",
                  render: (t) =>
                    t ? new Date(t).toLocaleString("vi-VN") : "-",
                  width: 180,
                },
                {
                  title: "Hành động",
                  dataIndex: "event",
                  key: "event",
                  width: 140,
                },
                {
                  title: "Trạm",
                  dataIndex: "stationName",
                  key: "stationName",
                  width: 230,
                  render: (v, r) =>
                    v || (r.stationId ? `Trạm #${r.stationId}` : "-"),
                },
                {
                  title: "Ghi chú",
                  dataIndex: "note",
                  key: "note",
                  ellipsis: true,
                },
              ]}
              dataSource={historyRows}
              pagination={{ pageSize: 8 }}
              bordered
            />
          </>
        ) : (
          <Empty description="Chưa có lịch sử sử dụng" />
        )}
      </Modal>

      {/* ===== Modal: Battery Health ===== */}
      <Modal
        open={healthOpen}
        title={
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            Tình trạng sức khỏe pin{" "}
            <span style={{ color: "#16a34a" }}>
              {activeBattery?.serialNumber
                ? `- ${activeBattery.serialNumber}`
                : activeBattery?.batteryId
                ? `#${activeBattery.batteryId}`
                : ""}
            </span>
          </div>
        }
        footer={null}
        onCancel={() => setHealthOpen(false)}
        width={720}
        bodyStyle={{ padding: "18px 22px" }}
      >
        {healthLoading ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : healthData ? (
          <>
            {/* Khối số liệu nổi bật */}
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: 16,
                  borderRadius: 10,
                  background: "#ecfdf3",
                  border: "1px solid #bbf7d0",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#166534",
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  Độ khỏe pin (SOH)
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#16a34a",
                  }}
                >
                  {healthData.stateOfHealthPercent ?? "-"}%
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: 16,
                  borderRadius: 10,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#1d4ed8",
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  Tổng số lượt đổi pin
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#2563eb",
                  }}
                >
                  {healthData.totalSwapCount ?? "-"}
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: 16,
                  borderRadius: 10,
                  background: "#fef3c7",
                  border: "1px solid #fde68a",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#92400e",
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  Tình trạng hiện tại
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#b45309",
                  }}
                >
                  {healthData.currentCondition ?? "-"}
                </div>
              </div>
            </div>

            {/* Bảng mô tả chi tiết */}
            <Descriptions
              bordered
              size="small"
              column={2}
              labelStyle={{ width: 180 }}
            >
              <Descriptions.Item label="Tình trạng hiện tại">
                {healthData.currentCondition ??
                  healthData.status ??
                  activeBattery?.status ??
                  "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng số lượt đổi pin">
                {healthData.totalSwapCount ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Độ khỏe pin (SOH %)">
                {healthData.stateOfHealthPercent ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Dung lượng (Wh)">
                {healthData.capacityWh ?? activeBattery?.capacityWh ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Mức thoái hóa ước tính">
                {healthData.degradationRate ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="SOC trung bình khi trả về">
                {healthData.averageSoCOnReturn ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật gần nhất">
                {healthData.updatedAt
                  ? new Date(healthData.updatedAt).toLocaleString("vi-VN")
                  : "-"}
              </Descriptions.Item>
            </Descriptions>
          </>
        ) : (
          <Empty description="Không có dữ liệu sức khỏe pin" />
        )}
      </Modal>
    </>
  );
};

export default ManageStation;
