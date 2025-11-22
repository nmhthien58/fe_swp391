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
  Switch,
  Radio,
  Skeleton,
  Result,
  Segmented,
  Badge,
  Tooltip,
  Divider,
  Empty,
  Input,
} from "antd";
import {
  ThunderboltOutlined,
  CrownOutlined,
  FireOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectToken } from "../../redux/accountSlice";
import api from "../../config/axios";

import PurchasePlanModal from "./PurchasePlanModal";
import VnpayVerifyModal from "./VnpayVerifyModal";

const { Title, Text } = Typography;
const { TextArea } = Input;

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
  const token = useSelector(selectToken);

  const [voucherCode, setVoucherCode] = useState("");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errText, setErrText] = useState("");

  // modal chọn gói
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [autoRenew, setAutoRenew] = useState(true);

  // payment method
  const [paymentMethod, setPaymentMethod] = useState("CARD"); // mặc định card

  // sort UI
  const [sortKey, setSortKey] = useState("popular");

  // ===== Modal verify VNPay =====
  const [verifyOpen, setVerifyOpen] = useState(false);

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

      // B1: tạo subscription
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

      // B2: tạo payment
      const payBody = {
        paymentType: "SUBSCRIPTION",
        subscriptionId: Number(subscriptionId),
        method: paymentMethod, // "CARD" | "CASH"
        ipAddr: "127.0.0.1",
        amountVnd: Number(selectedPlan.price || 0),
        swapId: 0,
        cashierStaffId: 0,
        voucherCode: voucherCode?.trim() || null,
      };

      const payRes = await api.post("/api/payments/create", payBody, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      // Nếu thanh toán tiền mặt thì không cần VNPay
      if (paymentMethod === "CASH") {
        message.success(
          "Đăng ký gói thành công. Vui lòng thanh toán tiền mặt tại quầy."
        );
        setOpen(false);
        setSelectedPlan(null);
        setVoucherCode("");
        return;
      }

      const paymentUrl = typeof payRes?.data === "string" ? payRes.data : null;
      if (!paymentUrl) throw new Error("Không nhận được paymentUrl từ API.");

      // Mở VNPay
      window.open(paymentUrl, "_blank", "noopener,noreferrer");
      message.success("Đang mở trang thanh toán VNPay...");

      // Mở modal verify để người dùng dán link trả về
      setVerifyOpen(true);

      setOpen(false);
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
      case "popular":
      default:
        arr.sort((a, b) => {
          if (a.planId === recommendedId) return -1;
          if (b.planId === recommendedId) return 1;
          return pricePerDay(a) - pricePerDay(b);
        });
        break;
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

  const openVerifyModalManual = () => {
    setVerifyOpen(true);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* ======= HEADER PLANS ======= */}
      <Card
        bordered={false}
        style={{ ...glassCard, marginBottom: 16 }}
        bodyStyle={{ padding: 16 }}
      >
        <Row align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space direction="vertical" size={4}>
              <Title level={3} style={{ margin: 0 }}>
                Chọn gói thuê pin phù hợp
              </Title>
              <Text type="secondary">
                Các gói dịch vụ với thời hạn và số lượt đổi pin khác nhau, giúp
                bạn chủ động chi phí hàng tháng.
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space
              style={{ width: "100%", justifyContent: "flex-end" }}
              wrap
              size={8}
            >
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

      <Row gutter={[24, 24]}>
        {/* ===== CỘT DANH SÁCH GÓI ===== */}
        <Col xs={24} lg={16}>
          <Card bordered={false} style={glassCard}>
            {loading ? (
              <Row gutter={[16, 16]}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={idx}>
                    <Card
                      style={{ ...glassCard, height: "100%" }}
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
              <Row gutter={[24, 24]} style={{ alignItems: "stretch" }}>
                {sortedPlans.map((plan) => {
                  const ppd = pricePerDay(plan);
                  return (
                    <Col
                      xs={24}
                      sm={12}
                      md={8}
                      lg={6}
                      key={plan.planId}
                      style={{ display: "flex" }}
                    >
                      <Badge.Ribbon text="Active" color="green">
                        <Card
                          hoverable
                          bordered={false}
                          style={{ ...glassCard, height: "100%" }}
                          bodyStyle={{
                            padding: 16,
                            display: "flex",
                            flexDirection: "column",
                            flex: 1, // để body chiếm hết chiều cao
                            height: "100%",
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
                              <Text
                                style={{
                                  fontSize: 22,
                                  fontWeight: 700,
                                }}
                              >
                                {currencyVND(plan.price)}
                              </Text>
                              <Text type="secondary">
                                ~{" "}
                                {isFinite(ppd)
                                  ? currencyVND(Math.round(ppd))
                                  : "-"}{" "}
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
                              <CheckCircleOutlined
                                style={{ color: "#52c41a" }}
                              />{" "}
                              <strong>Thời hạn:</strong> {plan.durationDays}{" "}
                              ngày
                            </Text>
                            <Text>
                              <CheckCircleOutlined
                                style={{ color: "#52c41a" }}
                              />{" "}
                              <strong>Lượt đổi miễn phí:</strong>{" "}
                              {plan.swapLimit}
                            </Text>
                            {plan.pricePerExtraSwap != null && (
                              <Text>
                                <CheckCircleOutlined
                                  style={{ color: "#52c41a" }}
                                />{" "}
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
                            ></Space>
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
          </Card>
        </Col>

        {/* ===== CỘT PHẢI ===== */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            <Card bordered={false} style={glassCard}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space align="center">
                  <InfoCircleOutlined style={{ color: "#1677ff" }} />
                  <Text strong>Xác thực thanh toán VNPay</Text>
                </Space>
                <Text type="secondary">
                  Sau khi thanh toán, bấm vào nút ở dưới và dán URL trả về để
                  xác thực thanh toán.
                </Text>
                <Button
                  onClick={openVerifyModalManual}
                  icon={<CheckCircleOutlined />}
                >
                  Xác thực VNPay
                </Button>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* ===== Modal chọn gói / thanh toán ===== */}
      <PurchasePlanModal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubscribe}
        confirmLoading={confirmLoading}
        selectedPlan={selectedPlan}
        autoRenew={autoRenew}
        setAutoRenew={setAutoRenew}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        voucherCode={voucherCode}
        setVoucherCode={setVoucherCode}
        currencyVND={currencyVND}
        PlanHeaderIcon={PlanHeaderIcon}
      />

      {/* ===== Modal verify VNPay sau khi bấm thanh toán ===== */}
      <VnpayVerifyModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        token={token}
      />
    </div>
  );
};

export default Plans;
