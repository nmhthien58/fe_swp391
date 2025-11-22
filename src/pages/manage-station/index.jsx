// src/pages/manage-station/index.jsx
import React, { useEffect, useState } from "react";
import { Button } from "antd";
import { useForm } from "antd/es/form/Form";
import { PlusOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import api from "../../config/axios";

import StationTable from "./StationTable";
import StationFormModal from "./StationFormModal";
import BatteryHistoryModal from "./BatteryHistoryModal";
import BatteryHealthModal from "./BatteryHealthModal";

const ManageStation = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

  // form modal tạo / sửa trạm
  const [form] = useForm();
  const [stationModalOpen, setStationModalOpen] = useState(false);

  // phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // expand danh sách pin theo station
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [batteriesByStation, setBatteriesByStation] = useState({});
  const [loadingBatteries, setLoadingBatteries] = useState({});

  // modal lịch sử / sức khỏe pin
  const [activeBattery, setActiveBattery] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);

  const [healthOpen, setHealthOpen] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthData, setHealthData] = useState(null);

  // helper: đếm số pin khả dụng
  const calcAvailable = (arr) => {
    if (!Array.isArray(arr)) return 0;
    const OK = new Set(["FULL", "FULLY_CHARGED", "AVAILABLE"]);
    return arr.filter((b) => OK.has(b.status)).length;
  };

  // load danh sách trạm
  const fetchStations = async (
    page = pagination.current,
    size = pagination.pageSize,
    sorter
  ) => {
    setLoading(true);
    try {
      const params = { page: page - 1, size };
      if (sorter && sorter.field && sorter.order) {
        const dir = sorter.order === "ascend" ? "asc" : "desc";
        params.sort = `${sorter.field},${dir}`;
      }

      const res = await api.get("/api/stations", { params });
      const data = res.data || {};
      const content = data.content || [];
      const total = data.totalElements ?? content.length;

      const withAvail = content.map((st) => ({
        ...st,
        availableBatteries:
          st.availableBatteries ?? calcAvailable(st.batteries),
      }));

      setStations(withAvail);
      setPagination({
        current: (data.pageable?.pageNumber ?? 0) + 1,
        pageSize: data.pageable?.pageSize ?? size,
        total,
      });
    } catch (err) {
      console.error("Fetch stations error:", err);
      toast.error("Không tải được danh sách trạm (cần quyền admin?).");
    } finally {
      setLoading(false);
    }
  };

  // xoá trạm
  const handleDeleteStation = async (stationId) => {
    try {
      await api.delete(`/api/stations/${stationId}`);
      toast.success("Đã xóa trạm thành công!");
      setExpandedRowKeys((prev) => prev.filter((k) => k !== stationId));
      fetchStations();
    } catch (err) {
      console.error("Delete station error:", err);
      toast.error("Xóa trạm thất bại.");
    }
  };

  // tạo / cập nhật trạm
  const handleSubmitStationForm = async (values) => {
    const payload = {
      name: values.name?.trim(),
      address: values.address?.trim(),
      latitude: parseFloat(values.latitude),
      longitude: parseFloat(values.longitude),
      capacity: parseInt(values.capacity, 10),
      status: values.status,
    };

    if (
      Number.isNaN(payload.latitude) ||
      Number.isNaN(payload.longitude) ||
      Number.isNaN(payload.capacity)
    ) {
      toast.error("Vĩ độ, kinh độ hoặc sức chứa phải là số hợp lệ!");
      return;
    }

    try {
      if (values.stationId) {
        // update
        await api.put(`/api/stations/${values.stationId}`, {
          ...payload,
          imageUrl: undefined,
        });
        toast.success("Cập nhật trạm thành công!");
      } else {
        // create
        const fd = new FormData();
        const file = values.image?.[0]?.originFileObj;
        if (file) fd.append("image", file);

        await api.post("/api/stations/create", fd, {
          params: {
            name: payload.name,
            address: payload.address,
            latitude: payload.latitude,
            longitude: payload.longitude,
            capacity: payload.capacity,
            status: payload.status,
          },
        });

        toast.success("Tạo trạm mới thành công!");
      }

      setStationModalOpen(false);
      form.resetFields();
      fetchStations();
    } catch (err) {
      console.error("Upsert station error:", err.response?.data || err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Tạo / sửa trạm thất bại.";
      toast.error(msg);
    }
  };

  // lazy load batteries cho 1 station
  const loadBatteriesForStation = async (station) => {
    const sid = station.stationId ?? station.id;
    if (!sid) return;
    if (Array.isArray(station.batteries)) {
      setBatteriesByStation((m) => ({ ...m, [sid]: station.batteries }));
      return;
    }
    if (Array.isArray(batteriesByStation[sid])) return;

    try {
      setLoadingBatteries((m) => ({ ...m, [sid]: true }));
      let batteries = [];
      try {
        const detail = await api.get(`/api/stations/${sid}`);
        const b1 = detail?.data?.batteries;
        if (Array.isArray(b1)) batteries = b1;
      } catch {
        // ignore
      }
      if (!batteries.length) {
        try {
          const bRes = await api.get(`/api/stations/${sid}/batteries`);
          const b2 = bRes?.data;
          if (Array.isArray(b2)) batteries = b2;
        } catch {
          // ignore
        }
      }

      setBatteriesByStation((m) => ({ ...m, [sid]: batteries }));
    } catch (err) {
      console.error("Load batteries error:", err);
      toast.error("Không tải được danh sách pin của trạm này.");
    } finally {
      setLoadingBatteries((m) => ({ ...m, [sid]: false }));
    }
  };

  // expand / collapse row
  const handleToggleExpand = async (record) => {
    const key = record.stationId ?? record.id;
    const isOpen = expandedRowKeys.includes(key);
    if (isOpen) {
      setExpandedRowKeys((prev) => prev.filter((k) => k !== key));
    } else {
      setExpandedRowKeys((prev) => [...prev, key]);
      await loadBatteriesForStation(record);
    }
  };

  // đổi trang / sort Table
  const handleTableChange = (pager, _filters, sorter) => {
    const next = {
      ...pagination,
      current: pager.current,
      pageSize: pager.pageSize,
    };
    setPagination(next);
    fetchStations(pager.current, pager.pageSize, sorter);
  };

  // mở form sửa trạm
  const handleEditStation = (record) => {
    setStationModalOpen(true);
    form.setFieldsValue({
      stationId: record.stationId,
      name: record.name,
      address: record.address,
      status: record.status,
      capacity: record.capacity,
      latitude: record.latitude,
      longitude: record.longitude,
      image: [],
    });
  };

  // mở lịch sử pin
  const handleOpenHistory = async (battery) => {
    setActiveBattery(battery);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const id = battery.batteryId ?? battery.id;
      const res = await api.get(`/api/batteries/${id}/history`);
      const raw = res?.data?.content || res?.data?.result || res?.data || [];

      const norm = (Array.isArray(raw) ? raw : []).map((x, i) => ({
        key: i,
        time: x.time || x.timestamp || x.createdAt || x.updatedAt,
        event: x.event || x.action || x.statusChange || x.type,
        stationName:
          x.stationName ||
          x.station?.name ||
          x.fromStation?.name ||
          x.toStation?.name,
        note: x.note || x.notes || x.description || "",
        raw: x,
      }));

      setHistoryRows(norm);
    } catch (e) {
      console.error(e);
      toast.error("Không tải được lịch sử pin.");
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // mở sức khỏe pin
  const handleOpenHealth = async (battery) => {
    setActiveBattery(battery);
    setHealthOpen(true);
    setHealthLoading(true);
    try {
      const id = battery.batteryId ?? battery.id;
      const res = await api.get(`/api/batteries/${id}/health`);
      const data = res?.data?.result || res?.data || null;
      setHealthData(data);
    } catch (e) {
      console.error(e);
      toast.error("Không tải được thông tin sức khỏe pin.");
      setHealthData(null);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 24 }}>
      {/* header */}
      <div
        style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 12,
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(148,163,184,0.25)",
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
            Quản lý trạm sạc & kho pin
          </div>
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Xem danh sách trạm, số lượng pin khả dụng và tra cứu lịch sử / sức
            khỏe từng pin.
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setStationModalOpen(true);
          }}
          style={{
            fontWeight: 600,
            boxShadow: "0 6px 16px rgba(37,99,235,0.25)",
          }}
        >
          Thêm trạm mới
        </Button>
      </div>

      {/* bảng trạm + pin */}
      <StationTable
        data={stations}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        expandedRowKeys={expandedRowKeys}
        onToggleExpand={handleToggleExpand}
        batteriesByStation={batteriesByStation}
        loadingBatteries={loadingBatteries}
        onEdit={handleEditStation}
        onDelete={handleDeleteStation}
        onOpenBatteryHistory={handleOpenHistory}
        onOpenBatteryHealth={handleOpenHealth}
      />

      {/* modal tạo / sửa trạm */}
      <StationFormModal
        open={stationModalOpen}
        form={form}
        onCancel={() => setStationModalOpen(false)}
        onSubmit={handleSubmitStationForm}
      />

      {/* modal lịch sử pin */}
      <BatteryHistoryModal
        open={historyOpen}
        loading={historyLoading}
        rows={historyRows}
        battery={activeBattery}
        onClose={() => {
          setHistoryOpen(false);
          setActiveBattery(null);
        }}
      />

      {/* modal sức khỏe pin */}
      <BatteryHealthModal
        open={healthOpen}
        loading={healthLoading}
        data={healthData}
        battery={activeBattery}
        onClose={() => {
          setHealthOpen(false);
          setActiveBattery(null);
        }}
      />
    </div>
  );
};

export default ManageStation;
