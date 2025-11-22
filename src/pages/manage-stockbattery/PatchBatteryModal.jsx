// src/pages/manage-stockbattery/PatchBatteryModal.jsx
import React from "react";
import { Modal, Form, Select, Input, Checkbox } from "antd";
import { statusStyle } from "./statusConfig";

const { TextArea } = Input;

const PatchBatteryModal = ({
  open,
  onCancel,
  form,
  currentBattery,
  onSubmit,
  BATTERY_STATUS,
}) => {
  return (
    <Modal
      title={
        currentBattery
          ? `Đổi trạng thái: ${currentBattery.serialNumber}`
          : "Đổi trạng thái pin"
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Lưu"
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Trạng thái mới"
          name="status"
          rules={[{ required: true, message: "Chọn trạng thái" }]}
        >
          <Select placeholder="Chọn status">
            {BATTERY_STATUS.map((s) => (
              <Select.Option key={s} value={s}>
                {statusStyle[s]?.text || s}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Lý do (tuỳ chọn)" name="reason">
          <TextArea placeholder="Nhập lý do thay đổi..." rows={3} />
        </Form.Item>

        <Form.Item
          name="adminOverride"
          valuePropName="checked"
          initialValue={true}
        >
          <Checkbox>Admin override</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PatchBatteryModal;
