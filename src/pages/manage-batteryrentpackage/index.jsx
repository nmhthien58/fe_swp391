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

const ManageBatteryRentPackage = () => {
  const [packages, setPackages] = useState();
  const [open, setOpen] = useState(false);
  const [form] = useForm();

  // columns (hiển thị cột như nào)
  const columns = [
    {
      title: "Package ID",
      dataIndex: "packageId",
      key: "packageId",
    },
    {
      title: "Package Name",
      dataIndex: "packageName",
      key: "packageName",
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
    },
    {
      title: "Price (VND)",
      dataIndex: "price",
      key: "price",
      render: (price) => {
        return price?.toLocaleString("vi-VN");
      },
    },
    {
      title: "Battery Type",
      dataIndex: "batteryType",
      key: "batteryType",
    },
    {
      title: "Deposit (VND)",
      dataIndex: "deposit",
      key: "deposit",
      render: (deposit) => {
        return deposit?.toLocaleString("vi-VN");
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const isActive = status === "ACTIVE";
        return (
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "ACTIVE" : "INACTIVE"}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "id",
      key: "id",
      render: (id, record) => {
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
              style={{ marginRight: 8 }}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete package"
              description="Are you sure to delete this package?"
              onConfirm={async () => {
                await axios.delete(
                  `https://68ce92096dc3f350777f6302.mockapi.io/Category/${id}`
                );

                fetchPackages();
                toast.success("Successfully removed package!");
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

  const fetchPackages = async () => {
    console.log("fetching data from API...");

    const response = await axios.get(
      "https://68ce92096dc3f350777f6302.mockapi.io/Category"
    );

    console.log(response.data);
    setPackages(response.data);
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
    fetchPackages();
    form.resetFields();
    toast.success(
      id ? "Successfully updated package!" : "Successfully created new package!"
    );
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 pb-2">
          Manage Battery Rent Package
        </h2>
      </div>
      <Button
        type="primary"
        onClick={() => {
          setOpen(true);
          form.resetFields();
        }}
        style={{ marginBottom: 16 }}
      >
        Add Package
      </Button>
      <Table columns={columns} dataSource={packages} rowKey="id" />
      <Modal
        title="Package Information"
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          labelCol={{
            span: 24,
          }}
          form={form}
          onFinish={handleSubmitForm}
        >
          <Form.Item label="ID" name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Package ID"
            name="packageId"
            rules={[
              {
                required: true,
                message: "Please input package ID!",
              },
            ]}
          >
            <Input placeholder="e.g., PKG001" />
          </Form.Item>

          <Form.Item
            label="Package Name"
            name="packageName"
            rules={[
              {
                required: true,
                message: "Please input package name!",
              },
              {
                min: 3,
                message: "Name must be at least 3 characters long!",
              },
            ]}
          >
            <Input placeholder="e.g., Daily Standard" />
          </Form.Item>

          <Form.Item
            label="Duration"
            name="duration"
            rules={[
              {
                required: true,
                message: "Please select duration!",
              },
            ]}
          >
            <Select placeholder="Select duration">
              <Select.Option value="Hourly">Hourly</Select.Option>
              <Select.Option value="Daily">Daily</Select.Option>
              <Select.Option value="Weekly">Weekly</Select.Option>
              <Select.Option value="Monthly">Monthly</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Price (VND)"
            name="price"
            rules={[
              {
                required: true,
                message: "Please input price!",
              },
            ]}
          >
            <Input type="number" placeholder="e.g., 50000" />
          </Form.Item>

          <Form.Item
            label="Battery Type"
            name="batteryType"
            rules={[
              {
                required: true,
                message: "Please input battery type!",
              },
            ]}
          >
            <Input placeholder="e.g., 48V 20Ah" />
          </Form.Item>

          <Form.Item
            label="Deposit (VND)"
            name="deposit"
            rules={[
              {
                required: true,
                message: "Please input deposit amount!",
              },
            ]}
          >
            <Input type="number" placeholder="e.g., 500000" />
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
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ManageBatteryRentPackage;
