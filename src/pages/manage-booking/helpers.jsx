// src/pages/manage-booking/helpers.js
import React from "react";
import { Tag } from "antd";
import dayjs from "dayjs";

export const fmtVN = (iso) =>
  iso ? dayjs(iso).add(7, "hour").format("DD/MM/YYYY HH:mm") : "-";

export const formatVnd = (n) =>
  typeof n === "number"
    ? n.toLocaleString("vi-VN") + " đ"
    : n
    ? Number(n).toLocaleString("vi-VN") + " đ"
    : "-";

export const bookingStatusTag = (s) => {
  const map = {
    PENDING: { color: "default", text: "PENDING" },
    CONFIRMED: { color: "blue", text: "CONFIRMED" },
    CANCELLED: { color: "red", text: "CANCELLED" },
  };
  const m = map[s] || { color: "default", text: s || "—" };
  return <Tag color={m.color}>{m.text}</Tag>;
};

export const swapStatusTag = (s) => {
  const map = {
    PENDING: { color: "blue" },
    CONFIRMED: { color: "blue" },
    PAID: { color: "gold" },
    COMPLETED: { color: "green" },
  };
  const m = map[s] || { color: "default" };
  return <Tag color={m.color}>{s}</Tag>;
};
