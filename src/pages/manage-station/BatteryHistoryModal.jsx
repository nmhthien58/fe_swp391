// src/pages/manage-station/BatteryHistoryModal.jsx
import React from "react";
import { Modal, Spin, Empty, Table } from "antd";

/**
 * Modal hiển thị lịch sử sử dụng pin.
 * Phần data (rows) đã được chuẩn hoá từ parent.
 */
const BatteryHistoryModal = ({ open, loading, rows, battery, onClose }) => {
  return (
    <Modal
      open={open}
      title={
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          Lịch sử sử dụng pin{" "}
          <span style={{ color: "#1677ff" }}>
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
      ) : rows && rows.length ? (
        <>
          {(() => {
            // đếm số lần pin chuyển sang trạng thái IN_USE
            const inUseCount = rows.filter((r) => {
              const s = `${r.event || ""} ${r.note || ""} ${
                r.raw?.notes || r.raw?.status || ""
              }`.toUpperCase();
              return s.includes("IN_USE");
            }).length;

            return (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 8,
                  background: "#fffbeb",
                  border: "1px solid #fed7aa",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 600, color: "#92400e" }}>
                  Tổng số lần đã sử dụng: {inUseCount}
                </div>
              </div>
            );
          })()}

          <Table
            size="small"
            rowKey={(r, i) => r.key ?? i}
            columns={[
              {
                title: "Thời điểm",
                dataIndex: "time",
                key: "time",
                render: (t) => (t ? new Date(t).toLocaleString("vi-VN") : "-"),
                width: 180,
              },
              {
                title: "Hành động",
                dataIndex: "event",
                key: "event",
                width: 140,
              },
              {
                title: "Trạm",
                dataIndex: "stationName",
                key: "stationName",
                width: 230,
                render: (v, r) =>
                  v || (r.stationId ? `Trạm #${r.stationId}` : "-"),
              },
              {
                title: "Ghi chú",
                dataIndex: "note",
                key: "note",
                ellipsis: true,
              },
            ]}
            dataSource={rows}
            pagination={{ pageSize: 8 }}
            bordered
          />
        </>
      ) : (
        <Empty description="Chưa có lịch sử sử dụng" />
      )}
    </Modal>
  );
};

export default BatteryHistoryModal;
