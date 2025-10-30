import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Spin,
  Empty,
  message,
  Input,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/accountSlice";
import api from "../../config/axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const PlanHistory = () => {
  const user = useSelector(selectUser);
  const driverId = user?.driverId;

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState("");

  // helpers
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

  const statusTag = (status, active) => {
    const map = {
      ACTIVE: "green",
      PENDING_PAYMENT: "orange",
      EXPIRED: "red",
      CANCELED: "red",
    };
    const color = active ? "green" : map[status] || "default";
    return <Tag color={color}>{active ? "ACTIVE" : status || "UNKNOWN"}</Tag>;
  };

  const paymentTag = (pmt) => {
    if (!pmt) return <Tag>—</Tag>;
    const map = { SUCCESS: "green", FAILED: "red", PENDING: "orange" };
    return <Tag color={map[pmt.status] || "default"}>{pmt.status}</Tag>;
  };

  // fetch
  useEffect(() => {
    const run = async () => {
      if (!driverId) {
        setRows([]);
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const res = await api.get(
          `/api/driver-subscriptions/${driverId}/history`
        );
        const data = Array.isArray(res.data) ? res.data : [];
        setRows(data);
      } catch (e) {
        const msg = e?.response?.data?.message || "Không tải được lịch sử gói.";
        setErr(msg);
        message.error(msg);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [driverId]);

  // lọc tìm kiếm
  const data = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return rows;
    return rows.filter((r) => {
      const id = String(r?.subscriptionId ?? "").toLowerCase();
      const name = r?.plan?.name?.toLowerCase() || "";
      const desc = r?.plan?.description?.toLowerCase() || "";
      return id.includes(text) || name.includes(text) || desc.includes(text);
    });
  }, [rows, q]);

  // tổng tiền thanh toán thành công
  const totalPaid = useMemo(() => {
    return data
      .filter((r) => r?.payment?.status === "SUCCESS")
      .reduce((sum, r) => sum + (r?.payment?.amountVnd || 0), 0);
  }, [data]);

  const columns = useMemo(
    () => [
      {
        title: "Mã ĐK",
        dataIndex: "subscriptionId",
        key: "subscriptionId",
        width: 90,
      },
      {
        title: "Tên gói",
        key: "planName",
        render: (_, r) => (
          <Space direction="vertical" size={0}>
            <Text strong>{r?.plan?.name || "-"}</Text>
            {r?.plan?.description && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.plan.description}
              </Text>
            )}
          </Space>
        ),
        ellipsis: true,
      },
      {
        title: "Giá",
        key: "price",
        render: (_, r) => vnd(r?.plan?.price),
        width: 120,
      },
      {
        title: "Thời hạn",
        key: "duration",
        render: (_, r) => (r?.plan?.durationDays ?? "-") + " ngày",
        width: 100,
      },
      {
        title: "Bắt đầu",
        key: "startDate",
        render: (_, r) => fmtVN(r?.startDate),
        width: 160,
      },
      {
        title: "Kết thúc",
        key: "endDate",
        render: (_, r) => fmtVN(r?.endDate),
        width: 160,
      },
      {
        title: "Trạng thái",
        key: "status",
        render: (_, r) => statusTag(r?.status, r?.active),
        width: 120,
      },
      {
        title: "Thanh toán",
        key: "payment",
        render: (_, r) => (
          <Space direction="vertical" size={0}>
            {paymentTag(r?.payment)}
            {r?.payment?.amountVnd != null && (
              <Text style={{ fontSize: 12 }}>{vnd(r.payment.amountVnd)}</Text>
            )}
          </Space>
        ),
        width: 140,
      },
    ],
    []
  );

  return (
    <Card bordered={false} bodyStyle={{ padding: 16 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {/* Header */}
        <Space
          align="center"
          style={{
            width: "100%",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Lịch sử đăng ký gói
            </Title>
            <Text type="secondary">
              Theo dõi các gói đã đăng ký và thanh toán.
            </Text>
          </div>
          <Input
            allowClear
            size="large"
            placeholder="Tìm theo mã, tên gói..."
            prefix={<SearchOutlined />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </Space>

        {/* Tổng tiền hiển thị đơn giản */}
        <div
          style={{
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: 8,
            padding: "10px 16px",
          }}
        >
          <Text strong style={{ fontSize: 15 }}>
            Tổng tiền đã thanh toán thành công:
          </Text>{" "}
          <Text style={{ fontSize: 15, color: "#1677ff", fontWeight: 600 }}>
            {vnd(totalPaid)}
          </Text>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "36px 0" }}>
            <Spin />
          </div>
        ) : err ? (
          <Empty description={err} />
        ) : data.length === 0 ? (
          <Empty description="Chưa có lịch sử đăng ký gói." />
        ) : (
          <Table
            size="middle"
            rowKey="subscriptionId"
            dataSource={data}
            columns={columns}
            scroll={{ x: 900 }}
            pagination={{ pageSize: 8, showSizeChanger: false }}
          />
        )}
      </Space>
    </Card>
  );
};

export default PlanHistory;
