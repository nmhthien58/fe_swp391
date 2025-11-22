// src/pages/manage-station/StationFormModal.jsx
import React from "react";
import { Modal, Form, Input, Select, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";

/**
 * Modal tạo / sửa trạm.
 * Nhận form instance + callback onSubmit từ parent.
 */
const StationFormModal = ({ open, form, onCancel, onSubmit }) => {
  return (
    <Modal
      title="Thông tin trạm"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnClose
    >
      <Form
        labelCol={{ span: 24 }}
        form={form}
        onFinish={onSubmit}
        preserve={false}
      >
        <Form.Item label="ID" name="stationId" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          label="Tên trạm"
          name="name"
          rules={[
            { required: true, message: "Vui lòng nhập tên trạm" },
            { max: 100, message: "Tên trạm không vượt quá 100 ký tự" },
          ]}
        >
          <Input placeholder="Ví dụ: Trạm EVSwap Quận 1" />
        </Form.Item>

        <Form.Item
          label="Địa chỉ"
          name="address"
          rules={[
            { required: true, message: "Vui lòng nhập địa chỉ" },
            { max: 200, message: "Địa chỉ không vượt quá 200 ký tự" },
          ]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
        >
          <Select
            options={[
              { label: "Đang hoạt động", value: "ACTIVE" },
              { label: "Ngừng hoạt động", value: "CLOSED" },
              { label: "Bảo trì", value: "MAINTENANCE" },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Sức chứa tối đa (số pin)"
          name="capacity"
          rules={[
            { required: true, message: "Vui lòng nhập sức chứa" },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const n = Number(value);
                if (Number.isNaN(n) || !Number.isInteger(n) || n <= 0) {
                  return Promise.reject(
                    new Error("Sức chứa phải là số nguyên dương")
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="Ví dụ: 20" />
        </Form.Item>

        <Form.Item
          label="Vĩ độ (Latitude)"
          name="latitude"
          rules={[
            { required: true, message: "Vui lòng nhập vĩ độ" },
            {
              validator: (_, value) => {
                if (value == null || value === "") return Promise.resolve();
                const n = Number(value);
                if (Number.isNaN(n)) {
                  return Promise.reject(new Error("Vĩ độ phải là số"));
                }
                if (n < -90 || n > 90) {
                  return Promise.reject(
                    new Error("Vĩ độ nằm trong khoảng -90 đến 90")
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="Ví dụ: 10.7626" />
        </Form.Item>

        <Form.Item
          label="Kinh độ (Longitude)"
          name="longitude"
          rules={[
            { required: true, message: "Vui lòng nhập kinh độ" },
            {
              validator: (_, value) => {
                if (value == null || value === "") return Promise.resolve();
                const n = Number(value);
                if (Number.isNaN(n)) {
                  return Promise.reject(new Error("Kinh độ phải là số"));
                }
                if (n < -180 || n > 180) {
                  return Promise.reject(
                    new Error("Kinh độ nằm trong khoảng -180 đến 180")
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="Ví dụ: 106.6602" />
        </Form.Item>

        <Form.Item
          label="Ảnh trạm (tuỳ chọn)"
          name="image"
          valuePropName="fileList"
          getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          tooltip="Gửi dưới dạng multipart/form-data, field 'image'"
        >
          <Upload listType="picture" beforeUpload={() => false} maxCount={1}>
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StationFormModal;
