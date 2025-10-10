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

const ManageStockBattery = () => {
  const [batteries, setBatteries] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = useForm();
  const [stats, setStats] = useState({
    full: 0,
    charging: 0,
    maintenance: 0,
  });

  // Columns definition
  const columns = [
    {
      title: "Mã Pin",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
    },
    {
      title: "Dung Lượng (Ah)",
      dataIndex: "capacity",
      key: "capacity",
    },
    {
      title: "Trạng Thái Pin",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusConfig = {
          FULL: { color: "green", text: "Đầy" },
          CHARGING: { color: "blue", text: "Đang sạc" },
          MAINTENANCE: { color: "orange", text: "Bảo dưỡng" },
        };
        const config = statusConfig[status] || {
          color: "default",
          text: status,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Tình Trạng",
      dataIndex: "condition",
      key: "condition",
      render: (condition) => {
        const conditionConfig = {
          GOOD: { color: "success", text: "Tốt" },
          FAIR: { color: "warning", text: "Khá" },
          POOR: { color: "error", text: "Yếu" },
        };
        const config = conditionConfig[condition] || {
          color: "default",
          text: condition,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Trạm",
      dataIndex: "station",
      key: "station",
    },
    {
      title: "Thao Tác",
      dataIndex: "id",
      key: "id",
      render: (id, record) => {
        return (
          <>
            <Button
              type="primary"
              onClick={() => {
                setOpen(true);
                form.setFieldsValue(record);
              }}
            >
              Edit
            </Button>
            <Popconfirm
              title="Xóa pin"
              description="Bạn có chắc muốn xóa pin này?"
              onConfirm={async () => {
                await axios.delete(
                  `https://68ce92096dc3f350777f6302.mockapi.io/Category/${id}`
                );
                fetchBatteries();
                toast.success("Xóa pin thành công!");
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

  const fetchBatteries = async () => {
    console.log("Fetching battery data from API...");
    const response = await axios.get(
      "https://68ce92096dc3f350777f6302.mockapi.io/Category"
    );
    console.log(response.data);
    setBatteries(response.data);

    // Calculate statistics
    const fullCount = response.data.filter((b) => b.status === "FULL").length;
    const chargingCount = response.data.filter(
      (b) => b.status === "CHARGING"
    ).length;
    const maintenanceCount = response.data.filter(
      (b) => b.status === "MAINTENANCE"
    ).length;

    setStats({
      full: fullCount,
      charging: chargingCount,
      maintenance: maintenanceCount,
    });
  };

  const handleSubmitForm = async (values) => {
    const { id } = values;
    let response;

    if (id) {
      // Update existing battery
      response = await axios.put(
        `https://68ce92096dc3f350777f6302.mockapi.io/Category/${id}`,
        values
      );
    } else {
      // Create new battery
      response = await axios.post(
        "https://68ce92096dc3f350777f6302.mockapi.io/Category",
        values
      );
    }

    console.log(response.data);
    setOpen(false);
    fetchBatteries();
    form.resetFields();
    toast.success("Thành công!");
  };

  useEffect(() => {
    fetchBatteries();
  }, []);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 pb-2">
          Quản Lý Tồn Kho Pin
        </h2>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        <div
          style={{
            flex: 1,
            padding: "20px",
            backgroundColor: "#f0f9ff",
            borderRadius: "8px",
            border: "1px solid #bae6fd",
          }}
        >
          <div
            style={{ fontSize: "14px", color: "#0369a1", marginBottom: "8px" }}
          >
            Pin Đầy
          </div>
          <div
            style={{ fontSize: "32px", fontWeight: "bold", color: "#0284c7" }}
          >
            {stats.full}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "20px",
            backgroundColor: "#eff6ff",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
          }}
        >
          <div
            style={{ fontSize: "14px", color: "#1e40af", marginBottom: "8px" }}
          >
            Pin Đang Sạc
          </div>
          <div
            style={{ fontSize: "32px", fontWeight: "bold", color: "#2563eb" }}
          >
            {stats.charging}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "20px",
            backgroundColor: "#fff7ed",
            borderRadius: "8px",
            border: "1px solid #fed7aa",
          }}
        >
          <div
            style={{ fontSize: "14px", color: "#c2410c", marginBottom: "8px" }}
          >
            Pin Bảo Dưỡng
          </div>
          <div
            style={{ fontSize: "32px", fontWeight: "bold", color: "#ea580c" }}
          >
            {stats.maintenance}
          </div>
        </div>
      </div>

      <Button
        type="primary"
        onClick={() => setOpen(true)}
        style={{ marginBottom: 16 }}
      >
        Thêm pin mới
      </Button>
      <Table columns={columns} dataSource={batteries} />
      <Modal
        title="Thông Tin Pin"
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
          <Form.Item label="ID" name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            label="Mã Pin"
            name="code"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mã pin!",
              },
              {
                min: 3,
                message: "Mã pin phải có ít nhất 3 ký tự!",
              },
            ]}
          >
            <Input placeholder="VD: BAT001" />
          </Form.Item>
          <Form.Item
            label="Model"
            name="model"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập model!",
              },
            ]}
          >
            <Input placeholder="VD: Li-ion 48V" />
          </Form.Item>
          <Form.Item
            label="Dung Lượng (Ah)"
            name="capacity"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập dung lượng!",
              },
            ]}
          >
            <Input type="number" placeholder="VD: 20" />
          </Form.Item>
          <Form.Item
            label="Trạng Thái Pin"
            name="status"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn trạng thái!",
              },
            ]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="FULL">Đầy</Select.Option>
              <Select.Option value="CHARGING">Đang sạc</Select.Option>
              <Select.Option value="MAINTENANCE">Bảo dưỡng</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Tình Trạng"
            name="condition"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn tình trạng!",
              },
            ]}
          >
            <Select placeholder="Chọn tình trạng">
              <Select.Option value="GOOD">Tốt</Select.Option>
              <Select.Option value="FAIR">Khá</Select.Option>
              <Select.Option value="POOR">Yếu</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Trạm"
            name="station"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên trạm!",
              },
            ]}
          >
            <Input placeholder="VD: Trạm Quận 1" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ManageStockBattery;
