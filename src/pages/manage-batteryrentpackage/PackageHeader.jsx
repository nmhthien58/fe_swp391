// src/pages/manage-batteryrentpackage/PackageHeader.jsx
import React from "react";
import { Button } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";

const PackageHeader = ({ onCreate, onReload, loading }) => {
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
        <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
          Quản lý gói thuê pin
        </div>
        <div style={{ color: "#64748b", fontSize: 13 }}>
          Tạo, chỉnh sửa và vô hiệu hóa các gói thuê pin theo tháng / số lượt
          swap.
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading}>
          Tải lại
        </Button>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreate}
          style={{
            fontWeight: 600,
            borderRadius: 8,
            boxShadow: "0 6px 16px rgba(59,130,246,0.35)",
          }}
        >
          Thêm gói thuê
        </Button>
      </div>
    </div>
  );
};

export default PackageHeader;
