// src/pages/manage-stockbattery/CreateBatteryModal.jsx
import React from "react";
import { Modal, Form, Select } from "antd";
import { statusStyle } from "./statusConfig";

const CreateBatteryModal = ({
  open,
  onCancel,
  form,
  stations,
  loadingStations,
  onSubmit,
  BATTERY_STATUS,
}) => {
  return (
    <Modal
      title="Thêm Pin Mới"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Tạo"
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Trạm"
          name="stationId"
          rules={[{ required: true, message: "Vui lòng chọn trạm" }]}
        >
          <Select
            showSearch
            placeholder="Chọn trạm"
            loading={loadingStations}
            optionFilterProp="label"
            options={stations.map((s) => ({
              value: s.stationId,
              label: `${s.name || `Trạm #${s.stationId}`} (ID: ${s.stationId})`,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: "Vui lòng chọn Status" }]}
        >
          <Select placeholder="Chọn status">
            {BATTERY_STATUS.map((s) => (
              <Select.Option key={s} value={s}>
                {statusStyle[s]?.text || s}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateBatteryModal;
