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
} from "../../services/batteries";

const statusStyle = {
  FULL: { color: "green", text: "Đầy" },
  EMPTY: { color: "red", text: "Hết" },
  CHARGING: { color: "blue", text: "Đang sạc" },
  RESERVED: { color: "black", text: "Đã giữ chỗ" },
  FULLY_CHARGED: { color: "green", text: "Sạc đầy" },
  IN_USE: { color: "purple", text: "Đang sử dụng" },
  MAINTENANCE: { color: "orange", text: "Bảo dưỡng" },
  DAMAGED: { color: "error", text: "Hỏng" },
};

export default function ManageStockBattery() {
  const [formCreate] = useForm();
  const [formPatch] = useForm();

  const [openCreate, setOpenCreate] = useState(false);
  const [openPatch, setOpenPatch] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1); // antd 1-based
  const [pageSize, setPageSize] = useState(20);
  const [sorter, setSorter] = useState({
    field: "serialNumber",
    order: "ascend",
  });

  // Lưu pin đang chọn để patch
  const [currentBattery, setCurrentBattery] = useState(null);

  // thống kê nhanh
  const [stats, setStats] = useState({
    FULL: 0,
    CHARGING: 0,
    MAINTENANCE: 0,
    IN_USE: 0,
    EMPTY: 0,
  });
  const fetchData = async () => {
    setLoading(true);
    try {
      const sort =
        sorter?.field && sorter?.order
          ? `${sorter.field},${sorter.order === "ascend" ? "asc" : "desc"}`
          : "serialNumber,asc";

      const res = await getBatteries({
        page: page - 1,
        size: pageSize,
        sort,
      });

      const items = res?.content || [];
      setData(items);
      setTotal(res?.totalElements ?? items.length);

      const counts = {
        FULL: 0,
        CHARGING: 0,
        MAINTENANCE: 0,
        IN_USE: 0,
        EMPTY: 0,
      };

      items.forEach((b) => {
        switch (b.status) {
          case "FULL":
            counts.FULL++;
            break;
          case "CHARGING":
            counts.CHARGING++;
            break;
          case "MAINTENANCE":
            counts.MAINTENANCE++;
            break;
          case "IN_USE":
            counts.IN_USE++;
            break;
          case "EMPTY":
            counts.EMPTY++;
            break;
          default:
            break;
        }
      });

      setStats(counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sorter]);

  // Create battery (POST)
  const handleCreate = async (values) => {
    try {
      await createBatteryAtStation(values.stationId, values.status);
      message.success("Tạo pin thành công!");
      setOpenCreate(false);
      formCreate.resetFields();
      fetchData();
    } catch (e) {
      message.error(e?.response?.data?.message || "Tạo pin thất bại");
    }
  };

  // Patch status (PATCH)
  const handlePatch = async (values) => {
    try {
      await updateBatteryStatus(currentBattery.batteryId, values);
      message.success("Cập nhật trạng thái thành công!");
      setOpenPatch(false);
      formPatch.resetFields();
      setCurrentBattery(null);
      fetchData();
    } catch (e) {
      message.error(e?.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const columns = [
    {
      title: "Mã Pin (Serial)",
      dataIndex: "serialNumber",
      key: "serialNumber",
      sorter: true,
      render: (v) => v || "-",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      sorter: true,
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

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 pb-2">
          Quản Lý Tồn Kho Pin
        </h2>
      </div>

      {/* Thống kê nhanh */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {/* Pin Đầy - xanh lá */}
        <div
          style={{
            flex: 1,
            padding: 20,
            background: "#ecfdf5",
            borderRadius: 8,
            border: "1px solid #a7f3d0",
          }}
        >
          <div style={{ fontSize: 14, color: "#047857", marginBottom: 8 }}>
            Pin Đầy
          </div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#10b981" }}>
            {stats.FULL ?? 0}
          </div>
        </div>

        {/* Pin Đang Sạc - xanh lam nhạt như cũ */}
        <div
          style={{
            flex: 1,
            padding: 20,
            background: "#eff6ff",
            borderRadius: 8,
            border: "1px solid #bfdbfe",
          }}
        >
          <div style={{ fontSize: 14, color: "#1e40af", marginBottom: 8 }}>
            Pin Đang Sạc
          </div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#2563eb" }}>
            {stats.CHARGING ?? 0}
          </div>
        </div>

        {/* Pin Bảo Dưỡng - cam như cũ */}
        <div
          style={{
            flex: 1,
            padding: 20,
            background: "#fff7ed",
            borderRadius: 8,
            border: "1px solid #fed7aa",
          }}
        >
          <div style={{ fontSize: 14, color: "#c2410c", marginBottom: 8 }}>
            Pin Bảo Dưỡng
          </div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#ea580c" }}>
            {stats.MAINTENANCE ?? 0}
          </div>
        </div>

        {/* Pin Đang Sử Dụng - tím */}
        <div
          style={{
            flex: 1,
            padding: 20,
            background: "#f5f3ff",
            borderRadius: 8,
            border: "1px solid #ddd6fe",
          }}
        >
          <div style={{ fontSize: 14, color: "#5b21b6", marginBottom: 8 }}>
            Pin Đang Sử Dụng
          </div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#7c3aed" }}>
            {stats.IN_USE ?? 0}
          </div>
        </div>

        {/* Pin Hết - đỏ */}
        <div
          style={{
            flex: 1,
            padding: 20,
            background: "#fef2f2",
            borderRadius: 8,
            border: "1px solid #fecaca",
          }}
        >
          <div style={{ fontSize: 14, color: "#b91c1c", marginBottom: 8 }}>
            Pin Hết
          </div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#ef4444" }}>
            {stats.EMPTY ?? 0 /* hoặc đổi thành stats.DEPLETED tùy BE */}
          </div>
        </div>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setOpenCreate(true)}>
          Thêm pin mới
        </Button>
      </Space>

      <Table
        rowKey={(r) => String(r.batteryId)}
        loading={loading}
        dataSource={data}
        columns={columns}
        onChange={(pagination, _filters, sorterArg) => {
          if (!Array.isArray(sorterArg)) {
            setSorter({
              field: sorterArg.field || "serialNumber",
              order: sorterArg.order || "ascend",
            });
          }
          setPage(pagination.current);
          setPageSize(pagination.pageSize);
        }}
        pagination={{ current: page, pageSize, total, showSizeChanger: true }}
      />

      {/* Modal CREATE */}
      <Modal
        title="Thêm Pin Mới"
        open={openCreate}
        onCancel={() => setOpenCreate(false)}
        onOk={() => formCreate.submit()}
      >
        <Form form={formCreate} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="Station ID"
            name="stationId"
            rules={[{ required: true, message: "Vui lòng nhập Station ID" }]}
          >
            <Input type="number" placeholder="VD: 1" />
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
