import React from "react";
import { Modal, Spin, Empty, Descriptions } from "antd";

const BatteryHealthModal = ({ open, loading, data, battery, onClose }) => {
  return (
    <Modal
      open={open}
      title={
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          Tình trạng sức khỏe pin{" "}
          <span style={{ color: "#16a34a" }}>
            {battery?.serialNumber
              ? `- ${battery.serialNumber}`
              : battery?.batteryId
              ? `#${battery.batteryId}`
              : ""}
          </span>
        </div>
      }
      footer={null}
      onCancel={onClose}
      width={860}
      bodyStyle={{ padding: "18px 22px" }}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      ) : data ? (
        <>
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 180,
                padding: 16,
                borderRadius: 10,
                background: "#ecfdf3",
                border: "1px solid #bbf7d0",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#166534",
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                Tình trạng Sức khỏe (SOH %)
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#16a34a",
                }}
              >
                {data.stateOfHealthPercent ?? "-"}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 180,
                padding: 16,
                borderRadius: 10,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#1d4ed8",
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                Tổng số lượt đổi pin
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#2563eb",
                }}
              >
                {data.totalSwapCount ?? "-"}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 180,
                padding: 16,
                borderRadius: 10,
                background: "#fffbeb",
                border: "1px solid #fed7aa",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#92400e",
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                Tình trạng hiện tại
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#b45309",
                }}
              >
                {data.currentCondition ?? "-"}
              </div>
            </div>
          </div>

          {/* Bảng mô tả chi tiết */}
          <Descriptions
            bordered
            size="small"
            column={2}
            labelStyle={{ width: 220 }}
          >
            <Descriptions.Item label="Tình trạng Sức khỏe (SOH %)">
              {data.stateOfHealthPercent ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Dung lượng (Wh)">
              {data.capacityWh ?? battery?.capacityWh ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="SOC trung bình khi trả về">
              {data.averageSoCOnReturn ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Số lượt đổi / tháng (ước tính)">
              {data.averageSwapPerMonth ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật gần nhất">
              {data.updatedAt
                ? new Date(data.updatedAt).toLocaleString("vi-VN")
                : "-"}
            </Descriptions.Item>
          </Descriptions>
        </>
      ) : (
        <Empty description="Không có dữ liệu sức khỏe pin" />
      )}
    </Modal>
  );
};

export default BatteryHealthModal;
