// src/pages/manage-user/UserHeader.jsx
import React from "react";

const UserHeader = ({ onAddStaff, addButton }) => {
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
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 4,
          }}
        >
          Quản lý tài khoản người dùng
        </div>
        <div style={{ color: "#64748b", fontSize: 13 }}>
          Xem danh sách tài khoản driver / staff, tạo mới Staff và gán Staff vào
          trạm làm việc.
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }} onClick={onAddStaff}>
        {addButton}
      </div>
    </div>
  );
};

export default UserHeader;
