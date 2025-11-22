// src/pages/find-station/index.jsx
import React, { useEffect, useState } from "react";
import {
  Layout,
  Row,
  Col,
  Typography,
  Space,
  Modal,
  Select,
  DatePicker,
  message,
} from "antd";

import StationMap from "./StationMap";
import AccountAndPlanCard from "./AccountAndPlanCard";
import StationListCard from "./StationListCard";

import api from "../../config/axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

import { useSelector } from "react-redux";
import { selectUser } from "../../redux/accountSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import FeedbackDetailContent from "../../components/feedback/FeedbackDetailContent";

const { Content } = Layout;
const { Title, Text } = Typography;

const glassCard = {
  borderRadius: 12,
  boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
};

const FindStation = () => {
  const user = useSelector(selectUser);
  const driverId = user?.driverId ?? null;
  const navigate = useNavigate();

  // ===== Vehicle =====
  const [vehicle, setVehicle] = useState(null);
  const [vehLoading, setVehLoading] = useState(false);

  // ===== Station Data =====
  const [initialStations, setInitialStations] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [mapStations, setMapStations] = useState([]);
  const [loadingMap, setLoadingMap] = useState(false);

  const [typed, setTyped] = useState(" ");
  const [nearestStation, setNearestStation] = useState(null);

  // ===== Booking Modal =====
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingStationId, setBookingStationId] = useState(null);
  const [bookingTime, setBookingTime] = useState(
    dayjs().add(30, "minute").second(0).millisecond(0)
  );

  // ===== Feedback Modal =====
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackModalStation, setFeedbackModalStation] = useState(null);
  const [feedbackModalData, setFeedbackModalData] = useState([]);

  // ===== Subscription =====
  const [activeSub, setActiveSub] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [activePlan, setActivePlan] = useState(null);

  const [showInfoCard, setShowInfoCard] = useState(true);

  // -----------------------------
  // Load initial stations
  // -----------------------------
  const fetchInitialStations = async () => {
    setLoadingList(true);
    setLoadingMap(true);
    try {
      const res = await api.get(`/api/stations/search`, {
        params: { keyword: " " },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setInitialStations(data);
      setMapStations(data);
    } catch {
      setInitialStations([]);
      setMapStations([]);
    } finally {
      setLoadingList(false);
      setLoadingMap(false);
    }
  };

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => {
      const kw = typed.trim() === "" ? " " : typed;
      fetchMapStations(kw);
    }, 500);
    return () => clearTimeout(t);
  }, [typed]);

  const fetchMapStations = async (kw) => {
    setLoadingMap(true);
    try {
      const res = await api.get(`/api/stations/search`, {
        params: { keyword: kw },
      });
      setMapStations(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMapStations([]);
    } finally {
      setLoadingMap(false);
    }
  };

  useEffect(() => {
    fetchInitialStations();
  }, []);

  // -----------------------------
  // Fetch Vehicle info
  // -----------------------------
  const fetchMyVehicle = async () => {
    setVehLoading(true);
    try {
      const res = await api.get(`/api/vehicles/myVehicle`);
      setVehicle(res?.data || null);
    } catch {
      setVehicle(null);
    } finally {
      setVehLoading(false);
    }
  };

  useEffect(() => {
    fetchMyVehicle();
  }, []);

  // -----------------------------
  // Fetch active subscription
  // -----------------------------
  const fetchActiveSubscription = async (driverId) => {
    if (!driverId) return;

    setPlanLoading(true);
    try {
      const res = await api.get(
        `/api/driver-subscriptions/${driverId}/history`
      );
      const rawList = Array.isArray(res.data) ? res.data : [];

      const list = rawList.map((item) => {
        if (item.plan) return item;
        return {
          ...item,
          plan: {
            name: item.planName,
            swapLimit: item.swapLimit,
            price: item.price,
            durationDays: item.durationDays,
            pricePerSwap: item.pricePerSwap,
            pricePerExtraSwap: item.pricePerExtraSwap,
          },
        };
      });

      let found =
        list.find((s) => s.status === "ACTIVE") ||
        list.find((s) => s.active === true);

      if (found) {
        setActiveSub(found);
        setActivePlan(found.plan);
      } else {
        setActiveSub(null);
        setActivePlan(null);
      }
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    if (driverId) fetchActiveSubscription(driverId);
  }, [driverId]);

  // -----------------------------
  // Booking
  // -----------------------------
  const openBookingForStation = (stationId) => {
    setBookingStationId(stationId);
    setBookingTime(dayjs().add(30, "minute").second(0).millisecond(0));
    setBookingOpen(true);
  };

  const openBookingModal = () => {
    const id =
      nearestStation?.stationId ??
      initialStations.find((s) => s.stationId)?.stationId ??
      null;

    setBookingStationId(id);
    setBookingOpen(true);
  };

  const submitBooking = async () => {
    if (!bookingStationId || !bookingTime) {
      message.warning("Vui lòng chọn trạm và thời gian.");
      return;
    }
    if (!driverId) {
      message.error("Thiếu driverId. Hãy đăng nhập lại.");
      return;
    }

    try {
      setBookingSubmitting(true);
      const isoUtc = dayjs(bookingTime).utc().toISOString();

      await api.post(`/api/booking/${bookingStationId}/bookings`, null, {
        params: { driverId, bookingTime: isoUtc },
      });
      toast.success("Đặt lịch thành công!");
      setBookingOpen(false);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Đặt lịch thất bại, thử lại sau."
      );
    } finally {
      setBookingSubmitting(false);
    }
  };

  const disableBookingDate = (current) => {
    if (!current) return false;
    const today = dayjs().startOf("day");
    const maxDay = today.add(1, "day").endOf("day");
    return current < today || current > maxDay;
  };

  const vnd = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        }).format(n)
      : "-";

  const fmtVN = (iso) =>
    iso ? dayjs(iso).add(7, "hour").format("DD/MM/YYYY HH:mm") : "-";

  // -----------------------------
  // Render JSX
  // -----------------------------
  return (
    <Content style={{ padding: "24px 50px" }}>
      <Row gutter={[24, 24]}>
        {/* Bản đồ Goongmap */}
        <Col xl={16} lg={24} xs={24}>
          <StationMap
            stations={mapStations}
            loadingMap={loadingMap}
            searchValue={typed}
            onSearchChange={(value) => setTyped(value)}
            user={user}
            onOpenBookingQuick={openBookingModal}
            onOpenBookingForStation={openBookingForStation}
            onNearestChange={setNearestStation}
            glassCard={glassCard}
          />
        </Col>

        {/* Cột phải (liên kết phương tiện, list trạm) */}
        <Col xl={8} lg={24} xs={24}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {user && (
              <AccountAndPlanCard
                user={user}
                showInfoCard={showInfoCard}
                setShowInfoCard={setShowInfoCard}
                vehicle={vehicle}
                vehLoading={vehLoading}
                onLinkVehicle={() => navigate("/account")}
                planLoading={planLoading}
                activePlan={activePlan}
                activeSub={activeSub}
                onGoPlans={() => navigate("/plans")}
                vnd={vnd}
                fmtVN={fmtVN}
                glassCard={glassCard}
              />
            )}

            <StationListCard
              loading={loadingList}
              stations={initialStations}
              glassCard={glassCard}
              onOpenBookingForStation={openBookingForStation}
              onOpenFeedbackModal={(station, feedbacks) => {
                setFeedbackModalStation(station);
                setFeedbackModalData(feedbacks);
                setFeedbackModalOpen(true);
              }}
            />
          </Space>
        </Col>
      </Row>

      {/* BOOKING MODAL */}
      <Modal
        title="Đặt lịch đổi pin"
        open={bookingOpen}
        onOk={submitBooking}
        okText="Đặt lịch"
        confirmLoading={bookingSubmitting}
        onCancel={() => setBookingOpen(false)}
        destroyOnClose
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Text strong>Chọn trạm</Text>
            <Select
              style={{ width: "100%", marginTop: 6 }}
              placeholder="Chọn trạm"
              value={bookingStationId}
              onChange={setBookingStationId}
              options={initialStations.map((s) => ({
                value: s.stationId,
                label: `${s.name} — ${s.address}`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </div>

          <div>
            <Text strong>Thời gian</Text>
            <DatePicker
              style={{ width: "100%", marginTop: 6 }}
              showTime
              value={bookingTime}
              onChange={setBookingTime}
              disabledDate={disableBookingDate}
              format="YYYY-MM-DD HH:mm"
            />
          </div>
        </Space>
      </Modal>

      {/* FEEDBACK MODAL */}
      <Modal
        title="Đánh giá trạm"
        open={feedbackModalOpen}
        onCancel={() => setFeedbackModalOpen(false)}
        footer={null}
        width={650}
        destroyOnClose
      >
        <FeedbackDetailContent
          station={feedbackModalStation}
          feedbacks={feedbackModalData}
        />
      </Modal>
    </Content>
  );
};

export default FindStation;
