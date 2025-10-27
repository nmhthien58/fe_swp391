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
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { selectUser } from "../../redux/accountSlice";
import api from "../../config/axios";
import { toast } from "react-toastify";

const { Option } = Select;
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

  const getDriverId = () => user?.driverId ?? user?.id ?? user?.userId ?? null;

  // Gửi register-swap và bỏ qua kết quả/ lỗi
  const fireAndForgetRegisterSwap = async () => {
    const driverId = getDriverId();
    if (!driverId) return;
    try {
      await api.post(`/api/${driverId}/register-swap`);
      // Không kiểm tra/không hiển thị gì theo yêu cầu
    } catch (e) {
      // Bỏ qua hoàn toàn, không chặn flow
      console.warn("register-swap ignored:", e);
    }
  };

  const normFile = (e) => (Array.isArray(e) ? e : e?.fileList?.slice(-1));

  const onFinish = async (values) => {
    const { vin, batteryType, model, manufacturer, image } = values;
    const fileObj = image?.[0]?.originFileObj;
    if (!fileObj) {
      message.error("Vui lòng chọn ảnh phương tiện.");
      return;
    }

    try {
      setSubmitting(true);

      // 1) Gọi register-swap trước, không quan tâm response
      await fireAndForgetRegisterSwap();

      // 2) Tiếp tục liên kết phương tiện
      const formData = new FormData();
      formData.append("image", fileObj);

      await api.post("/api/vehicles/register", formData, {
        params: { vin, batteryType, model, manufacturer },
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("Liên kết phương tiện thành công!");
      toast.success(
        "Liên kết phương tiện thành công, bây giờ bạn có thể sử dụng dịch vụ đổi pin!"
      );
      handleCancel();
    } catch (err) {
      const detail =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Không thể liên kết phương tiện.";
      message.error(detail);
      toast.error(detail);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return <p>Không có thông tin người dùng. Vui lòng đăng nhập.</p>;

  return (
    <>
      <Card
        title="Thông tin người dùng"
        bordered={false}
        style={{ maxWidth: 640, margin: "32px auto", borderRadius: 10 }}
        extra={
          <Button type="primary" onClick={handleOpen}>
            Liên kết phương tiện để sử dụng dịch vụ đổi pin
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
            label="Biển số xe"
            name="vin"
            rules={[{ required: true, message: "Vui lòng nhập biển số xe" }]}
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
            <Input placeholder="VD: VF3 2025" allowClear />
          </Form.Item>

          <Form.Item
            label="Hãng sản xuất (manufacturer)"
            name="manufacturer"
            rules={[{ required: true, message: "Vui lòng nhập hãng sản xuất" }]}
          >
            <Input placeholder="VD: VinFast" allowClear />
          </Form.Item>

          <Form.Item
            label="Ảnh phương tiện (image)"
            name="image"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[{ required: true, message: "Vui lòng chọn ảnh" }]}
          >
            <Upload
              accept="image/*"
              listType="text"
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MyInfo;
