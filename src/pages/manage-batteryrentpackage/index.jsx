// src/pages/manage-batteryrentpackage/index.jsx
import React, { useEffect, useState } from "react";
import { Button, message } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import api from "../../config/axios";

import PackageHeader from "./PackageHeader";
import PackageTable from "./PackageTable";
import PackageModal from "./PackageModal";

const ManageBatteryRentPackage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/subscription-plans/all");
      const data = Array.isArray(res?.data?.result) ? res.data.result : [];
      setPlans(data);
    } catch {
      message.error("Không tải được danh sách gói thuê pin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormValues(null);
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.planId);
    setFormValues(record);
    setOpen(true);
  };

  const handleSubmit = async (payload) => {
    try {
      setLoading(true);

      if (editingId == null) {
        await api.post("/api/subscription-plans/create", payload);
        message.success("Tạo gói thuê pin thành công!");
      } else {
        await api.put(`/api/subscription-plans/update/${editingId}`, payload);
        message.success("Cập nhật gói thuê pin thành công!");
      }

      setOpen(false);
      await fetchPlans();
    } catch {
      message.error("Thao tác thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId) => {
    try {
      setLoading(true);
      await api.delete(`/api/subscription-plans/${planId}`);
      message.success("Đã vô hiệu hóa gói thuê pin!");
      await fetchPlans();
    } catch {
      message.error("Không thể vô hiệu hóa gói thuê pin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PackageHeader
        onCreate={openCreate}
        onReload={fetchPlans}
        loading={loading}
      />

      <PackageTable
        plans={plans}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <PackageModal
        open={open}
        loading={loading}
        editingId={editingId}
        formValues={formValues}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ManageBatteryRentPackage;
