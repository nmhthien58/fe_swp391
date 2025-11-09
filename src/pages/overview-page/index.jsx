// src/pages/AdminRevenue.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Table,
  Spin,
  message,
  Tag,
} from "antd";
import {
  DollarOutlined,
  SwapOutlined,
  RiseOutlined,
  HomeOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import api from "../../config/axios";

const { RangePicker } = DatePicker;
const { Option } = Select;

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
  // eslint-disable-next-line no-unused-vars
  const [selectedDates, setSelectedDates] = useState(null);

  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [planStatsMap, setPlanStatsMap] = useState({});
  const [swaps, setSwaps] = useState([]);
  const [stationsMap, setStationsMap] = useState(new Map());

  // ===== helpers =====
  // eslint-disable-next-line no-unused-vars
  const fmtVnd = (n) =>
    typeof n === "number"
      ? n.toLocaleString("vi-VN") + " VND"
      : (Number(n) || 0).toLocaleString("vi-VN") + " VND";

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

      const [completed, paid] = await Promise.all([
        fetchSwapsByStatus("COMPLETED"),
        fetchSwapsByStatus("PAID"),
      ]);
      // merge tránh trùng
      const merged = [...completed, ...paid];
      const swapMap = new Map();
      merged.forEach((s) => swapMap.set(s.swapId, s));
      setSwaps(Array.from(swapMap.values()));

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

  // ====== tính toán ======
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

  const bestPlan = useMemo(() => {
    return revenuePerPlan.reduce(
      (best, cur) =>
        cur.totalSubscriptions > (best?.totalSubscriptions ?? 0) ? cur : best,
      null
    );
  }, [revenuePerPlan]);

  const totalRevenueFromSwaps = useMemo(
    () => swaps.reduce((sum, s) => sum + (s.amountVnd ?? 0), 0),
    [swaps]
  );

  const revenueByStation = useMemo(() => {
    const map = new Map();
    swaps.forEach((s) => {
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
  }, [swaps, stationsMap]);

  const revenueSourceData = useMemo(
    () => [
      { name: "Gói đăng ký", value: totalRevenueFromPlans },
      { name: "Đổi pin", value: totalRevenueFromSwaps },
    ],
    [totalRevenueFromPlans, totalRevenueFromSwaps]
  );

  const stationChartData = useMemo(
    () =>
      revenueByStation.slice(0, 7).map((s) => ({
        station: s.name,
        revenue: s.revenue,
      })),
    [revenueByStation]
  );

  const timeSeriesData = useMemo(() => {
    const map = new Map();
    swaps.forEach((s) => {
      const dateStr = (s.completedAt || s.paidAt || s.createdAt || "").slice(
        0,
        10
      );
      if (!dateStr) return;
      if (!map.has(dateStr)) {
        map.set(dateStr, { date: dateStr, revenue: 0, swaps: 0 });
      }
      const item = map.get(dateStr);
      item.revenue += s.amountVnd ?? 0;
      item.swaps += 1;
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [swaps]);

  // ====== columns ======
  const planColumns = [
    {
      title: "Gói",
      dataIndex: "name",
      key: "name",
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Giá (VND)",
      dataIndex: "price",
      key: "price",
      render: (v) => v?.toLocaleString("vi-VN"),
    },
    {
      title: "Số lượt mua",
      dataIndex: "totalSubscriptions",
      key: "totalSubscriptions",
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      render: (v) => v?.toLocaleString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (v) => (v ? <Tag color="green">Đang bán</Tag> : <Tag>Ngừng</Tag>),
    },
  ];

  const stationColumns = [
    {
      title: "Trạm",
      dataIndex: "name",
      key: "name",
      render: (v) => (
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <HomeOutlined />
          {v}
        </span>
      ),
    },
    {
      title: "Số lượt đổi",
      dataIndex: "swaps",
      key: "swaps",
    },
    {
      title: "Doanh thu (VND)",
      dataIndex: "revenue",
      key: "revenue",
      render: (v) => v?.toLocaleString("vi-VN"),
      align: "right",
    },
  ];

  return (
    <div
      style={{
        padding: 24,
        background: "#f4f5fb",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "#1e5de4ff",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 24,
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
            Báo cáo & Thống kê doanh thu
          </h2>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Theo dõi doanh thu từ gói đăng ký và giao dịch đổi pin.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 140 }}
            size="middle"
          >
            <Option value="day">Hôm nay</Option>
            <Option value="week">Tuần này</Option>
            <Option value="month">Tháng này</Option>
            <Option value="year">Năm nay</Option>
            <Option value="custom">Tùy chỉnh</Option>
          </Select>
          {timeRange === "custom" && (
            <RangePicker
              onChange={setSelectedDates}
              format="DD/MM/YYYY"
              size="middle"
            />
          )}
        </div>
      </div>

      {loading ? (
        <Spin tip="Đang tải dữ liệu..." />
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{ borderRadius: 14 }}
                bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "999px",
                    background: "rgba(79,70,229,0.1)",
                    display: "grid",
                    placeItems: "center",
                    color: "#4f46e5",
                  }}
                >
                  <DollarOutlined />
                </div>
                <Statistic
                  title="Tổng tiền từ gói"
                  value={totalRevenueFromPlans}
                  valueStyle={{ fontSize: 20 }}
                  formatter={(v) => v.toLocaleString("vi-VN")}
                  suffix=" VND"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{ borderRadius: 14 }}
                bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "999px",
                    background: "rgba(14,165,233,0.1)",
                    display: "grid",
                    placeItems: "center",
                    color: "#0ea5e9",
                  }}
                >
                  <SwapOutlined />
                </div>
                <Statistic
                  title="Tổng tiền đổi pin"
                  value={totalRevenueFromSwaps}
                  valueStyle={{ fontSize: 20 }}
                  formatter={(v) => v.toLocaleString("vi-VN")}
                  suffix=" VND"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{ borderRadius: 14 }}
                bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "999px",
                    background: "rgba(249,115,22,0.1)",
                    display: "grid",
                    placeItems: "center",
                    color: "#f97316",
                  }}
                >
                  <BarChartOutlined />
                </div>
                <Statistic
                  title="Số giao dịch swap"
                  value={swaps.length}
                  suffix=" lượt"
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{ borderRadius: 14 }}
                bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "999px",
                    background: "rgba(34,197,94,0.1)",
                    display: "grid",
                    placeItems: "center",
                    color: "#22c55e",
                  }}
                >
                  <RiseOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#999" }}>
                    Gói bán chạy nhất
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>
                    {bestPlan ? bestPlan.name : "—"}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* CHARTS ROW 1 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={16}>
              <Card
                title="Doanh thu đổi pin theo ngày"
                style={{ borderRadius: 14 }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => dayjs(d).format("DD/MM")}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "Doanh thu"
                          ? [value.toLocaleString("vi-VN") + " VND", name]
                          : [value.toLocaleString("vi-VN") + " lượt", name]
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      name="Doanh thu"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="swaps"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      name="Số lượt đổi"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Tỷ lệ nguồn thu" style={{ borderRadius: 14 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueSourceData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label={(entry) =>
                        `${entry.name}: ${entry.value.toLocaleString("vi-VN")}`
                      }
                    >
                      {revenueSourceData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        value.toLocaleString("vi-VN") + " VND"
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* CHARTS ROW 2 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="Doanh thu theo trạm" style={{ borderRadius: 14 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stationChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="station" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) =>
                        value.toLocaleString("vi-VN") + " VND"
                      }
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Doanh thu" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title="Doanh thu theo gói đăng ký"
                style={{ borderRadius: 14 }}
              >
                <Table
                  columns={planColumns}
                  dataSource={revenuePerPlan}
                  size="small"
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>

          {/* TABLE FULL */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title="Chi tiết doanh thu theo trạm"
                style={{ borderRadius: 14 }}
              >
                <Table
                  columns={stationColumns}
                  dataSource={revenueByStation.map((s, idx) => ({
                    key: s.stationId || idx,
                    ...s,
                  }))}
                  pagination={{ pageSize: 8 }}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Overview;
