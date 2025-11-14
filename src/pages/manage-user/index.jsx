// src/pages/ManageUser.jsx
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
  Switch,
  InputNumber,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { toast } from "react-toastify";
import api from "../../config/axios";
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [form] = useForm();

  // ===== Modal assign staff =====
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm] = useForm();
  const [assigningUser, setAssigningUser] = useState(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Phân trang (client-side vì /api/getDrivers không phân trang)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ===== Cột bảng =====
  const columns = [
    {
      title: "Driver ID",
      dataIndex: "driverId",
      key: "driverId",
      width: 110,
    },
    {
      title: "Tên đăng nhập",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Đang hoạt động" : "Ngừng"}
        </Tag>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "roles",
      key: "roles",
      render: (roles) =>
        Array.isArray(roles)
          ? roles.map((r, i) => {
              const type = r?.userType;
              let color = "blue";
              if (type === "ADMIN") color = "red";
              if (type === "DRIVER") color = "green";
              if (type === "STAFF") color = "geekblue";
              return (
                <Tag color={color} key={i}>
                  {type}
                </Tag>
              );
            })
          : null,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 280,
      render: (_, record) => {
        const isStaff =
          Array.isArray(record.roles) &&
          record.roles.some((r) => r?.userType === "STAFF");

        return (
          <>
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setOpen(true);
                form.setFieldsValue({
                  driverId: record.driverId,
                  userName: record.userName,
                  email: record.email,
                  fullName: record.fullName,
                  status: !!record.status,
                  role: record?.roles?.[0]?.userType || "STAFF",
                  password: undefined,
                });
              }}
              style={{ marginRight: 8 }}
            >
              Sửa
            </Button>

            <Popconfirm
              title="Xóa tài khoản?"
              description="Bạn có chắc chắn muốn xóa tài khoản này?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.driverId)}
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>

            {isStaff && (
              <Button
                size="small"
                style={{ marginRight: 8 }}
                onClick={() => {
                  setAssigningUser(record);
                  assignForm.setFieldsValue({
                    driverId: record.driverId,
                    stationId: undefined,
                    workShift: "",
                    notes: "",
                    active: true,
                  });
                  setAssignOpen(true);
                }}
              >
                Assign Staff
              </Button>
            )}
          </>
        );
      },
    },
  ];

  // ===== API =====
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/getDrivers");
      const list = res?.data?.result || [];
      setUsers(list);
      setPagination((p) => ({ ...p, total: list.length }));
    } catch (err) {
      console.error("fetch users error:", err);
      toast.error("Không tải được danh sách tài khoản (cần quyền ADMIN?).");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleDelete = async (driverId) => {
    try {
      toast.error(
        "BE chưa cung cấp endpoint xóa driver. (Cần thêm API xóa để hoàn chỉnh)."
      );
    } catch (err) {
      console.error("delete user error:", err);
      toast.error("Xóa tài khoản thất bại.");
    }
  };

  const handleSubmitForm = async (values) => {
    const payload = {
      userName: values.userName?.trim(),
      email: values.email?.trim(),
      fullName: values.fullName?.trim(),
      status: Boolean(values.status),
    };

    const password = values.password?.trim();
    if (!values.driverId) {
      // TẠO STAFF MỚI → /api/admin/register?userRoleChoice=STAFF
      if (!password) {
        toast.error("Vui lòng nhập mật khẩu khi tạo Staff mới.");
        return;
      }
      payload.password = password;

      try {
        await api.post("/api/admin/register", payload, {
          params: { userRoleChoice: "STAFF" },
        });
        toast.success("Tạo tài khoản Staff thành công!");
        setOpen(false);
        form.resetFields();
        fetchUsers();
      } catch (err) {
        console.error("register staff error:", err?.response?.data || err);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Tạo Staff thất bại.";
        toast.error(msg);
      }
    } else {
      // CẬP NHẬT DRIVER/USER → /api/updateDriver/{driverId}
      if (password) {
        payload.password = password;
      }

      try {
        await api.put(`/api/updateDriver/${values.driverId}`, payload);
        toast.success("Cập nhật tài khoản thành công!");
        setOpen(false);
        form.resetFields();
        fetchUsers();
      } catch (err) {
        console.error("update user error:", err?.response?.data || err);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Cập nhật tài khoản thất bại.";
        toast.error(msg);
      }
    }
  };

  // ===== Submit assign staff =====
  const submitAssignStaff = async () => {
    try {
      const values = await assignForm.validateFields();
      setAssignSubmitting(true);

      await api.post("/api/admin/staff/assign", {
        driverId: values.driverId,
        stationId: values.stationId,
        workShift: values.workShift?.trim(),
        notes: values.notes?.trim(),
        active: Boolean(values.active),
      });

      toast.success("Gán Staff vào trạm thành công!");
      setAssignOpen(false);
      assignForm.resetFields();
    } catch (err) {
      if (err?.errorFields) {
        // lỗi validate form, không báo toast
        return;
      }
      console.error("assign staff error:", err?.response?.data || err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Gán Staff thất bại.";
      toast.error(msg);
    } finally {
      setAssignSubmitting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleTableChange = (pager) => {
    setPagination({
      ...pagination,
      current: pager.current,
      pageSize: pager.pageSize,
    });
  };

  // ===== UI =====
  return (
    <>
      {/* Header đẹp + tiếng Việt */}
      <div
        style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 12,
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(236,72,153,0.08))",
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
            Quản lý tài khoản người dùng
          </div>
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Xem danh sách tài khoản driver / staff, tạo mới Staff và gán Staff
            vào trạm làm việc.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              form.setFieldsValue({
                status: true,
                role: "STAFF",
              });
              setOpen(true);
            }}
            style={{
              fontWeight: 600,
              borderRadius: 8,
              boxShadow: "0 6px 16px rgba(59,130,246,0.35)",
            }}
          >
            Add Staff
          </Button>
        </div>
      </div>

      {/* Bảng danh sách */}
      <Table
        columns={columns}
        dataSource={users}
        rowKey={(r) => r.driverId ?? r.id}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Tổng cộng ${total} tài khoản`,
        }}
        onChange={handleTableChange}
        bordered
        size="middle"
      />

      {/* Modal tạo / sửa */}
      <Modal
        title={
          form.getFieldValue("driverId")
            ? "Cập nhật tài khoản"
            : "Tạo tài khoản Staff"
        }
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
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
          <Form.Item name="driverId" label="Driver ID" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Tên đăng nhập"
            name="userName"
            rules={[
              { required: true, message: "Vui lòng nhập tên đăng nhập" },
              {
                min: 3,
                message: "Tên đăng nhập phải tối thiểu 3 ký tự",
              },
            ]}
          >
            <Input placeholder="Nhập tên đăng nhập" />
          </Form.Item>

          <Form.Item
            label={
              form.getFieldValue("driverId")
                ? "Mật khẩu (nếu muốn đổi)"
                : "Mật khẩu"
            }
            name="password"
            rules={
              form.getFieldValue("driverId")
                ? []
                : [{ required: true, message: "Vui lòng nhập mật khẩu" }]
            }
          >
            <Input.Password
              placeholder={
                form.getFieldValue("driverId")
                  ? "Để trống nếu không muốn đổi mật khẩu"
                  : "Nhập mật khẩu"
              }
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            label="Họ tên"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập họ tên đầy đủ" }]}
          >
            <Input placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch
              checkedChildren="Đang hoạt động"
              unCheckedChildren="Ngừng"
            />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role"
            tooltip="Tạo mới luôn là STAFF (đặt qua query userRoleChoice=STAFF)"
          >
            <Select disabled placeholder="STAFF">
              <Select.Option value="ADMIN">ADMIN</Select.Option>
              <Select.Option value="STAFF">STAFF</Select.Option>
              <Select.Option value="DRIVER">DRIVER</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Assign Staff */}
      <Modal
        open={assignOpen}
        title={
          assigningUser
            ? `Assign Staff - ${
                assigningUser.fullName || assigningUser.userName
              }`
            : "Assign Staff"
        }
        onCancel={() => {
          setAssignOpen(false);
          assignForm.resetFields();
          setAssigningUser(null);
        }}
        onOk={submitAssignStaff}
        okText="Gán vào trạm"
        cancelText="Hủy"
        confirmLoading={assignSubmitting}
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            label="Driver ID"
            name="driverId"
            rules={[{ required: true, message: "Thiếu Driver ID" }]}
          >
            <InputNumber style={{ width: "100%" }} disabled />
          </Form.Item>

          <Form.Item
            label="Station ID"
            name="stationId"
            rules={[{ required: true, message: "Vui lòng nhập Station ID" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>

          <Form.Item
            label="Ca làm việc (workShift)"
            name="workShift"
            rules={[{ required: true, message: "Vui lòng nhập ca làm việc" }]}
          >
            <Input placeholder="Ca sáng, ca tối..." />
          </Form.Item>

          <Form.Item label="Ghi chú" name="notes">
            <Input.TextArea rows={3} placeholder="Ghi chú" />
          </Form.Item>

          <Form.Item
            label="Kích hoạt"
            name="active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Đang active" unCheckedChildren="Ngừng" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ManageUser;
