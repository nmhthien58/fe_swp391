// src/pages/AdminRevenue/index.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Row, Col, Spin, message } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import api from "../../config/axios";

import OverviewHeader from "./OverviewHeader";
import SummaryCards from "./SummaryCards";
import PlanRevenueTable from "./PlanRevenueTable";
import HourlySwapTable from "./HourlySwapTable";
import StationRevenueTable from "./StationRevenueTable";

dayjs.extend(utc);
dayjs.extend(tz);

const COLORS = [
  "#4F46E5",
  "#F97316",
  "#22C55E",
  "#0EA5E9",
  "#A855F7",
  "#F43F5E",
];

const Overview = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [selectedDates, setSelectedDates] = useState(null);

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [planStatsMap, setPlanStatsMap] = useState({});
  const [swaps, setSwaps] = useState([]);
  const [stationsMap, setStationsMap] = useState(new Map());

  // ===== helpers gọi API =====

  const fetchPlans = async () => {
    const res = await api.get("/api/subscription-plans/all");
    return Array.isArray(res.data?.result) ? res.data.result : [];
  };

  const fetchPlanStats = async (planId) => {
    const res = await api.get(`/api/subscription-plans/${planId}/statistics`);
    return res.data?.result || {};
  };

  const fetchSwapsByStatus = async (status) => {
    const res = await api.get("/api/swaps", {
      params: { page: 0, size: 200, sort: "createdAt,desc", status },
    });
    return res.data?.result?.content ?? [];
  };

  const fetchStations = async () => {
    const res = await api.get("/api/stations/search", {
      params: { keyword: " " },
    });
    const list = Array.isArray(res.data) ? res.data : [];
    return new Map(
      list.map((s) => [s.stationId, s.name || `Trạm #${s.stationId}`])
    );
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      // 1. Gói + thống kê gói
      const planList = await fetchPlans();
      setPlans(planList);

      const statsArr = await Promise.all(
        planList.map((p) => fetchPlanStats(p.planId))
      );
      const map = {};
      planList.forEach((p, idx) => {
        map[p.planId] = statsArr[idx];
      });
      setPlanStatsMap(map);

      // 2. Swaps COMPLETED + PAID
      const [completed, paid] = await Promise.all([
        fetchSwapsByStatus("COMPLETED"),
        fetchSwapsByStatus("PAID"),
      ]);

      const merged = [...completed, ...paid];
      const swapMap = new Map();
      merged.forEach((s) => swapMap.set(s.swapId, s));
      setSwaps(Array.from(swapMap.values()));

      // 3. Stations map
      const stMap = await fetchStations();
      setStationsMap(stMap);
    } catch (e) {
      console.error(e);
      message.error("Không tải được dữ liệu thống kê.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ====== LỌC SWAP THEO KHOẢNG THỜI GIAN ======
  const filteredSwaps = useMemo(() => {
    if (!swaps || swaps.length === 0) return [];

    const VN_TZ = "Asia/Ho_Chi_Minh";
    const now = dayjs().tz(VN_TZ);

    let start = null;
    let end = null;

    switch (timeRange) {
      case "day":
        start = now.startOf("day");
        end = now.endOf("day");
        break;
      case "week":
        start = now.startOf("week");
        end = now.endOf("week");
        break;
      case "month":
        start = now.startOf("month");
        end = now.endOf("month");
        break;
      case "year":
        start = now.startOf("year");
        end = now.endOf("year");
        break;
      case "custom":
        if (selectedDates && selectedDates.length === 2) {
          start = selectedDates[0].startOf("day");
          end = selectedDates[1].endOf("day");
        }
        break;
      default:
        break;
    }

    if (!start || !end) {
      return swaps;
    }

    return swaps.filter((swap) => {
      const ts =
        swap.completedAt || swap.paidAt || swap.createdAt || swap.confirmedAt;
      if (!ts) return false;

      let d = dayjs.utc(ts).tz(VN_TZ);
      if (!d.isValid()) {
        d = dayjs(ts).tz(VN_TZ);
      }

      return (
        d.isSame(start) ||
        d.isSame(end) ||
        (d.isAfter(start) && d.isBefore(end))
      );
    });
  }, [swaps, timeRange, selectedDates]);

  // ====== TÍNH TOÁN ======

  //  Doanh thu gói
  const totalRevenueFromPlans = useMemo(() => {
    return plans.reduce((sum, plan) => {
      const stats = planStatsMap[plan.planId];
      const count = stats?.totalSubscriptions ?? 0;
      return sum + (plan.price ?? 0) * count;
    }, 0);
  }, [plans, planStatsMap]);

  const revenuePerPlan = useMemo(() => {
    return plans.map((plan) => {
      const stats = planStatsMap[plan.planId] || {};
      const totalSubs = stats.totalSubscriptions ?? 0;
      const revenue = (plan.price ?? 0) * totalSubs;
      return {
        key: plan.planId,
        planId: plan.planId,
        name: plan.name,
        price: plan.price ?? 0,
        totalSubscriptions: totalSubs,
        revenue,
        active: plan.active,
      };
    });
  }, [plans, planStatsMap]);

  const bestPlan = useMemo(
    () =>
      revenuePerPlan.reduce(
        (best, cur) =>
          cur.totalSubscriptions > (best?.totalSubscriptions ?? 0) ? cur : best,
        null
      ),
    [revenuePerPlan]
  );

  // Doanh thu swap
  const totalRevenueFromSwaps = useMemo(
    () => filteredSwaps.reduce((sum, s) => sum + (s.amountVnd ?? 0), 0),
    [filteredSwaps]
  );

  const revenueByStation = useMemo(() => {
    const map = new Map();
    filteredSwaps.forEach((s) => {
      const stationId = s.stationId;
      if (!stationId) return;
      if (!map.has(stationId)) {
        map.set(stationId, {
          stationId,
          name: stationsMap.get(stationId) || `Trạm #${stationId}`,
          revenue: 0,
          swaps: 0,
        });
      }
      const item = map.get(stationId);
      item.revenue += s.amountVnd ?? 0;
      item.swaps += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSwaps, stationsMap]);

  // Phân bố theo khung giờ
  const hourlySwapData = useMemo(() => {
    const VN_TZ = "Asia/Ho_Chi_Minh";

    const slots = Array.from({ length: 12 }, (_, i) => {
      const start = i * 2;
      const end = start + 1;
      const label = `${start.toString().padStart(2, "0")}:00 - ${end
        .toString()
        .padStart(2, "0")}:59`;

      return {
        slotIndex: i,
        label,
        swaps: 0,
      };
    });

    filteredSwaps.forEach((swap) => {
      const ts =
        swap.createdAt || swap.completedAt || swap.paidAt || swap.confirmedAt;
      if (!ts) return;

      const d = dayjs.utc(ts).tz(VN_TZ);
      if (!d.isValid()) return;

      const hour = d.hour();
      const idx = Math.floor(hour / 2);

      if (idx >= 0 && idx < slots.length) {
        slots[idx].swaps += 1;
      }
    });

    return slots;
  }, [filteredSwaps]);

  const peakHourSlot = useMemo(
    () =>
      hourlySwapData.reduce(
        (best, cur) => (cur.swaps > (best?.swaps ?? 0) ? cur : best),
        null
      ),
    [hourlySwapData]
  );

  // Dữ liệu chart trạm
  const stationChartData = useMemo(
    () =>
      revenueByStation.slice(0, 7).map((s) => ({
        station: s.name,
        revenue: s.revenue,
      })),
    [revenueByStation]
  );

  return (
    <div
      style={{
        padding: 24,
        minHeight: "100vh",
      }}
    >
      <OverviewHeader
        timeRange={timeRange}
        selectedDates={selectedDates}
        setTimeRange={setTimeRange}
        setSelectedDates={setSelectedDates}
      />

      {loading ? (
        <Spin tip="Đang tải dữ liệu..." />
      ) : (
        <>
          <SummaryCards
            totalRevenueFromPlans={totalRevenueFromPlans}
            totalRevenueFromSwaps={totalRevenueFromSwaps}
            swapCount={filteredSwaps.length}
            bestPlan={bestPlan}
            peakHourSlot={peakHourSlot}
          />

          <PlanRevenueTable
            stationChartData={stationChartData}
            revenuePerPlan={revenuePerPlan}
          />

          <HourlySwapTable hourlySwapData={hourlySwapData} />

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <StationRevenueTable revenueByStation={revenueByStation} />
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Overview;
