// src/pages/manage-user/index.jsx
import React, { useEffect, useState } from "react";
import { Button, Form } from "antd";
import { useForm } from "antd/es/form/Form";
import { toast } from "react-toastify";
import api from "../../config/axios";
import { PlusOutlined } from "@ant-design/icons";

import UserHeader from "./UserHeader";
import UserTable from "./UserTable";
import UserFormModal from "./UserFormModal";
import AssignStaffModal from "./AssignStaffModal";

const ManageUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal tạo / sửa user
  const [open, setOpen] = useState(false);
  const [form] = useForm();

  // modal assign staff
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm] = useForm();
  const [assigningUser, setAssigningUser] = useState(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // phân trang client-side
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

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

    // tạo mới STAFF
    if (!values.driverId) {
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
      // cập nhật user
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

  // assign staff
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
        return; // lỗi validate form
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
    setPagination((prev) => ({
      ...prev,
      current: pager.current,
      pageSize: pager.pageSize,
    }));
  };

  // mở modal tạo mới
  const handleOpenCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      status: true,
      role: "STAFF",
    });
    setOpen(true);
  };

  // mở modal edit user
  const handleEditUser = (record) => {
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
  };

  // mở modal assign staff
  const handleAssignStaff = (record) => {
    setAssigningUser(record);
    assignForm.setFieldsValue({
      driverId: record.driverId,
      stationId: undefined,
      workShift: "",
      notes: "",
      active: true,
    });
    setAssignOpen(true);
  };

  return (
    <>
      <UserHeader
        onAddStaff={handleOpenCreate}
        addButton={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            style={{
              fontWeight: 600,
              borderRadius: 8,
              boxShadow: "0 6px 16px rgba(59,130,246,0.35)",
            }}
          >
            Add Staff
          </Button>
        }
      />

      <UserTable
        users={users}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        onEditUser={handleEditUser}
        onDeleteUser={handleDelete}
        onAssignStaff={handleAssignStaff}
      />

      <UserFormModal
        open={open}
        form={form}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        onFinish={handleSubmitForm}
      />

      <AssignStaffModal
        open={assignOpen}
        form={assignForm}
        assigningUser={assigningUser}
        submitting={assignSubmitting}
        onCancel={() => {
          setAssignOpen(false);
          assignForm.resetFields();
          setAssigningUser(null);
        }}
        onSubmit={submitAssignStaff}
      />
    </>
  );
};

export default ManageUser;
