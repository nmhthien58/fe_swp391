import React, { useEffect, useMemo, useState } from "react";
import { Card, Tabs, Space, Button, Input, Typography, message } from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { createBatteryAtStation } from "../../services/batteries";

import PendingBookingsTable from "./PendingBookingsTable";
import ActiveSwapsTable from "./ActiveSwapsTable";
import HistorySection from "./HistorySection";
import PaySwapModal from "./PaySwapModal";
import InspectSwapModal from "./InspectSwapModal";
import LatestSwapModal from "./LatestSwapModal";
import SummaryStats from "./SummaryStats";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// API endpoints
const GET_BOOKINGS_URL = `/api/booking/view`;
const GET_SWAPS_URL = `/api/swaps`;
const CONFIRM_SWAP_URL = (bookingId) => `/api/swaps/${bookingId}/confirm`;
const CANCEL_BOOKING_URL = (bookingId) => `/api/booking/${bookingId}/cancel`;
const PAY_SWAP_URL = (swapId) => `/api/swaps/${swapId}/pay`;
const INSPECT_SWAP_URL = (swapId) => `/api/swaps/${swapId}/inspect-return`;

const ManageSwap = () => {
  // data
  const [bookings, setBookings] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [stationsMap, setStationsMap] = useState(new Map());

  // ui
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  // Pay modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingSwap, setPayingSwap] = useState(null);
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Inspect modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectingSwap, setInspectingSwap] = useState(null);
  const [inspectSubmitting, setInspectSubmitting] = useState(false);

  // Latest swap modal
  const [latestModalOpen, setLatestModalOpen] = useState(false);
  const [latestSwap, setLatestSwap] = useState(null);

  // ===== fetch stations =====
  const fetchStations = async () => {
    try {
      const res = await api.get("/api/stations/search", {
        params: { keyword: " " },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setStationsMap(
        new Map(
          list.map((s) => [s.stationId, s.name || `Trạm #${s.stationId}`])
        )
      );
    } catch (e) {
      console.error(e);
      setStationsMap(new Map());
    }
  };

  // ===== fetch bookings + swaps =====
  const fetchAll = async () => {
    setLoading(true);
    try {
      const resB = await api.get(GET_BOOKINGS_URL);
      setBookings(Array.isArray(resB.data) ? resB.data : []);

      const resS = await api.get(GET_SWAPS_URL, {
        params: { page: 0, size: 50, sort: "createdAt,desc" },
      });
      setSwaps(resS?.data?.result?.content ?? []);
    } catch (e) {
      console.error(e);
      message.error("Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchStations();
  }, []);

  // ===== Latest Completed Swap =====
  const getLatestCompletedSwapOfDriver = (driverId) => {
    const list = swaps.filter(
      (s) => s.status === "COMPLETED" && String(s.driverId) === String(driverId)
    );
    if (!list.length) return null;

    return list.reduce((a, b) => {
      const t1 = new Date(
        a.completedAt || a.updatedAt || a.createdAt
      ).getTime();
      const t2 = new Date(
        b.completedAt || b.updatedAt || b.createdAt
      ).getTime();
      return t2 > t1 ? b : a;
    });
  };

  const openLatestSwapModal = (driverId) => {
    const latest = getLatestCompletedSwapOfDriver(driverId);
    setLatestSwap(latest);
    setLatestModalOpen(true);
    if (!latest) message.info("Tài xế này chưa có giao dịch COMPLETED nào.");
  };

  // ===== BOOKING PENDING =====
  const pendingBookings = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return bookings
      .filter((b) => b.status === "PENDING")
      .filter((b) => {
        if (!kw) return true;
        const stationName = stationsMap.get(b.stationId) || "";
        const txt =
          `${b.bookingId} ${b.driverId} ${b.stationId} ${stationName}`.toLowerCase();
        return txt.includes(kw);
      })
      .sort(
        (a, b) =>
          new Date(a.bookingTime || 0).getTime() -
          new Date(b.bookingTime || 0).getTime()
      );
  }, [bookings, keyword, stationsMap]);

  const handleConfirmSwap = async (record) => {
    try {
      await api.post(CONFIRM_SWAP_URL(record.bookingId));
      message.success(`Đã xác nhận swap cho booking #${record.bookingId}`);
      fetchAll();
    } catch (e) {
      message.error(e?.response?.data?.message || "Xác nhận swap thất bại.");
    }
  };

  const handleCancelBooking = async (record) => {
    try {
      await api.put(CANCEL_BOOKING_URL(record.bookingId));
      message.success(`Đã hủy booking #${record.bookingId}`);
      fetchAll();
    } catch (e) {
      message.error(e?.response?.data?.message || "Hủy booking thất bại.");
    }
  };

  // ===== ACTIVE SWAPS =====
  const activeSwaps = useMemo(
    () => swaps.filter((s) => ["CONFIRMED", "PAID"].includes(s.status)),
    [swaps]
  );

  // ===== HISTORY =====
  const completedSwaps = swaps.filter((s) => s.status === "COMPLETED");
  const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED");

  // ===== SUMMARY =====
  const pendingCount = pendingBookings.length;
  const activeCount = activeSwaps.length;
  const completedCount = completedSwaps.length;

  // ===== PAY =====
  const openPayModal = (swap) => {
    setPayingSwap(swap);
    setPayModalOpen(true);
  };

  const handleSubmitPay = async (values) => {
    try {
      setPaySubmitting(true);

      let payload = { ...values };
      if (values.method === "SUBSCRIPTION") {
        payload.amountVnd = 0;
        payload.voucherId = 0;
      }

      await api.post(PAY_SWAP_URL(payingSwap.swapId), payload);
      toast.success("Thanh toán thành công");

      setPayModalOpen(false);
      setPayingSwap(null);
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Thanh toán thất bại.");
    } finally {
      setPaySubmitting(false);
    }
  };

  // ===== INSPECT =====
  const openInspectModal = (swap) => {
    setInspectingSwap(swap);
    setInspectModalOpen(true);
  };

  const handleSubmitInspect = async (values) => {
    try {
      setInspectSubmitting(true);

      const { batterySource, batteryId: formBatteryId, ...rest } = values;
      let finalBatteryId = formBatteryId;

      // Nếu tạo pin mới
      if (batterySource === "EXTERNAL") {
        const created = await createBatteryAtStation(
          inspectingSwap.stationId,
          "IN_USE"
        );

        finalBatteryId = created?.batteryId || created?.data?.batteryId;

        if (!finalBatteryId) {
          message.error("Không lấy được batteryId mới.");
          return;
        }

        message.success(`Đã tạo pin mới #${finalBatteryId}`);
      }

      await api.post(INSPECT_SWAP_URL(inspectingSwap.swapId), {
        ...rest,
        batteryId: finalBatteryId,
      });

      toast.success("Đã ghi nhận pin trả về.");
      setInspectModalOpen(false);
      setInspectingSwap(null);
      fetchAll();
    } catch (e) {
      message.error(
        e?.response?.data?.message || "Ghi nhận pin trả về thất bại."
      );
    } finally {
      setInspectSubmitting(false);
    }
  };

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
      }}
      bodyStyle={{ padding: 20 }}
      title={
        <>
          <br />
          <Title level={4}>Quản lý đổi pin</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Xác nhận booking, xử lý swap & theo dõi lịch sử.
          </Text>
        </>
      }
      extra={
        <Space>
          <Input
            allowClear
            placeholder="Tìm booking theo mã / trạm / tài xế…"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 280, borderRadius: 999 }}
          />
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={fetchAll}
          >
            Làm mới
          </Button>
        </Space>
      }
    >
      <SummaryStats
        pendingCount={pendingCount}
        activeCount={activeCount}
        completedCount={completedCount}
      />

      <Tabs defaultActiveKey="pending" type="card">
        <TabPane tab="Booking chờ xử lý" key="pending">
          <PendingBookingsTable
            data={pendingBookings}
            loading={loading}
            stationsMap={stationsMap}
            onConfirmSwap={handleConfirmSwap}
            onCancelBooking={handleCancelBooking}
          />
        </TabPane>

        <TabPane tab="Swap đang thực hiện" key="active">
          <ActiveSwapsTable
            data={activeSwaps}
            loading={loading}
            stationsMap={stationsMap}
            onOpenPay={openPayModal}
            onOpenInspect={openInspectModal}
            onOpenLatest={openLatestSwapModal}
          />
        </TabPane>

        <TabPane tab="Lịch sử" key="history">
          <HistorySection
            completedSwaps={completedSwaps}
            cancelledBookings={cancelledBookings}
            stationsMap={stationsMap}
            loading={loading}
          />
        </TabPane>
      </Tabs>

      {/* PAY */}
      <PaySwapModal
        open={payModalOpen}
        swap={payingSwap}
        loading={paySubmitting}
        onCancel={() => {
          setPayModalOpen(false);
          setPayingSwap(null);
        }}
        onSubmit={handleSubmitPay}
      />

      {/* INSPECT */}
      <InspectSwapModal
        open={inspectModalOpen}
        swap={inspectingSwap}
        loading={inspectSubmitting}
        onCancel={() => {
          setInspectModalOpen(false);
          setInspectingSwap(null);
        }}
        onSubmit={handleSubmitInspect}
      />

      {/* LATEST SWAP */}
      <LatestSwapModal
        open={latestModalOpen}
        swap={latestSwap}
        stationsMap={stationsMap}
        onClose={() => {
          setLatestModalOpen(false);
          setLatestSwap(null);
        }}
      />
    </Card>
  );
};
export default ManageSwap;
