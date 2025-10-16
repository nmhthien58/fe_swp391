// src/services/batteries.js
import api from "../config/axios";

// params hỗ trợ: status, model, stationId, capacityMin, capacityMax, page, size, sort
// Danh sách status đúng theo Swagger
export const BATTERY_STATUS = [
  "FULL",
  "EMPTY",
  "CHARGING",
  "RESERVED",
  "IN_USE",
  "MAINTENANCE",
  "DAMAGED",
];

// GET /api/batteries
export async function getBatteries(params = {}) {
  const defaults = { page: 0, size: 20, sort: "serialNumber,asc" };
  const clean = {};
  Object.entries({ ...defaults, ...params }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") clean[k] = v;
  });
  const res = await api.get("/api/batteries", { params: clean });
  return res.data;
}

// POST /api/batteries/station/{stationId}?status=FULL
export async function createBatteryAtStation(stationId, status) {
  if (!stationId) throw new Error("stationId is required");
  if (!status) throw new Error("status is required");
  const res = await api.post(`/api/batteries/station/${stationId}`, null, {
    params: { status },
  });
  return res.data;
}

// PATCH /api/batteries/{id}/status
// body: { status, reason?, adminOverride? }
export async function updateBatteryStatus(batteryId, payload) {
  if (!batteryId) throw new Error("batteryId is required");
  if (!payload?.status) throw new Error("status is required");
  const res = await api.patch(`/api/batteries/${batteryId}/status`, payload);
  return res.data; // battery sau khi cập nhật
}