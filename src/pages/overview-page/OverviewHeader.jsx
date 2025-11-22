// src/pages/AdminRevenue/OverviewHeader.jsx
import React from "react";
import { Select, DatePicker } from "antd";

const { Option } = Select;
const { RangePicker } = DatePicker;

const OverviewHeader = ({
  timeRange,
  selectedDates,
  setTimeRange,
  setSelectedDates,
}) => {
  return (
    <div
      style={{
        marginBottom: 24,
        padding: 16,
        borderRadius: 12,
        background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(148,163,184,0.35)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
          Báo cáo & Thống kê doanh thu
        </h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Theo dõi doanh thu từ gói đăng ký và giao dịch đổi pin.
        </p>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Select
          value={timeRange}
          onChange={(value) => {
            setTimeRange(value);
            if (value !== "custom") {
              setSelectedDates(null);
            }
          }}
          style={{ width: 140 }}
          size="middle"
        >
          <Option value="day">Hôm nay</Option>
          <Option value="week">Tuần này</Option>
          <Option value="month">Tháng này</Option>
          <Option value="year">Năm nay</Option>
          <Option value="custom">Tùy chỉnh</Option>
        </Select>
        {timeRange === "custom" && (
          <RangePicker
            value={selectedDates}
            onChange={(dates) => setSelectedDates(dates)}
            format="DD/MM/YYYY"
            size="middle"
          />
        )}
      </div>
    </div>
  );
};

export default OverviewHeader;
