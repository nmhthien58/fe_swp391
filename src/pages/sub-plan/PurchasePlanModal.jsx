import React from "react";
import {
  Modal,
  Typography,
  Space,
  Tag,
  Switch,
  Radio,
  Input,
  Spin,
} from "antd";

const { Text } = Typography;

const PurchasePlanModal = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  selectedPlan,
  autoRenew,
  setAutoRenew,
  paymentMethod,
  setPaymentMethod,
  voucherCode,
  setVoucherCode,
  currencyVND,
  PlanHeaderIcon,
}) => {
  const Icon = PlanHeaderIcon;

  return (
    <Modal
      open={open}
      onOk={onOk}
      onCancel={onCancel}
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
              <Icon name={selectedPlan.name} />
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
              <strong>Lượt đổi miễn phí:</strong> {selectedPlan.swapLimit ?? 0}
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
  );
};

export default PurchasePlanModal;
