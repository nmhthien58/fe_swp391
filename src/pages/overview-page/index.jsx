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
} from "antd";
import {
  DollarOutlined,
  SwapOutlined,
  RiseOutlined,
  HomeOutlined,
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

// màu random cho biểu đồ
const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#00C49F",
  "#0088FE",
];

const Overview = () => {
  const [timeRange, setTimeRange] = useState("month");
  // eslint-disable-next-line no-unused-vars
  const [selectedDates, setSelectedDates] = useState(null);

  const [loading, setLoading] = useState(false);

  // data từ API
  const [plans, setPlans] = useState([]); // /api/subscription-plans/all
  const [planStatsMap, setPlanStatsMap] = useState({}); // {planId: {totalSubscriptions,...}}
  const [swaps, setSwaps] = useState([]); // completed + paid
  const [stationsMap, setStationsMap] = useState(new Map()); // stationId -> name

  // ===== helper =====

  const fetchPlans = async () => {
    const res = await api.get("/api/subscription-plans/all");
    return Array.isArray(res.data?.result) ? res.data.result : [];
  };

  const fetchPlanStats = async (planId) => {
    const res = await api.get(`/api/subscription-plans/${planId}/statistics`);
    // hình của bạn là result là object
    return res.data?.result || {};
  };

  const fetchSwapsByStatus = async (status) => {
    const res = await api.get("/api/swaps", {
      params: {
        page: 0,
        size: 200,
        sort: "createdAt,desc",
        status, // COMPLETED | PAID
      },
    });
    const content = res.data?.result?.content ?? [];
    return content;
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
      // 1. plans
      const planList = await fetchPlans();
      setPlans(planList);

      // 2. stats cho từng plan (song song)
      const statsArr = await Promise.all(
        planList.map((p) => fetchPlanStats(p.planId))
      );
      const map = {};
      planList.forEach((p, idx) => {
        map[p.planId] = statsArr[idx];
      });
      setPlanStatsMap(map);

      // 3. swaps COMPLETED + PAID
      const [completed, paid] = await Promise.all([
        fetchSwapsByStatus("COMPLETED"),
        fetchSwapsByStatus("PAID"),
      ]);
      // tránh trùng swapId (rare) => ghép rồi dùng map
      const merged = [...completed, ...paid];
      const swapMap = new Map();
      merged.forEach((s) => {
        swapMap.set(s.swapId, s);
      });
      setSwaps(Array.from(swapMap.values()));

      // 4. stations
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

  // ======= tính toán doanh thu =======

  // 1. tổng tiền từ gói đăng ký
  const totalRevenueFromPlans = useMemo(() => {
    // mỗi gói: price * totalSubscriptions
    return plans.reduce((sum, plan) => {
      const stats = planStatsMap[plan.planId];
      const count = stats?.totalSubscriptions ?? 0;
      const price = plan.price ?? 0;
      return sum + price * count;
    }, 0);
  }, [plans, planStatsMap]);

  // 2. bảng chi tiết doanh thu từ từng gói
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

  // gói nào nhiều lượt mua nhất
  const bestPlan = useMemo(() => {
    return revenuePerPlan.reduce(
      (best, cur) =>
        cur.totalSubscriptions > (best?.totalSubscriptions ?? 0) ? cur : best,
      null
    );
  }, [revenuePerPlan]);

  // 3. tổng tiền từ giao dịch đổi pin (swaps COMPLETED, PAID)
  const totalRevenueFromSwaps = useMemo(() => {
    return swaps.reduce((sum, s) => sum + (s.amountVnd ?? 0), 0);
  }, [swaps]);

  // 4. doanh thu theo trạm
  const revenueByStation = useMemo(() => {
    const map = new Map(); // stationId -> {stationId, name, revenue, swaps}
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

  // 5. biểu đồ revenue nguồn: gói vs swap
  const revenueSourceData = useMemo(
    () => [
      { name: "Gói đăng ký", value: totalRevenueFromPlans },
      { name: "Đổi pin", value: totalRevenueFromSwaps },
    ],
    [totalRevenueFromPlans, totalRevenueFromSwaps]
  );

  // 6. biểu đồ revenue theo trạm (bar)
  const stationChartData = useMemo(() => {
    // lấy top 7 trạm
    return revenueByStation.slice(0, 7).map((s) => ({
      station: s.name,
      revenue: s.revenue,
    }));
  }, [revenueByStation]);

  // 7. biểu đồ revenue theo ngày/tháng từ swaps (để vẽ line)
  const timeSeriesData = useMemo(() => {
    // group theo yyyy-MM-dd của thanh toán / completedAt / createdAt
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
    // sort theo ngày
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [swaps]);

  // bảng doanh thu theo gói
  const planColumns = [
    {
      title: "Gói",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Giá gói (VND)",
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
      render: (v) =>
        v ? <span style={{ color: "#52c41a" }}>Đang bán</span> : "Ngừng",
    },
  ];

  // bảng doanh thu theo trạm
  const stationColumns = [
    {
      title: "Trạm",
      dataIndex: "name",
      key: "name",
      // eslint-disable-next-line no-unused-vars
      render: (v, r) => (
        <span>
          <HomeOutlined style={{ marginRight: 6 }} />
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
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700 }}>
          Báo cáo & Thống kê doanh thu
        </h2>
        <p style={{ color: "#666" }}>
          Tổng hợp doanh thu từ gói đăng ký và giao dịch đổi pin.
        </p>
      </div>

      {/* filter */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col>
            <span style={{ marginRight: 8 }}>Khoảng thời gian:</span>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 160 }}
            >
              <Option value="day">Hôm nay</Option>
              <Option value="week">Tuần này</Option>
              <Option value="month">Tháng này</Option>
              <Option value="year">Năm nay</Option>
              <Option value="custom">Tùy chỉnh</Option>
            </Select>
          </Col>
          {timeRange === "custom" && (
            <Col>
              <RangePicker
                onChange={(dates) => setSelectedDates(dates)}
                format="DD/MM/YYYY"
              />
            </Col>
          )}
        </Row>
      </Card>

      {loading ? (
        <Spin tip="Đang tải dữ liệu..." />
      ) : (
        <>
          {/* summary cards */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng tiền từ gói đăng ký"
                  value={totalRevenueFromPlans}
                  valueStyle={{ color: "#3f8600" }}
                  prefix={<DollarOutlined />}
                  formatter={(v) => v.toLocaleString("vi-VN")}
                  suffix=" VND"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng tiền từ đổi pin"
                  value={totalRevenueFromSwaps}
                  valueStyle={{ color: "#1890ff" }}
                  prefix={<SwapOutlined />}
                  formatter={(v) => v.toLocaleString("vi-VN")}
                  suffix=" VND"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng lượt swap (PAID/COMPLETED)"
                  value={swaps.length}
                  valueStyle={{ color: "#cf1322" }}
                  suffix=" lượt"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Gói bán chạy nhất"
                  value={bestPlan ? bestPlan.name : "—"}
                  prefix={<RiseOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* charts 1 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={16}>
              <Card title="Doanh thu đổi pin theo ngày">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => dayjs(d).format("DD/MM")}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "Doanh thu") {
                          return [value.toLocaleString("vi-VN") + " VND", name];
                        }
                        return [value.toLocaleString("vi-VN") + " lượt", name];
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Doanh thu"
                    />
                    <Line
                      type="monotone"
                      dataKey="swaps"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Số lượt đổi"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Tỷ lệ nguồn thu">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueSourceData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label={(entry) =>
                        `${entry.name}: ${entry.value.toLocaleString(
                          "vi-VN"
                        )} VND`
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

          {/* charts 2 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={14}>
              <Card title="Doanh thu theo trạm">
                <ResponsiveContainer width="100%" height={300}>
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
                    <Bar dataKey="revenue" name="Doanh thu" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="Doanh thu theo gói đăng ký">
                <Table
                  columns={planColumns}
                  dataSource={revenuePerPlan}
                  size="small"
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>

          {/* table stations */}
          <Row gutter={16}>
            <Col xs={24}>
              <Card title="Chi tiết doanh thu theo trạm">
                <Table
                  columns={stationColumns}
                  dataSource={revenueByStation.map((s, idx) => ({
                    key: s.stationId || idx,
                    ...s,
                  }))}
                  pagination={{ pageSize: 10 }}
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
