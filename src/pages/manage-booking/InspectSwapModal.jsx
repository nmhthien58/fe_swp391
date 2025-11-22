// src/pages/manage-booking/InspectSwapModal.jsx
import React, { useEffect } from "react";
import { Modal, Form, Radio, InputNumber, Select, Input } from "antd";

const InspectSwapModal = ({ open, swap, loading, onCancel, onSubmit }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && swap) {
      form.setFieldsValue({
        batterySource: "EXISTING",
        batteryId: swap.returnedBatteryId || 0,
        condition: "GOOD",
        socPercent: 0,
        notes: "",
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
      // validate fail
    }
  };

  return (
    <Modal
      open={open}
      title={`Inspect return swap #${swap?.swapId || ""}`}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Ghi nhận"
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Nguồn pin trả về"
          name="batterySource"
          initialValue="EXISTING"
          rules={[{ required: true, message: "Chọn nguồn pin" }]}
        >
          <Radio.Group>
            <Radio value="EXISTING">Pin đã có trong trạm</Radio>
            <Radio value="EXTERNAL">Pin ngoài trạm</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, cur) => prev.batterySource !== cur.batterySource}
        >
          {({ getFieldValue }) => {
            const isExternal = getFieldValue("batterySource") === "EXTERNAL";
            return (
              <Form.Item
                label="Battery ID"
                name="batteryId"
                rules={
                  isExternal
                    ? []
                    : [{ required: true, message: "Nhập batteryId" }]
                }
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  disabled={isExternal}
                />
              </Form.Item>
            );
          }}
        </Form.Item>

        <Form.Item
          label="Tình trạng"
          name="condition"
          rules={[{ required: true, message: "Chọn tình trạng" }]}
        >
          <Select
            options={[
              { value: "GOOD", label: "GOOD" },
              { value: "DEGRADED", label: "DEGRADED" },
              { value: "DAMAGED", label: "DAMAGED" },
            ]}
          />
        </Form.Item>

        <Form.Item label="SOC (%)" name="socPercent">
          <InputNumber min={0} max={100} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Ghi chú" name="notes">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InspectSwapModal;
