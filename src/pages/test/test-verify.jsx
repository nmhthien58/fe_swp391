// src/pages/TestVerify.jsx
import React, { useState } from "react";
import { Button, Card, Typography, message } from "antd";
import { useSelector } from "react-redux";

const { Text } = Typography;

const VERIFY_URL = `https://ev-battery-swap-station-m-ngement-system.onrender.com/api/payments/verify?vnp_Amount=3000000&vnp_BankCode=NCB&vnp_BankTranNo=VNP15225313&vnp_CardType=ATM&vnp_OrderInfo=Thanh+toan+don+hang%3A6&vnp_PayDate=20251029163349&vnp_ResponseCode=00&vnp_TmnCode=QOUUJAL4&vnp_TransactionNo=15225313&vnp_TransactionStatus=00&vnp_TxnRef=6&vnp_SecureHash=ecb19ddf06db8c26dcb6bab7586bf2b4387f58f7e184bda059b2e90e4b4e85b115186abe987a0f28308f2246d828058159d37538a2881758d51a87efa551f948`;

const TestVerify = () => {
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const token = useSelector((state) => state.account?.token); // ✅ Lấy token từ Redux store

  const handleVerify = async () => {
    try {
      setLoading(true);
      setResultText("");

      const headers = {
        accept: "*/*",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`; // ✅ Gửi kèm token nếu có
      }

      const res = await fetch(VERIFY_URL, {
        method: "GET",
        headers,
      });

      const text = await res.text();
      setResultText(text);

      if (!res.ok) {
        message.error(`Verify thất bại (HTTP ${res.status})`);
      } else {
        message.success("Verify thành công");
      }
    } catch (e) {
      console.error(e);
      message.error("Lỗi khi gọi verify");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Test Verify VNPay (Redux Token)"
      style={{ maxWidth: 800, margin: "24px auto" }}
    >
      <Button
        type="primary"
        size="large"
        onClick={handleVerify}
        loading={loading}
      >
        {loading ? "Đang xác thực..." : "Thanh toán (verify)"}
      </Button>

      <div style={{ marginTop: 16 }}>
        <Text type="secondary">URL verify:</Text>
        <div
          style={{ overflowX: "auto", fontFamily: "monospace", fontSize: 12 }}
        >
          {VERIFY_URL}
        </div>
      </div>

      {token && (
        <div style={{ marginTop: 8 }}>
          <Text type="success">Token đang dùng: </Text>
          <code style={{ fontSize: 12 }}>{token.slice(0, 40)}...</code>
        </div>
      )}

      {resultText && (
        <pre
          style={{
            marginTop: 16,
            background: "#f6f6f6",
            padding: 12,
            borderRadius: 8,
            maxHeight: 320,
            overflow: "auto",
          }}
        >
          {resultText}
        </pre>
      )}
    </Card>
  );
};

export default TestVerify;
