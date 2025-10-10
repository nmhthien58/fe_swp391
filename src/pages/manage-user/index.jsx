import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
} from "antd";
import { useForm } from "antd/es/form/Form";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
const ManageUser = () => {
  const [categories, setCategories] = useState();
  const [open, setOpen] = useState(false);
  const [form] = useForm();

  // columns (hiển thị cột như nào)
  const colums = [
    {
      title: "Driver ID",
      dataIndex: "driverId",
      key: "driverId",
    },
    {
      title: "Username",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      render: (roles) => (
        <>
          {roles?.map((role, index) => (
            <Tag color="blue" key={index}>
              {role.userType}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: "Action",
      dataIndex: "id",
      key: "id",
      render: (id, record) => {
        // record: {name, description}
        return (
          <>
            <Button
              type="primary"
              onClick={() => {
                // 1. open modal
                setOpen(true);

                // 2. fill old data => form
                form.setFieldsValue(record);
              }}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete station"
              onConfirm={async () => {
                // => cho phép delete
                await axios.delete(
                  `https://68ce92096dc3f350777f6302.mockapi.io/Category/${id}`
                );

                fetchCategories(); // cập nhật lại danh sách
                toast.success("Successfully remove category!");
              }}
            >
              <Button type="primary" danger>
                Delete
              </Button>
            </Popconfirm>
          </>
        );
      },
    },
  ];

  const fetchCategories = async () => {
    // gọi tới api và lấy dữ liệu categories
    console.log("fetching data from API...");

    // đợi BE trả về dữ liệu
    const response = await axios.get(
      "https://68ce92096dc3f350777f6302.mockapi.io/Category"
    );

    console.log(response.data);
    setCategories(response.data);
  };

  const handleSubmitForm = async (values) => {
    const { id } = values;
    let response;

    if (id) {
      // => update
      response = await axios.put(
        `https://68ce92096dc3f350777f6302.mockapi.io/Category/${id}`,
        values
      );
    } else {
      // => create new
      response = await axios.post(
        "https://68ce92096dc3f350777f6302.mockapi.io/Category",
        values
      );
    }

    console.log(response.data);
    setOpen(false);
    fetchCategories();
    form.resetFields();
    toast.success("Successfully create new category!");
  };

  // khi load trang lên => fetchCategories()
  useEffect(() => {
    // làm gì khi load trang lên
    fetchCategories();
  }, []);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800  pb-2">Manage User</h2>
      </div>
      {/* <Button type="primary" onClick={() => setOpen(true)}>
        Add station
      </Button> */}
      <Table columns={colums} dataSource={categories} />
      <Modal
        title="Driver Information"
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form
          labelCol={{
            span: 24,
          }}
          form={form}
          onFinish={handleSubmitForm}
        >
          <Form.Item label="Driver ID" name="driverId" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Username"
            name="userName"
            rules={[
              {
                required: true,
                message: "Please input username!",
              },
              {
                min: 3,
                message: "Username must be at least 3 characters long!",
              },
            ]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Please input email!",
              },
              {
                type: "email",
                message: "Please enter a valid email!",
              },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[
              {
                required: true,
                message: "Please input full name!",
              },
            ]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[
              {
                required: true,
                message: "Please select status!",
              },
            ]}
            valuePropName="checked"
          >
            <Select placeholder="Select status">
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Role"
            name={["roles", 0, "userType"]}
            rules={[
              {
                required: true,
                message: "Please select a role!",
              },
            ]}
          >
            <Select placeholder="Select role">
              <Select.Option value="ADMIN">Admin</Select.Option>
              <Select.Option value="STAFF">Staff</Select.Option>
              <Select.Option value="DRIVER">Driver</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ManageUser;
