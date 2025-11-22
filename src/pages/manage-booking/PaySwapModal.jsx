// src/pages/manage-booking/PaySwapModal.jsx
import React, { useEffect } from "react";
import { Modal, Form, Select, InputNumber } from "antd";

const PaySwapModal = ({ open, swap, loading, onCancel, onSubmit }) => {
  const [form] = Form.useForm();
  const method = Form.useWatch("method", form);

  useEffect(() => {
    if (open && swap) {
      form.setFieldsValue({
        method: "CASH",
        amountVnd: swap.amountVnd ?? 0,
        voucherId: undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, swap, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch {
      // validate lỗi thì thôi
    }
  };

  return (
    <Modal
      open={open}
      title={`Thanh toán swap #${swap?.swapId || ""}`}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Thanh toán"
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Phương thức"
          name="method"
          rules={[{ required: true, message: "Chọn phương thức" }]}
        >
          <Select
            options={[
              { value: "CASH", label: "CASH" },
              { value: "SUBSCRIPTION", label: "SUBSCRIPTION" },
            ]}
          />
        </Form.Item>

        {method !== "SUBSCRIPTION" && (
          <Form.Item
            label="Số tiền (VND)"
            name="amountVnd"
            rules={[{ required: true, message: "Nhập số tiền" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        )}

        {method !== "SUBSCRIPTION" && (
          <Form.Item label="Mã giảm giá (ID)" name="voucherId">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default PaySwapModal;
