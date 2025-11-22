// src/pages/manage-booking/LatestSwapModal.jsx
import React from "react";
import { Modal, Space, Typography, Button } from "antd";
import { fmtVN } from "./helpers";

const { Text } = Typography;

const LatestSwapModal = ({ open, swap, stationsMap, onClose }) => {
  return (
    <Modal
      open={open}
      title="Giao dịch COMPLETED gần nhất của tài xế"
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      destroyOnClose
    >
      {swap ? (
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Text>
            <Text strong>Swap ID: </Text>#{swap.swapId}
          </Text>
          <Text>
            <Text strong>ID pin đã đổi: </Text>
            {swap.reservedBatteryId ?? "-"}
          </Text>
          <Text>
            <Text strong>Thời gian hoàn thành: </Text>
            {fmtVN(swap.completedAt || swap.updatedAt || swap.createdAt)}
          </Text>
          <Text>
            <Text strong>Trạm: </Text>
            {stationsMap.get(swap.stationId) || `Trạm #${swap.stationId}`}
          </Text>
        </Space>
      ) : (
        <Text>Tài xế này chưa có giao dịch COMPLETED nào.</Text>
      )}
    </Modal>
  );
};

export default LatestSwapModal;
