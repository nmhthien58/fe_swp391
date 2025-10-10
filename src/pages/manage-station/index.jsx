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
const ManageStation = () => {
  const [categories, setCategories] = useState();
  const [open, setOpen] = useState(false);
  const [form] = useForm();

  // columns (hiển thị cột như nào)
  const colums = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const isActive = status === "ACTIVE";
        return (
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "Active" : "Inactive"}
          </Tag>
        );
      },
    },
    {
      title: "Battery capacity",
      dataIndex: "capacity",
      key: "capacity",
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
        <h2 className="text-3xl font-bold text-gray-800  pb-2">
          Manage Station
        </h2>
      </div>
      <Button
        type="primary"
        onClick={() => setOpen(true)}
        style={{ marginBottom: 16 }}
      >
        Add station
      </Button>
      <Table columns={colums} dataSource={categories} />
      <Modal
        title="Station Information"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          labelCol={{
            span: 24,
          }}
          form={form}
          onFinish={handleSubmitForm}
        >
          <Form.Item label="ID" name="stationId" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="latitude" name="latitude" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="longtitude" name="longtitude" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            label="Name"
            name="name"
            rules={[
              {
                required: true,
                message: "Please input your name!",
              },
              {
                min: 3,
                message: "Name must be at least 3 characters long!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            rules={[
              {
                required: true,
                message: "Please provide address!",
              },
              {
                max: 200,
                message: "Address cannot exceed 200 characters!",
              },
            ]}
          >
            <Input.TextArea />
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
          >
            <Select placeholder="Select status">
              <Select.Option value="ACTIVE">Active</Select.Option>
              <Select.Option value="INACTIVE">Inactive</Select.Option>
            </Select>
          </Form.Item>{" "}
          <Form.Item
            label="Battery capacity"
            name="capacity"
            rules={[
              {
                required: true,
                message: "Please input battery capacity!",
              },
            ]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ManageStation;
