// src/pages/MyInfo.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Card,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
} from "antd";
import { selectUser } from "../../redux/accountSlice";
import api from "../../config/axios";

const { Option } = Select;

// Điều chỉnh list này theo enum batteryType thực tế trên backend nếu cần
const BATTERY_TYPES = ["LITHIUM_ION", "NICKEL_METAL_HYDRIDE", "LEAD_ACID"];

const MyInfo = () => {
  const user = useSelector(selectUser);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const handleOpen = () => setOpen(true);
  const handleCancel = () => {
    form.resetFields();
    setOpen(false);
  };

  const onFinish = async (values) => {
    try {
      setSubmitting(true);
      // values: { vin, batteryType, model, manufacturer, imageUrl }
      await api.post("/api/vehicles/register", values);
      message.success("Liên kết phương tiện thành công!");
      handleCancel();
    } catch (err) {
      const detail =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Không thể liên kết phương tiện.";
      message.error(detail);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <p>Không có thông tin người dùng. Vui lòng đăng nhập.</p>;
  }

  return (
    <>
      <Card
        title="Thông tin người dùng"
        bordered={false}
        style={{ maxWidth: 640, margin: "32px auto", borderRadius: 10 }}
        extra={
          <Button type="primary" onClick={handleOpen}>
            Liên kết phương tiện
          </Button>
        }
      >
        <Descriptions column={1}>
          <Descriptions.Item label="Tên đăng nhập">
            {user.userName || "Chưa có"}
          </Descriptions.Item>
          <Descriptions.Item label="Họ và tên">
            {user.fullName || "Chưa có"}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {user.email || "Chưa có"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Modal Form đăng ký phương tiện */}
      <Modal
        title="Liên kết phương tiện"
        open={open}
        onCancel={handleCancel}
        cancelText="Hủy"
        onOk={() => form.submit()}
        okText="Liên kết"
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ batteryType: "LITHIUM_ION" }}
        >
          <Form.Item
            label="VIN"
            name="vin"
            rules={[
              { required: true, message: "Vui lòng nhập VIN" },
              //   { min: 5, message: "VIN tối thiểu 5 ký tự" },
            ]}
          >
            <Input placeholder="VD: LRW3E7EK7NC123456" allowClear />
          </Form.Item>

          <Form.Item
            label="Loại pin (batteryType)"
            name="batteryType"
            rules={[{ required: true, message: "Vui lòng chọn loại pin" }]}
          >
            <Select showSearch placeholder="Chọn loại pin">
              {BATTERY_TYPES.map((t) => (
                <Option key={t} value={t}>
                  {t}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Model"
            name="model"
            rules={[{ required: true, message: "Vui lòng nhập model" }]}
          >
            <Input placeholder="VD: Wave EV 2025" allowClear />
          </Form.Item>

          <Form.Item
            label="Hãng sản xuất (manufacturer)"
            name="manufacturer"
            rules={[{ required: true, message: "Vui lòng nhập hãng sản xuất" }]}
          >
            <Input placeholder="VD: Honda" allowClear />
          </Form.Item>

          <Form.Item
            label="Ảnh phương tiện (imageUrl)"
            name="imageUrl"
            rules={[
              { required: true, message: "Vui lòng nhập link ảnh" },
              { type: "url", message: "Link ảnh không hợp lệ" },
            ]}
          >
            <Input placeholder="https://.../vehicle.jpg" allowClear />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MyInfo;
