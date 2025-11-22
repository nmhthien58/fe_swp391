// src/pages/manage-support-ticket/SupportTicketFilterBar.jsx
import React, { useEffect } from "react";
import { Button, Empty, Form, Select } from "antd";

const { Option } = Select;

const SupportTicketFilterBar = ({
  drivers,
  loading,
  currentFilterDriverId,
  onApplyFilter,
  onClearFilter,
  onReload,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      driverId: currentFilterDriverId || undefined,
    });
  }, [currentFilterDriverId, form]);

  const handleFinish = (values) => {
    onApplyFilter(values.driverId || null);
  };

  const handleClear = () => {
    form.resetFields(["driverId"]);
    onClearFilter();
  };

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
      }}
    >
      <Form form={form} layout="inline" onFinish={handleFinish}>
        <Form.Item
          label="Lọc theo tài xế"
          name="driverId"
          style={{ marginBottom: 0 }}
        >
          <Select
            showSearch
            allowClear
            placeholder="Chọn tài xế..."
            style={{ width: 280 }}
            optionFilterProp="label"
            loading={loading && !drivers.length}
            notFoundContent={<Empty description="Không có tài xế" />}
          >
            {drivers.map((d) => (
              <Option
                key={d.driverId}
                value={d.driverId}
                label={`${d.fullName || d.userName || ""} (#${d.driverId})`}
              >
                {d.fullName || d.userName || "Không rõ tên"} (ID: {d.driverId})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            Áp dụng lọc
          </Button>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button onClick={handleClear} disabled={!currentFilterDriverId}>
            Xóa lọc
          </Button>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button onClick={onReload} loading={loading}>
            Tải lại dữ liệu
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SupportTicketFilterBar;
