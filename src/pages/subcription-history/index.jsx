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
} from "antd";
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

  // helpers
  const vnd = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        }).format(n)
      : "-";

  // GMT+7 hiển thị đẹp
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

  const autoRenewTag = (v) => (
    <Tag color={v ? "blue" : "default"}>{v ? "Tự gia hạn" : "Không"}</Tag>
  );

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

  const columns = useMemo(
    () => [
      {
        title: "Mã ĐK",
        dataIndex: "subscriptionId",
        key: "subscriptionId",
        width: 100,
        fixed: "left",
      },
      {
        title: "Tên gói",
        key: "planName",
        render: (_, r) => (
          <Space direction="vertical" size={2}>
            <Text strong>{r?.plan?.name || "-"}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r?.plan?.description || ""}
            </Text>
          </Space>
        ),
        ellipsis: true,
      },
      {
        title: "Giá gói",
        key: "price",
        render: (_, r) => vnd(r?.plan?.price),
        width: 120,
      },
      {
        title: "Thời hạn",
        key: "duration",
        render: (_, r) => (r?.plan?.durationDays ?? "-") + " ngày",
        width: 110,
      },
      {
        title: "Giới hạn lượt",
        key: "limit",
        render: (_, r) => r?.plan?.swapLimit ?? "-",
        width: 120,
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
        title: "Đã dùng",
        dataIndex: "swapsUsed",
        key: "swapsUsed",
        width: 90,
      },
      {
        title: "Trạng thái",
        key: "status",
        render: (_, r) => statusTag(r?.status, r?.active),
        width: 140,
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
            {r?.payment?.paidAt && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {fmtVN(r.payment.paidAt)}
              </Text>
            )}
          </Space>
        ),
        width: 170,
      },
      {
        title: "Gia hạn",
        key: "autoRenew",
        render: (_, r) => autoRenewTag(r?.autoRenew),
        width: 110,
      },
    ],
    []
  );

  return (
    <Card bordered={false} bodyStyle={{ padding: 20 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Title level={4} style={{ margin: 0 }}>
          Lịch sử đăng ký gói
        </Title>

        {loading ? (
          <Spin />
        ) : err ? (
          <Empty description={err} />
        ) : rows.length === 0 ? (
          <Empty description="Chưa có lịch sử đăng ký gói." />
        ) : (
          <Table
            size="middle"
            rowKey="subscriptionId"
            dataSource={rows}
            columns={columns}
            scroll={{ x: 980 }}
            pagination={{ pageSize: 8, showSizeChanger: true }}
          />
        )}
      </Space>
    </Card>
  );
};

export default PlanHistory;
