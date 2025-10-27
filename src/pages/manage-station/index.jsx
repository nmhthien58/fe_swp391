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
  Space,
  Upload,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { toast } from "react-toastify";
import api from "../../config/axios";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";

const ManageStation = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [form] = useForm();

  // Phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ==== NEW: quản lý expand và dữ liệu batteries theo station ====
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [batteriesByStation, setBatteriesByStation] = useState({}); // { [stationId]: Battery[] }
  const [loadingBatteries, setLoadingBatteries] = useState({}); // { [stationId]: boolean }

  // Bảng batteries (render trong expandedRowRender)
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
          FULLY_CHARGED: "green",
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
    { title: "Action", key: "action" },
  ];

  // Helper: đếm số pin khả dụng từ mảng batteries
  const calcAvailable = (arr) => {
    if (!Array.isArray(arr)) return 0;
    const OK = new Set(["FULL", "FULLY_CHARGED", "AVAILABLE"]); // tuỳ bạn chọn
    return arr.reduce((n, b) => (OK.has(b?.status) ? n + 1 : n), 0);
  };

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

      // TÍNH availableBatteries
      const withAvail = content.map((st) => ({
        ...st,
        availableBatteries:
          st.availableBatteries ?? calcAvailable(st.batteries),
      }));

      setStations(withAvail);
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
      setExpandedRowKeys((prev) => prev.filter((k) => k !== stationId));
      fetchStations();
    } catch (err) {
      console.error("Delete station error:", err);
      toast.error("Xóa station thất bại.");
    }
  };

  // === Create/Update station ===
  const handleSubmitForm = async (values) => {
    const payload = {
      name: values.name?.trim(),
      address: values.address?.trim(),
      latitude: parseFloat(values.latitude),
      longitude: parseFloat(values.longitude),
      capacity: parseInt(values.capacity, 10),
      status: values.status,
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
        await api.put(`/api/stations/${values.stationId}`, {
          ...payload,
          imageUrl: undefined,
        });
        toast.success("Cập nhật station thành công!");
      } else {
        const fd = new FormData();
        const file = values.image?.[0]?.originFileObj;
        if (file) fd.append("image", file);

        await api.post("/api/stations/create", fd, {
          params: {
            name: payload.name,
            address: payload.address,
            latitude: payload.latitude,
            longitude: payload.longitude,
            capacity: payload.capacity,
            status: payload.status,
          },
        });

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
        "Tạo/sửa station thất bại.";
      toast.error(msg);
    }
  };

  // Lazy load batteries cho 1 station (để bảng con)
  const loadBatteriesForStation = async (station) => {
    const sid = station.stationId ?? station.id;
    if (!sid) return;
    if (Array.isArray(station.batteries)) {
      setBatteriesByStation((m) => ({ ...m, [sid]: station.batteries }));
      return;
    }
    if (Array.isArray(batteriesByStation[sid])) return;

    try {
      setLoadingBatteries((m) => ({ ...m, [sid]: true }));
      let batteries = [];
      try {
        const detail = await api.get(`/api/stations/${sid}`);
        const b1 = detail?.data?.batteries;
        if (Array.isArray(b1)) batteries = b1;
      } catch {
        /* empty */
      }
      if (!batteries.length) {
        try {
          const bRes = await api.get(`/api/stations/${sid}/batteries`);
          const b2 = bRes?.data;
          if (Array.isArray(b2)) batteries = b2;
        } catch {
          /* empty */
        }
      }
      setBatteriesByStation((m) => ({ ...m, [sid]: batteries }));
    } catch (e) {
      console.error("Load batteries error:", e);
      toast.error("Không tải được danh sách batteries cho trạm này.");
      setBatteriesByStation((m) => ({ ...m, [sid]: [] }));
    } finally {
      setLoadingBatteries((m) => ({ ...m, [sid]: false }));
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

  const toggleExpand = async (record) => {
    const key = record.stationId ?? record.id;
    const isOpen = expandedRowKeys.includes(key);
    if (isOpen) {
      setExpandedRowKeys((prev) => prev.filter((k) => k !== key));
    } else {
      setExpandedRowKeys((prev) => [...prev, key]);
      await loadBatteriesForStation(record);
    }
  };

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
    {
      title: "Available batteries (FULL)",
      dataIndex: "availableBatteries",
      key: "availableBatteries",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        const key = record.stationId ?? record.id;
        const isOpen = expandedRowKeys.includes(key);
        return (
          <Space>
            <Button onClick={() => toggleExpand(record)}>
              {isOpen ? "Hide batteries" : "Batteries"}
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
                  image: [],
                });
              }}
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
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center gap-8">
        <h2 className="text-3xl font-bold text-gray-800 pb-2">
          Manage Station
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setOpen(true);
          }}
        >
          Add station
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={stations}
        rowKey={(r) => r.stationId ?? r.id ?? r.key}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        expandable={{
          expandedRowKeys,
          onExpand: async (expanded, record) => {
            const key = record.stationId ?? record.id;
            if (expanded) {
              setExpandedRowKeys((prev) => [...prev, key]);
              await loadBatteriesForStation(record);
            } else {
              setExpandedRowKeys((prev) => prev.filter((k) => k !== key));
            }
          },
          expandedRowRender: (record) => {
            const sid = record.stationId ?? record.id;
            const loadingRow = !!loadingBatteries[sid];
            const list =
              batteriesByStation[sid] ??
              (Array.isArray(record.batteries) ? record.batteries : []);

            if (loadingRow)
              return <div style={{ padding: 12 }}>Đang tải batteries…</div>;
            if (!list || list.length === 0) {
              return (
                <div style={{ padding: 12 }}>
                  <Empty description="Không có battery nào cho station này" />
                </div>
              );
            }
            return (
              <div style={{ background: "#fafafa", padding: 12 }}>
                <Table
                  columns={batteryCols}
                  dataSource={list}
                  rowKey={(r) => r.batteryId ?? r.id}
                  pagination={{ pageSize: 8 }}
                  size="small"
                />
              </div>
            );
          },
        }}
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

          {/* NEW: chọn ảnh để gửi field 'image' (optional) */}
          <Form.Item
            label="Image (optional)"
            name="image"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
            tooltip="Sẽ gửi theo field multipart/form-data tên 'image'"
          >
            <Upload listType="picture" beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ManageStation;
