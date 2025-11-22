// src/pages/manage-stockbattery/BatteryStats.jsx
import React from "react";

const cardStyle = (bg, border) => ({
  flex: 1,
  padding: 18,
  background: bg,
  borderRadius: 12,
  border: `1px solid ${border}`,
  boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  justifyContent: "space-between",
  minWidth: 160,
});

const BatteryStats = ({ stats }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        marginBottom: 20,
        flexWrap: "wrap",
      }}
    >
      <div style={cardStyle("#f6ffed", "#b7eb8f")}>
        <div style={{ color: "#52c41a", fontWeight: 600 }}>
          Pin đầy / sẵn sàng
        </div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.FULL}</div>
      </div>

      <div style={cardStyle("#e6f7ff", "#91d5ff")}>
        <div style={{ color: "#1677ff", fontWeight: 600 }}>Đang sạc</div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.CHARGING}</div>
      </div>

      <div style={cardStyle("#fff7e6", "#ffd591")}>
        <div style={{ color: "#fa8c16", fontWeight: 600 }}>Bảo dưỡng</div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.MAINTENANCE}</div>
      </div>

      <div style={cardStyle("#fff1f0", "#ffa39e")}>
        <div style={{ color: "#cf1322", fontWeight: 600 }}>Đang sử dụng</div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.IN_USE}</div>
      </div>
    </div>
  );
};

export default BatteryStats;
