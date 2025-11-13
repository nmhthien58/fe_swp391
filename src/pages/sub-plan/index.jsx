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

// ===== Helper: dựng verify URL từ link VNPay trả về =====
const VERIFY_PATH = "/api/payments/verify";

function buildVerifyUrl(pastedUrl) {
  if (!pastedUrl || typeof pastedUrl !== "string") return "";

  // Lấy phần query ?vnp_...
  let search = "";
  try {
    const u = new URL(pastedUrl);
    search = u.search || "";
  } catch {
    // Nếu không phải URL đầy đủ, cố gắng lấy phần sau dấu ?
    const idx = pastedUrl.indexOf("?");
    search = idx >= 0 ? pastedUrl.slice(idx) : pastedUrl;
    if (search && search[0] !== "?") search = "?" + search;
  }

  // Lấy baseURL từ axios instance
  const base = (api?.defaults?.baseURL || "").replace(/\/+$/, "") || "";
  return `${base}${VERIFY_PATH}${search}`;
}

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

  // payment options
  const [paymentMethod, setPaymentMethod] = useState("CARD"); // "CARD" | "CASH"

  // sort UI
  const [sortKey, setSortKey] = useState("popular");

  // ===== Modal verify VNPay =====
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyUrlBuilt, setVerifyUrlBuilt] = useState("");
  const [verifyResult, setVerifyResult] = useState("");

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

      if (paymentMethod === "CASH") {
        message.success("Đã tạo đăng ký, thanh toán tiền mặt tại quầy.");
        setOpen(false);
        return;
      }

      const paymentUrl = typeof payRes?.data === "string" ? payRes.data : null;
      if (!paymentUrl) throw new Error("Không nhận được paymentUrl từ API.");

      // ✅ Mở VNPay ở tab mới
      window.open(paymentUrl, "_blank", "noopener,noreferrer");
      message.success("Đang mở trang thanh toán VNPay...");

      // ✅ Mở modal verify để người dùng dán link trả về
      setVerifyInput("");
      setVerifyUrlBuilt("");
      setVerifyResult("");
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

  // ----- Verify VNPay -----
  // eslint-disable-next-line no-unused-vars
  const handleBuildVerifyUrl = () => {
    const url = buildVerifyUrl(verifyInput.trim());
    setVerifyUrlBuilt(url);
    if (!url) {
      message.error(
        "Không dựng được verify URL. Vui lòng kiểm tra link đã dán."
      );
    }
  };

  const handleVerifyCall = async () => {
    try {
      setVerifyLoading(true);
      setVerifyResult("");

      const url = verifyUrlBuilt || buildVerifyUrl(verifyInput.trim());
      if (!url) {
        message.error("Thiếu verify URL.");
        return;
      }

      const headers = { accept: "*/*" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(url, { method: "GET", headers });
      const text = await res.text();
      setVerifyResult(text);

      if (res.ok) {
        message.success("Verify thành công");
      } else {
        message.error(`Verify thất bại (HTTP ${res.status})`);
      }
    } catch (e) {
      console.error(e);
      message.error("Lỗi khi gọi verify");
    } finally {
      setVerifyLoading(false);
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
      default:
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

  const openVerifyModalManual = () => {
    setVerifyInput("");
    setVerifyUrlBuilt("");
    setVerifyResult("");
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
        <Row align="middle" justify="space-between" gutter={[12, 12]}>
          <Col>
            <Space align="center" wrap>
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

              {/* ✅ Nút mở modal verify thủ công */}
              <Button
                onClick={openVerifyModalManual}
                icon={<CheckCircleOutlined />}
              >
                Xác thực VNPay
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ======= CONTENT PLANS ======= */}
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
            // eslint-disable-next-line no-unused-vars
            const isRecommended = plan.planId === recommendedId;
            const ppd = pricePerDay(plan);
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={plan.planId}>
                <Badge.Ribbon text="Active" color="green">
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

      {/* ===== Modal chọn gói / thanh toán ===== */}
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
                {/* <Radio value="CASH">Tiền mặt</Radio> */}
              </Radio.Group>
            </div>
            <div style={{ marginTop: 16 }}>
              <Text strong>Mã giảm giá (nếu có):</Text>
              <Input
                placeholder="Nhập mã voucher..."
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                maxLength={50}
                style={{ marginTop: 6 }}
              />
            </div>
          </Space>
        ) : (
          <Spin />
        )}
      </Modal>

      {/* ===== Modal verify VNPay sau khi bấm thanh toán ===== */}
      <Modal
        open={verifyOpen}
        onCancel={() => setVerifyOpen(false)}
        title="Xác thực thanh toán VNPay"
        footer={[
          // <Button key="build" onClick={handleBuildVerifyUrl}>
          //   Tạo verify URL
          // </Button>,
          <Button
            key="verify"
            type="primary"
            loading={verifyLoading}
            onClick={handleVerifyCall}
          >
            {verifyLoading ? "Đang xác thực..." : "Xác thực thanh toán"}
          </Button>,
        ]}
      >
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Text type="secondary">
            Sau khi thanh toán trên VNPay, dán URL VNPay trả về (ví dụ
            <code style={{ fontSize: 12 }}>
              {" "}
              .../payments/vnpay/return?...vnp_*{" "}
            </code>
            ) vào ô dưới đây để xác thực.
          </Text>

          <TextArea
            rows={3}
            placeholder="Paste URL trả về từ VNPay ở đây..."
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
          />

          {verifyUrlBuilt && (
            <>
              <Text type="secondary">Verify URL:</Text>
              <div
                style={{
                  overflowX: "auto",
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
              >
                {verifyUrlBuilt}
              </div>
            </>
          )}

          {verifyResult && (
            <pre
              style={{
                marginTop: 8,
                background: "#f6f6f6",
                padding: 12,
                borderRadius: 8,
                maxHeight: 280,
                overflow: "auto",
              }}
            >
              {verifyResult}
            </pre>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default Plans;
