// src/pages/manage-user/AssignStaffModal.jsx
import React from "react";
import { Form, Input, InputNumber, Modal, Switch } from "antd";

const { TextArea } = Input;

const AssignStaffModal = ({
  open,
  form,
  assigningUser,
  submitting,
  onCancel,
  onSubmit,
}) => {
  return (
    <Modal
      open={open}
      title={
        assigningUser
          ? `Assign Staff - ${assigningUser.fullName || assigningUser.userName}`
          : "Assign Staff"
      }
      onCancel={onCancel}
      onOk={onSubmit}
      okText="Gán vào trạm"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
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
          <TextArea rows={3} placeholder="Ghi chú" />
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
  );
};

export default AssignStaffModal;
