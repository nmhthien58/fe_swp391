// src/pages/manage-user/UserFormModal.jsx
import React from "react";
import { Form, Input, Modal, Select, Switch } from "antd";

const UserFormModal = ({ open, form, onCancel, onFinish }) => {
  const isEdit = !!form.getFieldValue("driverId");

  return (
    <Modal
      title={isEdit ? "Cập nhật tài khoản" : "Tạo tài khoản Staff"}
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
        onFinish={onFinish}
        preserve={false}
      >
        <Form.Item name="driverId" label="Driver ID" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          label="Tên đăng nhập"
          name="userName"
          rules={[
            { required: true, message: "Vui lòng nhập tên đăng nhập" },
            {
              min: 3,
              message: "Tên đăng nhập phải tối thiểu 3 ký tự",
            },
          ]}
        >
          <Input placeholder="Nhập tên đăng nhập" />
        </Form.Item>

        <Form.Item
          label={isEdit ? "Mật khẩu (nếu muốn đổi)" : "Mật khẩu"}
          name="password"
          rules={
            isEdit
              ? []
              : [{ required: true, message: "Vui lòng nhập mật khẩu" }]
          }
        >
          <Input.Password
            placeholder={
              isEdit ? "Để trống nếu không muốn đổi mật khẩu" : "Nhập mật khẩu"
            }
          />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input placeholder="Nhập email" />
        </Form.Item>

        <Form.Item
          label="Họ tên"
          name="fullName"
          rules={[{ required: true, message: "Vui lòng nhập họ tên đầy đủ" }]}
        >
          <Input placeholder="Nhập họ tên" />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch checkedChildren="Đang hoạt động" unCheckedChildren="Ngừng" />
        </Form.Item>

        <Form.Item
          label="Vai trò"
          name="role"
          tooltip="Tạo mới luôn là STAFF (đặt qua query userRoleChoice=STAFF)"
        >
          <Select disabled placeholder="STAFF">
            <Select.Option value="ADMIN">ADMIN</Select.Option>
            <Select.Option value="STAFF">STAFF</Select.Option>
            <Select.Option value="DRIVER">DRIVER</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserFormModal;
