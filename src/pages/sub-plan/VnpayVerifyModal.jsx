import React, { useState } from "react";
import { Modal, Typography, Space, Input, Button, message } from "antd";
import api from "../../config/axios";

const { Text } = Typography;
const { TextArea } = Input;

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

const VnpayVerifyModal = ({ open, onClose, token }) => {
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyUrlBuilt, setVerifyUrlBuilt] = useState("");
  const [verifyResult, setVerifyResult] = useState("");

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

  return (
    <Modal
      open={open}
      onCancel={onClose}
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
      <Space direction="vertical" style={{ width: "100%" }} size={8}>
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
  );
};

export default VnpayVerifyModal;
