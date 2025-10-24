import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Tag,
  Space,
  Spin,
  message,
  Modal,
  Switch,
  Radio,
} from "antd";
import api from "../../config/axios";

const { Title, Text } = Typography;

const currencyVND = (v) =>
  typeof v === "number"
    ? v.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
    : v;

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [autoRenew, setAutoRenew] = useState(true);

  // payment options (không dùng bankCode nữa)
  const [paymentMethod, setPaymentMethod] = useState("CARD"); // "CARD" | "CASH"

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/subscription-plans/all");
      const data = res?.data?.result ?? [];
      setPlans(data.filter((x) => x.active));
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách gói đăng ký");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openSubscribe = (plan) => {
    setSelectedPlan(plan);
    setAutoRenew(true);
    setPaymentMethod("CARD");
    setOpen(true);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    try {
      setConfirmLoading(true);

      // B1: tạo subscription (schema trả về subscriptionId ở root)
      const subRes = await api.post(
        "/api/driver-subscriptions/create",
        {
          planId: Number(selectedPlan.planId),
          autoRenew: Boolean(autoRenew),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const subscriptionId = subRes?.data?.subscriptionId;
      if (!subscriptionId) throw new Error("Không lấy được subscriptionId.");

      // B2: tạo payment — THEO ĐÚNG SWAGGER
      const payBody = {
        paymentType: "SUBSCRIPTION",
        subscriptionId: Number(subscriptionId),
        method: paymentMethod, // "CARD" hoặc "CASH"
        ipAddr: "127.0.0.1",
        amountVnd: Number(selectedPlan.price || 0), // backend sẽ nhân 100 khi tạo URL VNPay
        swapId: 0,
        cashierStaffId: 0,
      };

      const payRes = await api.post("/api/payments/create", payBody, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (paymentMethod === "CASH") {
        message.success("Đã tạo đăng ký, thanh toán tiền mặt tại quầy.");
        setOpen(false);
        return;
      }

      const paymentUrl = typeof payRes?.data === "string" ? payRes.data : null;
      if (!paymentUrl) throw new Error("Không nhận được paymentUrl từ API.");

      window.location.assign(paymentUrl);
    } catch (err) {
      console.error("subscribe/payment error:", err?.response?.data || err);
      message.error(
        err?.response?.data?.message ||
          err?.message ||
          "Đăng ký gói/Thanh toán thất bại."
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        Các gói đăng ký khả dụng
      </Title>

      {loading ? (
        <div style={{ textAlign: "center", marginTop: 60 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {plans.map((plan) => (
            <Col xs={24} sm={12} md={8} lg={6} key={plan.planId}>
              <Card
                hoverable
                style={{ borderRadius: 12, height: "100%" }}
                title={<Text strong>{plan.name}</Text>}
                extra={<Tag color="green">Active</Tag>}
                actions={[
                  <Button
                    type="primary"
                    block
                    onClick={() => openSubscribe(plan)}
                  >
                    Đăng ký gói
                  </Button>,
                ]}
              >
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  <Text type="secondary">
                    {plan.description || "Không có mô tả"}
                  </Text>
                  <Text>
                    <strong>Thời hạn sử dụng:</strong> {plan.durationDays} ngày
                  </Text>
                  <Text>
                    <strong>Giá gói:</strong> {currencyVND(plan.price)}
                  </Text>
                  <Text>
                    <strong>Số lượt đổi miễn phí:</strong> {plan.swapLimit}
                  </Text>
                  {plan.pricePerExtraSwap != null && (
                    <Text>
                      <strong>Phí đổi pin vượt số lượt miễn phí:</strong>{" "}
                      {currencyVND(plan.pricePerExtraSwap)}
                    </Text>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        open={open}
        onOk={handleSubscribe}
        onCancel={() => setOpen(false)}
        confirmLoading={confirmLoading}
        okText={
          paymentMethod === "CARD" ? "Xác nhận & Thanh toán" : "Tạo đăng ký"
        }
        cancelText="Hủy"
        title="Xác nhận đăng ký gói"
      >
        {selectedPlan && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text>
              Bạn đang đăng ký <strong>{selectedPlan.name}</strong>
            </Text>
            <Text>
              <strong>Giá gói:</strong> {currencyVND(selectedPlan.price)} •{" "}
              <strong>Thời hạn:</strong> {selectedPlan.durationDays} ngày
            </Text>
            <Text>
              <strong>Lượt đổi miễn phí:</strong> {selectedPlan.swapLimit ?? 0}
            </Text>

            <Space align="center">
              <Switch checked={autoRenew} onChange={setAutoRenew} />
              <Text>Tự gia hạn khi hết hạn</Text>
            </Space>

            <div style={{ marginTop: 8 }}>
              <Text strong>Phương thức thanh toán:</Text>
              <Radio.Group
                style={{ display: "block", marginTop: 8 }}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <Radio value="CARD">Thanh toán online (VNPay)</Radio>
                <Radio value="CASH">Tiền mặt</Radio>
              </Radio.Group>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default Plans;
