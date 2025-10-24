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
  typeof n === "number" ? n.toLocaleString("vi-VN") : n;

const dateVN = (s) => {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN");
};

const ManageBatteryRentPackage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null); // null = create, number = edit

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/subscription-plans/all");
      const data = Array.isArray(res?.data?.result) ? res.data.result : [];
      setPlans(data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách gói thuê.");
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
        toast.success("Tạo gói thuê thành công!");
      } else {
        await api.put(`/api/subscription-plans/update/${editingId}`, payload);
        toast.success("Cập nhật gói thuê thành công!");
      }
      // đóng modal + reset form + fetch lại danh sách
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
      await api.delete(`/api/subscription-plans/${planId}`); // Deactivate
      toast.success("Đã vô hiệu hóa gói thuê thành công!");
      await fetchPlans();
    } catch (err) {
      console.error(err);
      toast.error("Không thể vô hiệu hóa gói thuê.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Plan ID", dataIndex: "planId", key: "planId", width: 100 },
    { title: "Name", dataIndex: "name", key: "name", ellipsis: true },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Price (VND)",
      dataIndex: "price",
      key: "price",
      align: "right",
      width: 140,
      render: (v) => currencyVN(v),
    },
    {
      title: "Duration (days)",
      dataIndex: "durationDays",
      key: "durationDays",
      align: "center",
      width: 140,
      render: (v) => (v != null ? `${v}` : ""),
    },
    {
      title: "Swap limit",
      dataIndex: "swapLimit",
      key: "swapLimit",
      align: "center",
      width: 120,
      render: (v) => (v != null ? `${v}` : "—"),
    },
    {
      title: "Price / swap (VND)",
      dataIndex: "pricePerSwap",
      key: "pricePerSwap",
      align: "right",
      width: 170,
      render: (v) => currencyVN(v),
    },
    {
      title: "Extra swap (VND)",
      dataIndex: "pricePerExtraSwap",
      key: "pricePerExtraSwap",
      align: "right",
      width: 170,
      render: (v) => currencyVN(v),
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      width: 120,
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Created / Updated",
      key: "timestamps",
      width: 250,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span>Created: {dateVN(r.createdAt)}</span>
          <span>Updated: {dateVN(r.updatedAt)}</span>
        </Space>
      ),
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
            type="primary"
          >
            Edit
          </Button>
          <Popconfirm
            title="Deactivate plan?"
            description="Gói sẽ bị vô hiệu hóa (DELETE API)."
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record.planId)}
          >
            <Button icon={<DeleteOutlined />} danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-8">
        <h2 className="text-3xl font-bold text-gray-800 pb-2 m-0">
          Manage Battery Rent Package
        </h2>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Plan
          </Button>
        </Space>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={plans}
        rowKey="planId"
        bordered
        scroll={{ x: 1100 }}
      />

      <Modal
        title={
          editingId == null
            ? "Create Subscription Plan"
            : `Edit Plan #${editingId}`
        }
        open={open}
        onOk={() => form.submit()}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        destroyOnClose
        width={700}
        okText={editingId == null ? "Create" : "Save"}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={false}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên gói!" },
              { min: 2, message: "Tên tối thiểu 2 ký tự." },
            ]}
          >
            <Input placeholder="Ví dụ: Gói tháng 1" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
          >
            <Input.TextArea placeholder="Mô tả ngắn..." rows={3} />
          </Form.Item>

          <Form.Item
            label="Price (VND)"
            name="price"
            rules={[{ required: true, message: "Vui lòng nhập giá!" }]}
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
            label="Duration (days)"
            name="durationDays"
            rules={[{ required: true, message: "Vui lòng nhập số ngày!" }]}
          >
            <InputNumber min={1} className="w-full" placeholder="VD: 30" />
          </Form.Item>

          <Form.Item
            label="Swap limit"
            name="swapLimit"
            rules={[
              { required: true, message: "Vui lòng nhập giới hạn swap!" },
            ]}
          >
            <InputNumber min={0} className="w-full" placeholder="VD: 9" />
          </Form.Item>

          <Form.Item
            label="Price per swap (VND)"
            name="pricePerSwap"
            rules={[
              { required: true, message: "Vui lòng nhập giá mỗi lần swap!" },
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
            label="Extra swap price (VND)"
            name="pricePerExtraSwap"
            rules={[
              { required: true, message: "Vui lòng nhập giá swap thêm!" },
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
