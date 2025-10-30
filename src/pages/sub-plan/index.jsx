import React, { useEffect, useMemo, useState } from "react";
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
  Skeleton,
  Result,
  Segmented,
  Badge,
  Tooltip,
  Divider,
  Empty,
} from "antd";
import {
  ThunderboltOutlined,
  CrownOutlined,
  FireOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";

const { Title, Text } = Typography;

const currencyVND = (v) =>
  typeof v === "number"
    ? v.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      })
    : v ?? "-";

const glassCard = {
  borderRadius: 12,
  boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
};

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errText, setErrText] = useState("");

  // modal
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [autoRenew, setAutoRenew] = useState(true);

  // payment options (không dùng bankCode nữa)
  const [paymentMethod, setPaymentMethod] = useState("CARD"); // "CARD" | "CASH"

  // sort UI
  const [sortKey, setSortKey] = useState("popular"); // popular | priceAsc | priceDesc | swapDesc

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setErrText("");
      const res = await api.get("/api/subscription-plans/all");
      const data = res?.data?.result ?? [];
      setPlans(data.filter((x) => x.active));
    } catch (err) {
      console.error(err);
      setErrText("Không thể tải danh sách gói đăng ký");
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

  // ----- UI helpers -----
  const pricePerDay = (p) =>
    typeof p?.price === "number" &&
    typeof p?.durationDays === "number" &&
    p.durationDays > 0
      ? p.price / p.durationDays
      : Infinity;

  const valueScore = (p) => {
    // Điểm “Ưu đãi”: lượt đổi / giá (có clip hạn chế)
    const swaps = Number(p?.swapLimit ?? 0);
    const price = Number(p?.price ?? 1);
    return swaps > 0 && price > 0 ? swaps / price : 0;
  };

  const recommendedId = useMemo(() => {
    if (!plans.length) return null;
    const best = [...plans].sort((a, b) => valueScore(b) - valueScore(a))[0];
    return best?.planId ?? null;
  }, [plans]);

  const sortedPlans = useMemo(() => {
    const arr = [...plans];
    switch (sortKey) {
      case "priceAsc":
        arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "priceDesc":
        arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "swapDesc":
        arr.sort((a, b) => (b.swapLimit ?? 0) - (a.swapLimit ?? 0));
        break;
      default:
        // popular: ưu tiên recommended, sau đó giá/ ngày thấp
        arr.sort((a, b) => {
          if (a.planId === recommendedId) return -1;
          if (b.planId === recommendedId) return 1;
          return pricePerDay(a) - pricePerDay(b);
        });
    }
    return arr;
  }, [plans, sortKey, recommendedId]);

  const PlanHeaderIcon = ({ name = "" }) => {
    const n = name.toLowerCase();
    if (n.includes("pro") || n.includes("premium") || n.includes("max"))
      return <CrownOutlined style={{ color: "#faad14" }} />;
    if (n.includes("plus") || n.includes("standard"))
      return <ThunderboltOutlined style={{ color: "#1677ff" }} />;
    return <FireOutlined style={{ color: "#24a148" }} />;
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Page header */}
      <Card
        bordered={false}
        style={{ ...glassCard, marginBottom: 16 }}
        bodyStyle={{ padding: 16 }}
      >
        <Row align="middle" justify="space-between" gutter={[12, 12]}>
          <Col>
            <Space direction="vertical" size={4}>
              <Title level={3} style={{ margin: 0 }}>
                Các gói đăng ký khả dụng
              </Title>
              <Text type="secondary">
                Chọn gói phù hợp để nhận ưu đãi đổi pin và đặt lịch nhanh hơn.
              </Text>
            </Space>
          </Col>
          <Col>
            <Space align="center">
              <Text type="secondary">Sắp xếp: </Text>
              <Segmented
                size="large"
                value={sortKey}
                onChange={setSortKey}
                options={[
                  { label: "Mặc định", value: "popular" },
                  { label: "Giá ↑", value: "priceAsc" },
                  { label: "Giá ↓", value: "priceDesc" },
                  { label: "Lượt đổi ↑", value: "swapDesc" },
                ]}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Content */}
      {loading ? (
        <Row gutter={[24, 24]}>
          {[...Array(6)].map((_, i) => (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card
                bordered={false}
                style={glassCard}
                bodyStyle={{ padding: 16 }}
              >
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : errText ? (
        <Result
          status="error"
          title="Không thể tải gói đăng ký"
          subTitle={errText}
          extra={
            <Button onClick={fetchPlans} type="primary">
              Thử lại
            </Button>
          }
        />
      ) : !sortedPlans.length ? (
        <Card bordered={false} style={glassCard}>
          <Empty description="Chưa có gói nào khả dụng" />
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {sortedPlans.map((plan) => {
            const isRecommended = plan.planId === recommendedId;
            const ppd = pricePerDay(plan); // price/day
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={plan.planId}>
                <Badge.Ribbon
                  text={isRecommended ? "Active" : "Active"}
                  color={isRecommended ? "green" : "green"}
                >
                  <Card
                    hoverable
                    bordered={false}
                    style={{ ...glassCard, height: "100%" }}
                    bodyStyle={{
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* header */}
                    <Space align="center" style={{ marginBottom: 8 }}>
                      <PlanHeaderIcon name={plan.name} />
                      <Text strong style={{ fontSize: 16 }}>
                        {plan.name}
                      </Text>
                    </Space>

                    {/* price block */}
                    <div
                      style={{
                        background: "#f6ffed",
                        border: "1px solid #b7eb8f",
                        borderRadius: 10,
                        padding: "10px 12px",
                        marginBottom: 12,
                      }}
                    >
                      <Space direction="vertical" size={2}>
                        <Text style={{ fontSize: 22, fontWeight: 700 }}>
                          {currencyVND(plan.price)}
                        </Text>
                        <Text type="secondary">
                          ~ {isFinite(ppd) ? currencyVND(Math.round(ppd)) : "-"}{" "}
                          / ngày
                        </Text>
                      </Space>
                    </div>

                    {/* features */}
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      <Text type="secondary">
                        {plan.description || "Không có mô tả"}
                      </Text>
                      <Text>
                        <CheckCircleOutlined style={{ color: "#52c41a" }} />{" "}
                        <strong>Thời hạn:</strong> {plan.durationDays} ngày
                      </Text>
                      <Text>
                        <CheckCircleOutlined style={{ color: "#52c41a" }} />{" "}
                        <strong>Lượt đổi miễn phí:</strong> {plan.swapLimit}
                      </Text>
                      {plan.pricePerExtraSwap != null && (
                        <Text>
                          <CheckCircleOutlined style={{ color: "#52c41a" }} />{" "}
                          <strong>Phí vượt lượt:</strong>{" "}
                          {currencyVND(plan.pricePerExtraSwap)}
                        </Text>
                      )}
                    </Space>

                    <Divider style={{ margin: "12px 0" }} />

                    {/* footer actions */}
                    <div style={{ marginTop: "auto" }}>
                      <Space
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <Tag color="green">Active</Tag>
                        <Tooltip title="Ưu tiên gói có tỉ lệ lượt đổi/giá tốt">
                          <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
                        </Tooltip>
                      </Space>
                      <Button
                        type="primary"
                        block
                        style={{ marginTop: 10 }}
                        onClick={() => openSubscribe(plan)}
                      >
                        Đăng ký gói
                      </Button>
                    </div>
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Modal đăng ký */}
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
        {selectedPlan ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <Space align="center">
                <PlanHeaderIcon name={selectedPlan.name} />
                <Text strong style={{ fontSize: 16 }}>
                  {selectedPlan.name}
                </Text>
              </Space>
              <Tag color="green">Active</Tag>
            </Space>

            <div
              style={{
                background: "#f0f5ff",
                border: "1px solid #adc6ff",
                borderRadius: 10,
                padding: "8px 12px",
              }}
            >
              <Text>
                <strong>Giá gói:</strong> {currencyVND(selectedPlan.price)} •{" "}
                <strong>Thời hạn:</strong> {selectedPlan.durationDays} ngày •{" "}
                <strong>Lượt đổi miễn phí:</strong>{" "}
                {selectedPlan.swapLimit ?? 0}
              </Text>
            </div>

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
        ) : (
          <Spin />
        )}
      </Modal>
    </div>
  );
};

export default Plans;
