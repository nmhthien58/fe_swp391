import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
  Empty,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { toast } from "react-toastify";
import api from "../../config/axios";

const ManageStation = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [form] = useForm();

  // Batteries modal
  const [batteriesOpen, setBatteriesOpen] = useState(false);
  const [selectedBatteries, setSelectedBatteries] = useState([]);

  // Phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Cột bảng batteries
  const batteryCols = [
    { title: "ID", dataIndex: "batteryId", key: "batteryId", width: 90 },
    { title: "Serial", dataIndex: "serialNumber", key: "serialNumber" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const map = {
          FULL: "green",
          CHARGING: "blue",
          DAMAGED: "error",
          UNKNOWN: "default",
          AVAILABLE: "green",
          MAINTENANCE: "orange",
          IN_USE: "purple",
          EMPTY: "red",
          RESERVED: "black",
        };
        return <Tag color={map[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Capacity (Wh)",
      dataIndex: "capacityWh",
      key: "capacityWh",
      width: 130,
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      render: (v) => v || "-",
    },
    {
      title: "Driver Sub.",
      dataIndex: ["driverSubscription", "driverId"],
      key: "driverSubscription",
      render: (_, record) =>
        record?.driverSubscription
          ? JSON.stringify(record.driverSubscription)
          : "-",
    },
  ];

  // Cột bảng station
  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Address", dataIndex: "address", key: "address" },
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
    { title: "Battery capacity", dataIndex: "capacity", key: "capacity" },
    { title: "Image URL", dataIndex: "imageUrl", key: "imageUrl" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <>
          <Button
            onClick={() => {
              const list = Array.isArray(record.batteries)
                ? record.batteries
                : [];
              setSelectedBatteries(list);
              setBatteriesOpen(true);
            }}
            style={{ marginRight: 8 }}
          >
            Batteries
          </Button>

          <Button
            type="primary"
            onClick={() => {
              setOpen(true);
              form.setFieldsValue({
                stationId: record.stationId,
                name: record.name,
                address: record.address,
                status: record.status,
                capacity: record.capacity,
                latitude: record.latitude,
                longitude: record.longitude,
                imageUrl: record.imageUrl,
              });
            }}
            style={{ marginRight: 8 }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete station"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.stationId)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  // ======= API calls =======
  const fetchStations = async (
    page = pagination.current,
    size = pagination.pageSize,
    sorter
  ) => {
    setLoading(true);
    try {
      const params = { page: page - 1, size };
      if (sorter && sorter.field && sorter.order) {
        const dir = sorter.order === "ascend" ? "asc" : "desc";
        params.sort = `${sorter.field},${dir}`;
      }

      const res = await api.get("/api/stations", { params });
      const data = res.data || {};
      const content = data.content || [];
      const total = data.totalElements ?? content.length;

      setStations(content);
      setPagination({
        current: (data.pageable?.pageNumber ?? 0) + 1,
        pageSize: data.pageable?.pageSize ?? size,
        total,
      });
    } catch (err) {
      console.error("Fetch stations error:", err);
      toast.error("Không tải được danh sách trạm. (cần quyền admin?)");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stationId) => {
    try {
      await api.delete(`/api/stations/${stationId}`);
      toast.success("Đã xóa station!");
      fetchStations();
    } catch (err) {
      console.error("Delete station error:", err);
      toast.error("Xóa station thất bại.");
    }
  };

  const handleSubmitForm = async (values) => {
    const payload = {
      name: values.name?.trim(),
      address: values.address?.trim(),
      latitude: parseFloat(values.latitude),
      longitude: parseFloat(values.longitude),
      capacity: parseInt(values.capacity, 10),
      status: values.status,
      imageUrl: values.imageUrl?.trim() || null,
    };

    if (
      Number.isNaN(payload.latitude) ||
      Number.isNaN(payload.longitude) ||
      Number.isNaN(payload.capacity)
    ) {
      toast.error("Latitude, longitude, hoặc capacity phải là số hợp lệ!");
      return;
    }

    try {
      if (values.stationId) {
        await api.put(`/api/stations/${values.stationId}`, payload);
        toast.success("Cập nhật station thành công!");
      } else {
        await api.post("/api/stations/stations", payload);
        toast.success("Tạo mới station thành công!");
      }
      setOpen(false);
      form.resetFields();
      fetchStations();
    } catch (err) {
      console.error("Upsert station error:", err.response?.data || err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Tạo/sửa station thất bại (Bad Request).";
      toast.error(msg);
    }
  };

  // ======= Effects =======
  useEffect(() => {
    fetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableChange = (pager, _filters, sorter) => {
    setPagination({
      ...pagination,
      current: pager.current,
      pageSize: pager.pageSize,
    });
    fetchStations(pager.current, pager.pageSize, sorter);
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 pb-2">
          Manage Station
        </h2>
      </div>

      <Button
        type="primary"
        onClick={() => {
          form.resetFields();
          setOpen(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Add station
      </Button>

      <Table
        columns={columns}
        dataSource={stations}
        rowKey={(r) => r.stationId ?? r.id ?? r.key}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      {/* Modal tạo/sửa station */}
      <Modal
        title="Station Information"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form
          labelCol={{ span: 24 }}
          form={form}
          onFinish={handleSubmitForm}
          preserve={false}
        >
          <Form.Item label="ID" name="stationId" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Please input station name!" },
              { min: 3, message: "Name must be at least 3 characters long!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
            rules={[
              { required: true, message: "Please provide address!" },
              { max: 200, message: "Address cannot exceed 200 characters!" },
            ]}
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Please select status!" }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="ACTIVE">Active</Select.Option>
              <Select.Option value="INACTIVE">Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Battery capacity"
            name="capacity"
            rules={[
              { required: true, message: "Please input battery capacity!" },
            ]}
          >
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item
            label="Latitude"
            name="latitude"
            rules={[
              { required: true, message: "Please input latitude!" },
              {
                validator: (_, value) => {
                  const n = parseFloat(value);
                  if (Number.isNaN(n))
                    return Promise.reject("Latitude must be a number");
                  if (n < -90 || n > 90)
                    return Promise.reject(
                      "Latitude must be between -90 and 90"
                    );
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="e.g. 10.7626" />
          </Form.Item>

          <Form.Item
            label="Longitude"
            name="longitude"
            rules={[
              { required: true, message: "Please input longitude!" },
              {
                validator: (_, value) => {
                  const n = parseFloat(value);
                  if (Number.isNaN(n))
                    return Promise.reject("Longitude must be a number");
                  if (n < -180 || n > 180)
                    return Promise.reject(
                      "Longitude must be between -180 and 180"
                    );
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="e.g. 106.6602" />
          </Form.Item>

          <Form.Item
            label="Image URL"
            name="imageUrl"
            rules={[{ warningOnly: true, message: "Invalid URL format" }]}
          >
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal hiển thị danh sách batteries */}
      <Modal
        title="Batteries of Station"
        open={batteriesOpen}
        onCancel={() => setBatteriesOpen(false)}
        footer={null}
        width={900}
      >
        {selectedBatteries?.length ? (
          <Table
            columns={batteryCols}
            dataSource={selectedBatteries}
            rowKey={(r) => r.batteryId ?? r.id}
            pagination={{ pageSize: 8 }}
          />
        ) : (
          <Empty description="Không có battery nào cho station này" />
        )}
      </Modal>
    </>
  );
};

export default ManageStation;
