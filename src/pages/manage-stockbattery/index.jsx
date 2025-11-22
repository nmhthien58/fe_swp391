// src/pages/manage-stockbattery/index.jsx
import React, { useEffect, useState } from "react";
import { Button, Space, message } from "antd";
import { useForm } from "antd/es/form/Form";
import {
  getBatteries,
  createBatteryAtStation,
  updateBatteryStatus,
  BATTERY_STATUS,
  getBatteriesByStationId,
} from "../../services/batteries";
import api from "../../config/axios";
import BatteryStats from "./BatteryStats";
import BatteryFilters from "./BatteryFilter";
import BatteryTable from "./BatteryTable";
import CreateBatteryModal from "./CreateBatteryModal";
import PatchBatteryModal from "./PatchBatteryModal";

const API_PAGE_SIZE = 50; // số pin lấy từ API
const UI_PAGE_SIZE = 7; // số pin hiển thị mỗi trang trên Table

const ManageStockBattery = () => {
  const [formCreate] = useForm();
  const [formPatch] = useForm();

  const [openCreate, setOpenCreate] = useState(false);
  const [openPatch, setOpenPatch] = useState(false);
  const [loading, setLoading] = useState(false);

  const [batteries, setBatteries] = useState([]);
  const [page, setPage] = useState(1);
  const [currentBattery, setCurrentBattery] = useState(null);

  const [stats, setStats] = useState({
    FULL: 0,
    AVAILABLE: 0,
    CHARGING: 0,
    MAINTENANCE: 0,
    IN_USE: 0,
    EMPTY: 0,
  });

  // station filter
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [stationQuery, setStationQuery] = useState("");
  const [isStationMode, setIsStationMode] = useState(false);

  // ===== helpers =====
  const applyStats = (items) => {
    const counts = {
      FULL: 0,
      AVAILABLE: 0,
      CHARGING: 0,
      MAINTENANCE: 0,
      IN_USE: 0,
      EMPTY: 0,
    };
    items.forEach((b) => {
      if (counts[b.status] !== undefined) counts[b.status] += 1;
    });
    setStats(counts);
  };

  // ===== API =====
  const fetchBatteries = async () => {
    setLoading(true);
    try {
      const res = await getBatteries({ page: 0, size: API_PAGE_SIZE });
      const items = res?.content || [];
      setBatteries(items);
      applyStats(items);
      setIsStationMode(false);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    setLoadingStations(true);
    try {
      const res = await api.get("/api/stations/search", {
        params: { keyword: " " },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setStations(list);
    } catch (e) {
      console.error(e);
      message.error("Không tải được danh sách trạm");
    } finally {
      setLoadingStations(false);
    }
  };

  useEffect(() => {
    fetchBatteries();
    fetchStations();
  }, []);

  const handleCreate = async (values) => {
    try {
      await createBatteryAtStation(values.stationId, values.status);
      message.success("Tạo pin thành công!");
      setOpenCreate(false);
      formCreate.resetFields();
      fetchBatteries();
    } catch (e) {
      message.error(e?.response?.data?.message || "Tạo pin thất bại");
    }
  };

  const handlePatch = async (values) => {
    try {
      await updateBatteryStatus(currentBattery.batteryId, values);
      message.success("Cập nhật trạng thái thành công!");
      setOpenPatch(false);
      formPatch.resetFields();
      setCurrentBattery(null);
      fetchBatteries();
    } catch (e) {
      message.error(e?.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleSearchByStation = async () => {
    if (!stationQuery) {
      return message.warning("Vui lòng chọn trạm");
    }
    setLoading(true);
    try {
      const list = await getBatteriesByStationId(stationQuery);
      setBatteries(list);
      applyStats(list);
      setIsStationMode(true);
      setPage(1);

      const station = stations.find((s) => s.stationId === stationQuery);
      const stationName =
        station?.name || `Trạm #${stationQuery ?? ""}` || "trạm đã chọn";

      message.success(`Đã tải ${list.length} pin của ${stationName}`);
    } catch (e) {
      message.error(
        e?.response?.data?.message || "Không thể tải danh sách pin theo trạm"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearStationFilter = () => {
    setStationQuery("");
    setIsStationMode(false);
    fetchBatteries();
  };

  const handleOpenPatch = (battery) => {
    setCurrentBattery(battery);
    setOpenPatch(true);
    formPatch.setFieldsValue({
      status: battery.status,
      reason: "",
      adminOverride: true,
    });
  };

  return (
    <>
      {/* Header */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Quản lý tồn kho pin
          </h2>
          <p style={{ margin: 0, color: "#64748b" }}>
            Theo dõi trạng thái pin tại các trạm và cập nhật nhanh.
          </p>
        </div>

        <Space>
          <Button type="default" onClick={fetchBatteries}>
            Tải lại dữ liệu
          </Button>
          <Button type="primary" onClick={() => setOpenCreate(true)}>
            Thêm pin mới
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <BatteryStats stats={stats} />

      {/* Filters */}
      <BatteryFilters
        stationQuery={stationQuery}
        setStationQuery={setStationQuery}
        stations={stations}
        loadingStations={loadingStations}
        isStationMode={isStationMode}
        onApply={handleSearchByStation}
        onClear={handleClearStationFilter}
      />

      {/* Table */}
      <BatteryTable
        data={batteries}
        loading={loading}
        page={page}
        setPage={setPage}
        pageSize={UI_PAGE_SIZE}
        onOpenPatch={handleOpenPatch}
        BATTERY_STATUS={BATTERY_STATUS}
      />

      {/* Modals */}
      <CreateBatteryModal
        open={openCreate}
        onCancel={() => setOpenCreate(false)}
        form={formCreate}
        stations={stations}
        loadingStations={loadingStations}
        onSubmit={handleCreate}
        BATTERY_STATUS={BATTERY_STATUS}
      />

      <PatchBatteryModal
        open={openPatch}
        onCancel={() => {
          setOpenPatch(false);
          setCurrentBattery(null);
        }}
        form={formPatch}
        currentBattery={currentBattery}
        onSubmit={handlePatch}
        BATTERY_STATUS={BATTERY_STATUS}
      />
    </>
  );
};

export default ManageStockBattery;
