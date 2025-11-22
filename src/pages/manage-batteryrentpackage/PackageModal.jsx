// src/pages/manage-batteryrentpackage/PackageModal.jsx
import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber } from "antd";

const PackageModal = ({
  open,
  loading,
  editingId,
  formValues,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (formValues) {
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
    }
  }, [formValues]);

  const handleFinish = (v) => {
    const payload = {
      name: v.name?.trim(),
      description: v.description?.trim(),
      price: Number(v.price),
      durationDays: Number(v.durationDays),
      swapLimit: Number(v.swapLimit),
      pricePerSwap: Number(v.pricePerSwap),
      pricePerExtraSwap: Number(v.pricePerExtraSwap),
    };
    onSubmit(payload);
  };

  return (
    <Modal
      title={
        editingId ? `Chỉnh sửa gói thuê #${editingId}` : "Tạo gói thuê pin"
      }
      open={open}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnClose
      okText={editingId ? "Lưu thay đổi" : "Tạo gói"}
      cancelText="Hủy"
      confirmLoading={loading}
      width={700}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Tên gói" name="name" rules={[{ required: true }]}>
          <Input placeholder="Tên gói..." />
        </Form.Item>

        <Form.Item
          label="Mô tả"
          name="description"
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={3} placeholder="Mô tả..." />
        </Form.Item>

        <Form.Item
          label="Giá gói (VND)"
          name="price"
          rules={[{ required: true }]}
        >
          <InputNumber className="w-full" min={0} placeholder="300000" />
        </Form.Item>

        <Form.Item
          label="Thời hạn (ngày)"
          name="durationDays"
          rules={[{ required: true }]}
        >
          <InputNumber className="w-full" min={1} placeholder="30" />
        </Form.Item>

        <Form.Item
          label="Giới hạn lượt swap"
          name="swapLimit"
          rules={[{ required: true }]}
        >
          <InputNumber
            className="w-full"
            min={0}
            placeholder="0 = không giới hạn"
          />
        </Form.Item>

        <Form.Item
          label="Giá mỗi lượt swap"
          name="pricePerSwap"
          rules={[{ required: true }]}
        >
          <InputNumber className="w-full" min={0} placeholder="10000" />
        </Form.Item>

        <Form.Item
          label="Giá cho mỗi lượt swap thêm"
          name="pricePerExtraSwap"
          rules={[{ required: true }]}
        >
          <InputNumber className="w-full" min={0} placeholder="5000" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PackageModal;
