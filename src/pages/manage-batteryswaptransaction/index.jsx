// src/pages/ManageBatterySwapTransaction.jsx
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
  Select,
  Segmented,
  Tooltip,
} from "antd";
import { ReloadOutlined, InfoCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../config/axios";

const { Title, Text } = Typography;

const glassCard = {
  borderRadius: 12,
  boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
};

const STATUS_LABEL = {
  INITIATED: "Khởi tạo",
  CONFIRMED: "Đã xác nhận",
  PAID: "Đã thanh toán",
  INSPECTED: "Đã kiểm tra",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const STATUS_COLOR = {
  INITIATED: "gold",
  CONFIRMED: "blue",
  PAID: "green",
  INSPECTED: "cyan",
  COMPLETED: "success",
  CANCELLED: "red",
};

const currencyVND = (v) =>
  typeof v === "number"
    ? v.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      })
    : v ?? "-";

export default function ManageBatterySwapTransaction() {
  // server-side pagination
  const [page, setPage] = useState(0); // 0-based
  const [size, setSize] = useState(10);
  const [status, setStatus] = useState(""); // "", "INITIATED", ...
  const [sort, setSort] = useState("createdAt,desc");

  const [data, setData] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errText, setErrText] = useState("");

  // map stationId -> name (nếu có API search)
  const [stationMap, setStationMap] = useState({});

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      setErrText("");
      const res = await api.get("/api/swaps", {
        params: {
          page,
          size,
          status: status || undefined,
          sort, // ví dụ createdAt,desc
        },
      });

      const result = res?.data?.result;
      const content = result?.content ?? [];
      setData(Array.isArray(content) ? content : []);
      setTotalElements(result?.totalElements ?? 0);
    } catch (err) {
      console.error(err);
      setErrText("Không thể tải danh sách giao dịch đổi pin.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      // backend bạn từng nói có search all bằng keyword = " "
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
      // nếu không có API này thì vẫn ổn, chỉ hiển thị stationId
    }
  };

  useEffect(() => {
    fetchSwaps();
  }, [page, size, status, sort]);

  useEffect(() => {
    fetchStations();
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "Mã giao dịch",
        dataIndex: "swapId",
        key: "swapId",
        width: 120,
        render: (v) => <Text strong>#{v}</Text>,
      },
      {
        title: "Tài xế",
        dataIndex: "driverId",
        key: "driverId",
        width: 100,
        render: (v) => (v != null ? `#${v}` : "-"),
      },
      {
        title: "Trạm",
        dataIndex: "stationId",
        key: "stationId",
        ellipsis: true,
        render: (id) => stationMap[id] || `Trạm #${id ?? "-"}`,
      },
      {
        title: "Pin nhận / trả",
        key: "battery",
        width: 160,
        render: (_, r) => (
          <div>
            <div>
              <Text type="secondary">Nhận:</Text>{" "}
              <Text>{r?.reservedBatteryId ?? "-"}</Text>
            </div>
            <div>
              <Text type="secondary">Trả:</Text>{" "}
              <Text>{r?.returnedBatteryId ?? "-"}</Text>
            </div>
          </div>
        ),
      },
      {
        title: "Số tiền",
        dataIndex: "amountVnd",
        key: "amountVnd",
        width: 130,
        render: (v) => currencyVND(v),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (s) => (
          <Tag color={STATUS_COLOR[s] || "default"}>
            {STATUS_LABEL[s] || s || "-"}
          </Tag>
        ),
      },
      {
        title: (
          <Space>
            Mốc thời gian
            <Tooltip title="Các thời điểm quan trọng trong vòng đời giao dịch">
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        ),
        key: "timeline",
        render: (_, r) => (
          <div style={{ lineHeight: 1.5 }}>
            <div>
              <Text type="secondary">Tạo:</Text>{" "}
              <Text>
                {r?.createdAt
                  ? dayjs(r.createdAt).format("DD/MM/YYYY HH:mm:ss")
                  : "-"}
              </Text>
            </div>
            <div>
              <Text type="secondary">Xác nhận:</Text>{" "}
              <Text>
                {r?.confirmedAt
                  ? dayjs(r.confirmedAt).format("DD/MM/YYYY HH:mm:ss")
                  : "-"}
              </Text>
            </div>
            <div>
              <Text type="secondary">Thanh toán:</Text>{" "}
              <Text>
                {r?.paidAt
                  ? dayjs(r.paidAt).format("DD/MM/YYYY HH:mm:ss")
                  : "-"}
              </Text>
            </div>
            <div>
              <Text type="secondary">Kiểm tra:</Text>{" "}
              <Text>
                {r?.inspectedAt
                  ? dayjs(r.inspectedAt).format("DD/MM/YYYY HH:mm:ss")
                  : "-"}
              </Text>
            </div>
            <div>
              <Text type="secondary">Hoàn tất:</Text>{" "}
              <Text>
                {r?.completedAt
                  ? dayjs(r.completedAt).format("DD/MM/YYYY HH:mm:ss")
                  : "-"}
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: "Ghi chú",
        dataIndex: "notes",
        key: "notes",
        ellipsis: true,
        render: (v) => v || "-",
      },
    ],
    [stationMap]
  );

  const pagination = {
    current: page + 1,
    pageSize: size,
    total: totalElements,
    showSizeChanger: true,
    onChange: (p, ps) => {
      setPage(p - 1);
      setSize(ps);
    },
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
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
              Giao dịch đổi pin
            </Title>
            <Text type="secondary">
              Theo dõi các lượt đổi pin, trạng thái và số tiền thanh toán.
            </Text>
          </Space>

          <Space wrap>
            <Select
              value={status || "ALL"}
              onChange={(v) => {
                setPage(0);
                setStatus(v === "ALL" ? "" : v);
              }}
              style={{ width: 200 }}
              options={[
                { label: "Tất cả trạng thái", value: "ALL" },
                { label: STATUS_LABEL.INITIATED, value: "INITIATED" },
                { label: STATUS_LABEL.CONFIRMED, value: "CONFIRMED" },
                { label: STATUS_LABEL.PAID, value: "PAID" },
                { label: STATUS_LABEL.INSPECTED, value: "INSPECTED" },
                { label: STATUS_LABEL.COMPLETED, value: "COMPLETED" },
                { label: STATUS_LABEL.CANCELLED, value: "CANCELLED" },
              ]}
            />
            <Segmented
              value={sort}
              onChange={(v) => {
                setPage(0);
                setSort(String(v));
              }}
              options={[
                { label: "Mới nhất", value: "createdAt,desc" },
                { label: "Cũ nhất", value: "createdAt,asc" },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchSwaps}>
              Tải lại
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Content */}
      {loading ? (
        <Card bordered={false} style={glassCard} bodyStyle={{ padding: 16 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : errText ? (
        <Result
          status="error"
          title="Không thể tải dữ liệu"
          subTitle={errText}
          extra={
            <Button type="primary" onClick={fetchSwaps}>
              Thử lại
            </Button>
          }
        />
      ) : !data.length ? (
        <Card bordered={false} style={glassCard}>
          <Empty description="Chưa có giao dịch nào" />
        </Card>
      ) : (
        <Card bordered={false} style={glassCard} bodyStyle={{ padding: 0 }}>
          <Table
            rowKey={(r) => r.swapId}
            dataSource={data}
            columns={columns}
            pagination={pagination}
          />
        </Card>
      )}
    </div>
  );
}
