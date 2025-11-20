// src/pages/map-only/index.jsx
import React from "react";
import { Layout } from "antd";
import MapViewing from "../../components/map/MapViewing";

const { Content } = Layout;

const MapOnlyPage = () => {
  const handleBook = (stationId) => {
    console.log("Đặt lịch cho trạm:", stationId);
    // ở đây bạn có thể mở modal React riêng, hoặc chỉ dùng cho view
  };

  return (
    <Content style={{ padding: "24px 50px" }}>
      <MapViewing onBookStation={handleBook} />
    </Content>
  );
};

export default MapOnlyPage;
