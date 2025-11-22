// src/pages/manage-stockbattery/BatteryFilters.jsx
import React from "react";
import { Button, Select } from "antd";

const BatteryFilters = ({
  stationQuery,
  setStationQuery,
  stations,
  loadingStations,
  isStationMode,
  onApply,
  onClear,
}) => {
  return (
    <div
      style={{
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <div style={{ fontWeight: 500 }}>Lọc theo trạm:</div>
      <Select
        style={{ minWidth: 260 }}
        placeholder="Chọn trạm"
        showSearch
        loading={loadingStations}
        value={stationQuery || undefined}
        onChange={setStationQuery}
        optionFilterProp="label"
        options={stations.map((s) => ({
          value: s.stationId,
          label: `${s.name || `Trạm #${s.stationId}`} (ID: ${s.stationId})`,
        }))}
      />
      <Button type="primary" onClick={onApply}>
        Áp dụng
      </Button>
      {isStationMode && <Button onClick={onClear}>Xóa lọc</Button>}
    </div>
  );
};

export default BatteryFilters;
