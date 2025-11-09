// src/pages/staff/SwapManagement.jsx
import React, { useEffect, useState } from "react";
import {
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
} from "antd";
import api from "../../config/axios"; // axios đã gắn token

const { TabPane } = Tabs;

const ManageBatterySwapTransaction = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal inspect
  const [inspectOpen, setInspectOpen] = useState(false);
  const [currentSwap, setCurrentSwap] = useState(null);
  const [inspectForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1) booking pending
      // đổi lại đúng API của bạn để get booking pending
      const resBooking = await api.get("/api/booking", {
        params: { status: "PENDING" },
      });
      setPendingBookings(resBooking.data || []);

      // 2) tất cả swap
      const resSwaps = await api.get("/api/swaps");
      setSwaps(resSwaps.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- actions ---
  const handleConfirmBooking = async (bookingId) => {
    try {
      await api.post(`/api/swaps/${bookingId}/confirm`);
      message.success("Đã xác nhận đổi pin");
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Xác nhận thất bại");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await api.put(`/api/booking/${bookingId}/cancel`);
      message.success("Đã hủy booking");
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Hủy booking thất bại");
    }
  };

  const handlePaySwap = async (swapId) => {
    try {
      await api.post(`/api/swaps/${swapId}/pay`);
      message.success("Đã thanh toán");
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Thanh toán thất bại");
    }
  };

  const openInspectModal = (swap) => {
    setCurrentSwap(swap);
    inspectForm.resetFields();
    setInspectOpen(true);
  };

  const submitInspect = async () => {
    try {
      const values = await inspectForm.validateFields();
      await api.post(`/api/swaps/${currentSwap.swapId}/inspect-return`, values);
      message.success("Đã ghi nhận pin trả về");
      setInspectOpen(false);
      setCurrentSwap(null);
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Ghi nhận thất bại");
    }
  };

  // --- tables ---
  const pendingColumns = [
    {
      title: "Mã booking",
      dataIndex: "bookingId",
      key: "bookingId",
    },
    {
      title: "Tài xế",
      dataIndex: "driverName",
      key: "driverName",
    },
    {
      title: "Trạm",
      dataIndex: "stationName",
      key: "stationName",
    },
    {
      title: "Thời gian hẹn",
      dataIndex: "appointmentTime",
      key: "appointmentTime",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => handleConfirmBooking(record.bookingId)}
          >
            Xác nhận
          </Button>
          <Button danger onClick={() => handleCancelBooking(record.bookingId)}>
            Hủy
          </Button>
        </Space>
      ),
    },
  ];

  // giả sử swap có các trạng thái: CONFIRMED, PAID, COMPLETED
  const workingSwaps = swaps.filter(
    (s) => s.status !== "COMPLETED" && s.status !== "CANCELLED"
  );
  const historySwaps = swaps.filter(
    (s) => s.status === "COMPLETED" || s.status === "CANCELLED"
  );

  const swapColumns = [
    {
      title: "Swap ID",
      dataIndex: "swapId",
      key: "swapId",
    },
    {
      title: "Booking ID",
      dataIndex: "bookingId",
      key: "bookingId",
    },
    {
      title: "Tài xế",
      dataIndex: "driverName",
      key: "driverName",
    },
    {
      title: "Trạm",
      dataIndex: "stationName",
      key: "stationName",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (st) => <Tag color="blue">{st}</Tag>,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        const canPay =
          record.status === "CONFIRMED" || record.status === "WAITING_PAYMENT";
        const canInspect = record.status === "PAID";
        return (
          <Space>
            <Button
              type="primary"
              onClick={() => handlePaySwap(record.swapId)}
              disabled={!canPay}
            >
              Thanh toán
            </Button>
            <Button
              onClick={() => openInspectModal(record)}
              disabled={!canInspect}
            >
              Inspect return
            </Button>
          </Space>
        );
      },
    },
  ];

  const historyColumns = [
    {
      title: "Swap ID",
      dataIndex: "swapId",
      key: "swapId",
    },
    {
      title: "Booking ID",
      dataIndex: "bookingId",
      key: "bookingId",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (st) => (
        <Tag color={st === "COMPLETED" ? "green" : "red"}>{st}</Tag>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "updatedAt",
      key: "updatedAt",
    },
  ];

  return (
    <>
      <Tabs defaultActiveKey="pending">
        <TabPane tab="Chờ xử lý" key="pending">
          <Table
            rowKey="bookingId"
            columns={pendingColumns}
            dataSource={pendingBookings}
            loading={loading}
          />
        </TabPane>
        <TabPane tab="Đang thực hiện" key="working">
          <Table
            rowKey="swapId"
            columns={swapColumns}
            dataSource={workingSwaps}
            loading={loading}
          />
        </TabPane>
        <TabPane tab="Lịch sử" key="history">
          <Table
            rowKey="swapId"
            columns={historyColumns}
            dataSource={historySwaps}
            loading={loading}
          />
        </TabPane>
      </Tabs>

      <Modal
        title={`Inspect return - Swap ${currentSwap?.swapId || ""}`}
        open={inspectOpen}
        onCancel={() => setInspectOpen(false)}
        onOk={submitInspect}
      >
        <Form form={inspectForm} layout="vertical">
          <Form.Item
            label="Mã pin trả về"
            name="batteryCode"
            rules={[{ required: true, message: "Nhập mã pin" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Tình trạng pin" name="condition">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ManageBatterySwapTransaction;
