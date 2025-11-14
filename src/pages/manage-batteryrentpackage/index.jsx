// src/pages/ManageBatteryRentPackage.jsx
import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  Input,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import api from "../../config/axios";

const currencyVN = (n) =>
  typeof n === "number" ? n.toLocaleString("vi-VN") + " đ" : n;

const dateVN = (s) => {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN");
};

const ManageBatteryRentPackage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null); // null = tạo mới, số = chỉnh sửa

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/subscription-plans/all");
      const data = Array.isArray(res?.data?.result) ? res.data.result : [];
      setPlans(data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách gói thuê pin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record?.planId);
    form.setFieldsValue({
      name: record?.name,
      description: record?.description,
      price: record?.price,
      durationDays: record?.durationDays,
      swapLimit: record?.swapLimit,
      pricePerSwap: record?.pricePerSwap,
      pricePerExtraSwap: record?.pricePerExtraSwap,
    });
    setOpen(true);
  };

  const handleSubmit = async (values) => {
    const payload = {
      name: values.name?.trim(),
      description: values.description?.trim(),
      price: Number(values.price),
      durationDays: Number(values.durationDays),
      swapLimit: Number(values.swapLimit),
      pricePerSwap: Number(values.pricePerSwap),
      pricePerExtraSwap: Number(values.pricePerExtraSwap),
    };

    try {
      setLoading(true);
      if (editingId == null) {
        await api.post("/api/subscription-plans/create", payload);
        toast.success("Tạo gói thuê pin thành công!");
      } else {
        await api.put(`/api/subscription-plans/update/${editingId}`, payload);
        toast.success("Cập nhật gói thuê pin thành công!");
      }
      setOpen(false);
      form.resetFields();
      await fetchPlans();
    } catch (err) {
      console.error(err);
      toast.error("Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId) => {
    try {
      setLoading(true);
      await api.delete(`/api/subscription-plans/${planId}`); // deactivate
      toast.success("Đã vô hiệu hóa gói thuê pin!");
      await fetchPlans();
    } catch (err) {
      console.error(err);
      toast.error("Không thể vô hiệu hóa gói thuê pin.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Mã gói", dataIndex: "planId", key: "planId", width: 90 },

    {
      title: "Tên gói",
      dataIndex: "name",
      key: "name",
      width: 240,
      ellipsis: true,
      render: (text) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 340,
      ellipsis: true,
      render: (text) => <Tooltip title={text}>{text}</Tooltip>,
    },
    {
      title: "Giá gói",
      dataIndex: "price",
      key: "price",
      align: "right",
      width: 130,
      render: (v) => currencyVN(v),
    },
    {
      title: "Thời hạn (ngày)",
      dataIndex: "durationDays",
      key: "durationDays",
      align: "center",
      width: 100,
      render: (v) => (v != null ? `${v}` : ""),
    },
    {
      title: "Giới hạn lượt swap",
      dataIndex: "swapLimit",
      key: "swapLimit",
      align: "center",
      width: 100,
      render: (v) => (v != null ? `${v}` : "Không giới hạn"),
    },
    {
      title: "Giá / lượt swap",
      dataIndex: "pricePerSwap",
      key: "pricePerSwap",
      align: "right",
      width: 120,
      render: (v) => currencyVN(v),
    },
    {
      title: "Giá lượt vượt",
      dataIndex: "pricePerExtraSwap",
      key: "pricePerExtraSwap",
      align: "right",
      width: 120,
      render: (v) => currencyVN(v),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      width: 120,
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Đang bán" : "Đã vô hiệu hóa"}
        </Tag>
      ),
    },
    {
      title: "Thời gian tạo / cập nhật",
      key: "timestamps",
      width: 260,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Tạo: {dateVN(r.createdAt)}
          </span>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Cập nhật: {dateVN(r.updatedAt)}
          </span>
        </Space>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 190,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
            type="primary"
            size="small"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Vô hiệu hóa gói thuê?"
            description="Gói sẽ bị vô hiệu hóa và không thể đăng ký mới."
            okText="Vô hiệu hóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.planId)}
          >
            <Button icon={<DeleteOutlined />} danger size="small">
              Vô hiệu hóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header đẹp + tiếng Việt */}
      <div
        style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 12,
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(45,212,191,0.08))",
          border: "1px solid rgba(148,163,184,0.35)",
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
            Quản lý gói thuê pin
          </div>
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Tạo, chỉnh sửa và vô hiệu hóa các gói thuê pin theo tháng / số lượt
            swap.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            style={{
              fontWeight: 600,
              borderRadius: 8,
              boxShadow: "0 6px 16px rgba(59,130,246,0.35)",
            }}
          >
            Thêm gói thuê
          </Button>
        </div>
      </div>

      {/* Bảng danh sách gói */}
      <Table
        loading={loading}
        columns={columns}
        dataSource={plans}
        rowKey="planId"
        bordered
        size="middle"
        scroll={{ x: 1100 }}
      />

      {/* Modal tạo / sửa gói */}
      <Modal
        title={
          editingId == null
            ? "Tạo gói thuê pin"
            : `Chỉnh sửa gói thuê #${editingId}`
        }
        open={open}
        onOk={() => form.submit()}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        destroyOnClose
        width={700}
        okText={editingId == null ? "Tạo gói" : "Lưu thay đổi"}
        cancelText="Hủy"
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={false}
        >
          <Form.Item
            label="Tên gói"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên gói!" },
              { min: 2, message: "Tên gói phải tối thiểu 2 ký tự." },
            ]}
          >
            <Input placeholder="Ví dụ: Gói tháng 1, Gói Premium..." />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
          >
            <Input.TextArea placeholder="Mô tả ngắn về gói thuê..." rows={3} />
          </Form.Item>

          <Form.Item
            label="Giá gói (VND)"
            name="price"
            rules={[{ required: true, message: "Vui lòng nhập giá gói!" }]}
          >
            <InputNumber
              min={0}
              className="w-full"
              placeholder="VD: 300000"
              formatter={(v) =>
                v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""
              }
              parser={(v) => v?.replace(/\./g, "")}
            />
          </Form.Item>

          <Form.Item
            label="Thời hạn (ngày)"
            name="durationDays"
            rules={[{ required: true, message: "Vui lòng nhập số ngày!" }]}
          >
            <InputNumber min={1} className="w-full" placeholder="VD: 30" />
          </Form.Item>

          <Form.Item
            label="Giới hạn lượt swap"
            name="swapLimit"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập giới hạn lượt swap!",
              },
            ]}
          >
            <InputNumber
              min={0}
              className="w-full"
              placeholder="VD: 9 (0 = không giới hạn)"
            />
          </Form.Item>

          <Form.Item
            label="Giá mỗi lượt swap (VND)"
            name="pricePerSwap"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập giá mỗi lượt swap!",
              },
            ]}
          >
            <InputNumber
              min={0}
              className="w-full"
              placeholder="VD: 10000"
              formatter={(v) =>
                v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""
              }
              parser={(v) => v?.replace(/\./g, "")}
            />
          </Form.Item>

          <Form.Item
            label="Giá cho mỗi lượt swap thêm (VND)"
            name="pricePerExtraSwap"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập giá swap thêm!",
              },
            ]}
          >
            <InputNumber
              min={0}
              className="w-full"
              placeholder="VD: 5000"
              formatter={(v) =>
                v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""
              }
              parser={(v) => v?.replace(/\./g, "")}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageBatteryRentPackage;
