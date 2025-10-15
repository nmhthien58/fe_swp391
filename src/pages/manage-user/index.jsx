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
} from "antd";
import { useForm } from "antd/es/form/Form";
import { toast } from "react-toastify";
import api from "../../config/axios";

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = useForm();

  // Phân trang (client-side vì /api/getDrivers không phân trang)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const columns = [
    { title: "Driver ID", dataIndex: "driverId", key: "driverId", width: 120 },
    { title: "Username", dataIndex: "userName", key: "userName" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Full Name", dataIndex: "fullName", key: "fullName" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Active" : "Inactive"}
        </Tag>
      ),
      width: 120,
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      render: (roles) =>
        Array.isArray(roles)
          ? roles.map((r, i) => (
              <Tag color="blue" key={i}>
                {r?.userType}
              </Tag>
            ))
          : null,
    },
    {
      title: "Action",
      key: "action",
      width: 200,
      render: (_, record) => (
        <>
          <Button
            type="primary"
            onClick={() => {
              setOpen(true);
              // map dữ liệu sang form
              form.setFieldsValue({
                driverId: record.driverId,
                userName: record.userName,
                email: record.email,
                fullName: record.fullName,
                status: !!record.status,
                role: record?.roles?.[0]?.userType || undefined,
                password: undefined, // không điền sẵn
              });
            }}
            style={{ marginRight: 8 }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete user?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.driverId)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  // ===== API =====
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/getDrivers");
      const list = res?.data?.result || []; // <-- đổi results -> result
      setUsers(list);
      setPagination((p) => ({ ...p, total: list.length }));
    } catch (err) {
      console.error("fetch users error:", err);
      toast.error("Không tải được danh sách user (cần quyền ADMIN?).");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleDelete = async (driverId) => {
    try {
      // Nếu BE có endpoint xóa, dùng dòng dưới:
      // await api.delete(`/api/deleteDriver/${driverId}`);
      // Tạm thời thông báo nếu BE chưa hỗ trợ:
      toast.error(
        "BE chưa cung cấp endpoint xóa driver. Bỏ nút nếu không cần."
      );
      // Sau khi có API xóa, bỏ dòng trên và bật 2 dòng dưới:
      // toast.success("Đã xóa user!");
      // fetchUsers();
    } catch (err) {
      console.error("delete user error:", err);
      toast.error("Xóa user thất bại.");
    }
  };

  const handleSubmitForm = async (values) => {
    const payload = {
      userName: values.userName?.trim(),
      email: values.email?.trim(),
      fullName: values.fullName?.trim(),
      status: Boolean(values.status),
    };
    // password là tùy chọn trong swagger; chỉ gửi khi người dùng nhập
    if (values.password && values.password.trim()) {
      payload.password = values.password.trim();
    }

    try {
      if (values.driverId) {
        // UPDATE
        await api.put(`/api/updateDriver/${values.driverId}`, payload);
        toast.success("Cập nhật user thành công!");
      } else {
        // CREATE (nếu BE có)
        // await api.post("/api/createDriver", { ...payload, password: values.password?.trim() });
        toast.error(
          "BE chưa cung cấp endpoint tạo user (/api/createDriver). Chỉ hỗ trợ Edit."
        );
      }

      setOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (err) {
      console.error("upsert user error:", err?.response?.data || err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Lưu user thất bại.";
      toast.error(msg);
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

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 pb-2">Manage User</h2>
      </div>

      <Button
        type="primary"
        onClick={() => {
          form.resetFields();
          setOpen(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Add user (Register)
      </Button>

      <Table
        columns={columns}
        dataSource={users}
        rowKey={(r) => r.driverId ?? r.id}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      <Modal
        title="Driver Information"
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
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
            label="Username"
            name="userName"
            rules={[
              { required: true, message: "Please input username!" },
              {
                min: 3,
                message: "Username must be at least 3 characters long!",
              },
            ]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>

          <Form.Item label="Password (optional)" name="password">
            <Input.Password placeholder="Enter new password (leave blank to keep current)" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: "Please input full name!" }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item label="Status" name="status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          {/* Vai trò: chỉ hiển thị để người dùng thấy; không gửi lên vì PUT không nhận role */}
          <Form.Item label="Role (read-only)" name="role">
            <Select disabled placeholder="Role from server">
              <Select.Option value="ADMIN">Admin</Select.Option>
              <Select.Option value="STAFF">Staff</Select.Option>
              <Select.Option value="DRIVER">Driver</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ManageUser;
