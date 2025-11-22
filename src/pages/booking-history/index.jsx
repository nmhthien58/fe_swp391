import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Result,
  Button,
  Skeleton,
  Empty,
  Segmented,
} from "antd";
import dayjs from "dayjs";
import api from "../../config/axios";

const { Title, Text } = Typography;

const glassCard = {
  borderRadius: 12,
  boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
};

const STATUS_LABEL = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
};

const STATUS_COLOR = {
  PENDING: "gold",
  CONFIRMED: "green",
  CANCELLED: "red",
};

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errText, setErrText] = useState("");
  const [filterKey, setFilterKey] = useState("all"); // all | pending | processed
  const [stationMap, setStationMap] = useState({}); // { [stationId]: stationName }

  // Lấy danh sách lịch hẹn
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setErrText("");
      const res = await api.get("/api/booking");
      const data = Array.isArray(res?.data) ? res.data : [];
      setBookings(data);
    } catch (err) {
      console.error(err);
      setErrText("Không thể tải lịch hẹn.");
    } finally {
      setLoading(false);
    }
  };

  // Cố gắng tải tên trạm (nếu backend hỗ trợ search keyword = " ")
  const fetchStations = async () => {
    try {
      const res = await api.get("/api/stations/search", {
        params: { keyword: " " },
      });
      const list = res?.data?.result || res?.data || [];
      const map = {};
      (Array.isArray(list) ? list : []).forEach((s) => {
        const id = s.stationId ?? s.id;
        if (id != null) map[id] = s.name || s.stationName || `Trạm #${id}`;
      });
      setStationMap(map);
    } catch {
      // bỏ qua nếu API khác hoặc không có
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchStations();
  }, []);

  // Áp dụng filter
  const filtered = useMemo(() => {
    if (filterKey === "pending") {
      return bookings.filter((b) => b.status === "PENDING");
    }
    if (filterKey === "processed") {
      return bookings.filter(
        (b) => b.status === "CONFIRMED" || b.status === "CANCELLED"
      );
    }
    return bookings;
  }, [bookings, filterKey]);

  const columns = [
    {
      title: "Mã lịch hẹn",
      dataIndex: "bookingId",
      key: "bookingId",
      width: 110,
      render: (v) => <Text strong>{v}</Text>,
      sorter: (a, b) => (a.bookingID ?? 0) - (b.bookingID ?? 0),
    },
    {
      title: "Trạm",
      dataIndex: "stationId",
      key: "stationId",
      ellipsis: true,
      render: (id) => stationMap[id] || `Trạm #${id ?? "-"}`,
      sorter: (a, b) => String(a.stationId).localeCompare(String(b.stationId)),
    },
    {
      title: "Thời gian hẹn",
      dataIndex: "bookingTime",
      key: "bookingTime",
      render: (t) =>
        t ? (
          <span title={t}>{dayjs(t).format("DD/MM/YYYY HH:mm:ss")}</span>
        ) : (
          "-"
        ),
      sorter: (a, b) =>
        dayjs(a.bookingTime).valueOf() - dayjs(b.bookingTime).valueOf(),
    },

    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: STATUS_LABEL.PENDING, value: "PENDING" },
        { text: STATUS_LABEL.CONFIRMED, value: "CONFIRMED" },
        { text: STATUS_LABEL.CANCELLED, value: "CANCELLED" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (s) => (
        <Tag color={STATUS_COLOR[s] || "default"}>
          {STATUS_LABEL[s] || s || "-"}
        </Tag>
      ),
    },
    // {
    //   title: "Ghi chú",
    //   key: "note",
    //   render: (_, r) =>
    //     r.confirmed === true && r.status === "CONFIRMED" ? (
    //       <Tag color="green">Đã xác nhận</Tag>
    //     ) : r.status === "PENDING" ? (
    //       <Tag color="gold">Chờ xác nhận</Tag>
    //     ) : r.status === "CANCELLED" ? (
    //       <Tag color="red">Đã hủy</Tag>
    //     ) : (
    //       "-"
    //     ),
    // },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        bordered={false}
        style={{ ...glassCard, marginBottom: 16 }}
        bodyStyle={{ padding: 16 }}
      >
        <Space
          align="center"
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <Space direction="vertical" size={2}>
            <Title level={3} style={{ margin: 0 }}>
              Lịch hẹn của bạn
            </Title>
            <Text type="secondary">
              Xem trạng thái lịch hẹn đổi pin của bạn theo thời gian.
            </Text>
          </Space>

          <Space>
            <Segmented
              value={filterKey}
              onChange={setFilterKey}
              options={[
                { label: "Tất cả", value: "all" },
                { label: "Chờ xác nhận", value: "pending" },
                { label: "Đã xử lý", value: "processed" },
              ]}
            />
            <Button onClick={fetchBookings}>Tải lại</Button>
          </Space>
        </Space>
      </Card>

      {loading ? (
        <Card bordered={false} style={glassCard} bodyStyle={{ padding: 16 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : errText ? (
        <Result
          status="error"
          title="Không thể tải dữ liệu"
          subTitle={errText}
          extra={
            <Button type="primary" onClick={fetchBookings}>
              Thử lại
            </Button>
          }
        />
      ) : !filtered.length ? (
        <Card bordered={false} style={glassCard}>
          <Empty description="Chưa có lịch hẹn nào" />
        </Card>
      ) : (
        <Card
          bordered={false}
          style={glassCard}
          bodyStyle={{ paddingRight: 15 }}
        >
          <Table
            rowKey={(r) => r.bookingID}
            dataSource={filtered}
            columns={columns}
            pagination={{ pageSize: 8, showSizeChanger: true }}
          />
        </Card>
      )}
    </div>
  );
}
