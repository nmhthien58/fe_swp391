// src/pages/manage-support-ticket/index.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Typography, Space, message } from "antd";
import api from "../../config/axios";
import SupportTicketHeader from "./SupportTicketHeader";
import SupportTicketFilterBar from "./SupportTicketFilterBar";
import SupportTicketTable from "./SupportTicketTable";

const { Title, Text } = Typography;

const ManageSupportTicket = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  const [drivers, setDrivers] = useState([]);
  const [driverMap, setDriverMap] = useState(new Map());
  const [stationsMap, setStationsMap] = useState(new Map());

  const [filterDriverId, setFilterDriverId] = useState(null);

  // ===== LOAD DATA: drivers + stations + all tickets =====
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Lấy driver & station
      const [driversRes, stationsRes] = await Promise.all([
        api.get("/api/getDrivers"),
        api.get("/api/stations", {
          params: { page: 0, size: 100, sort: "name,asc" },
        }),
      ]);

      const driverList = driversRes?.data?.result || [];
      setDrivers(driverList);
      setDriverMap(new Map(driverList.map((d) => [d.driverId, d])));

      const stationContent = stationsRes?.data?.content || [];
      setStationsMap(
        new Map(stationContent.map((s) => [s.stationId ?? s.id, s]))
      );

      // 2. Gọi tất cả ticket theo từng driver (do BE chưa có API get-all)
      const ticketResults = await Promise.all(
        driverList.map((d) =>
          api
            .get(`/api/support/driver/${d.driverId}`)
            .then((res) => ({
              driverId: d.driverId,
              tickets: res.data,
            }))
            .catch(() => ({
              driverId: d.driverId,
              tickets: [],
            }))
        )
      );

      const mergedTickets = [];
      ticketResults.forEach(({ driverId, tickets }) => {
        const arr = Array.isArray(tickets) ? tickets : tickets?.result || [];
        arr.forEach((t) => {
          mergedTickets.push({
            ...t,
            driverId: t.driverId ?? driverId,
          });
        });
      });

      setTickets(mergedTickets);
    } catch (err) {
      console.error(err);
      message.error("Không tải được dữ liệu ticket / tài xế / trạm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ===== FILTER CLIENT-SIDE =====
  const handleApplyFilter = (driverId) => {
    setFilterDriverId(driverId || null);
  };

  const handleClearFilter = () => {
    setFilterDriverId(null);
  };

  const filteredTickets = useMemo(
    () =>
      filterDriverId
        ? tickets.filter((t) => t.driverId === filterDriverId)
        : tickets,
    [tickets, filterDriverId]
  );

  const totalTickets = tickets.length;

  // ===== ACTION: RESOLVE =====
  const handleResolve = async (ticketId) => {
    setResolvingId(ticketId);
    try {
      await api.put(`/api/support/${ticketId}/resolve`);
      message.success(`Đã đánh dấu ticket #${ticketId} là đã xử lý.`);
      await loadAllData();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Xử lý ticket thất bại.";
      message.error(msg);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
        border: "1px solid #e5e7eb",
      }}
      bodyStyle={{ padding: 24 }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <SupportTicketHeader totalTickets={totalTickets} />

        <SupportTicketFilterBar
          drivers={drivers}
          loading={loading}
          currentFilterDriverId={filterDriverId}
          onApplyFilter={handleApplyFilter}
          onClearFilter={handleClearFilter}
          onReload={loadAllData}
        />

        <SupportTicketTable
          tickets={filteredTickets}
          loading={loading}
          driverMap={driverMap}
          stationsMap={stationsMap}
          resolvingId={resolvingId}
          onResolve={handleResolve}
        />
      </Space>
    </Card>
  );
};

export default ManageSupportTicket;
