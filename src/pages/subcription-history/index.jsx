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
  const [plans, setPlans] = useState([]); // <--- NEW
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

  const statusTag = (status) => {
    const map = {
      ACTIVE: { color: "green", text: "ACTIVE" },
      PENDING_PAYMENT: { color: "orange", text: "PENDING_PAYMENT" },
      EXPIRED: { color: "red", text: "EXPIRED" },
      CANCELLED: { color: "red", text: "CANCELLED" },
    };

    const cfg = map[status] || { color: "default", text: status || "UNKNOWN" };
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  // const paymentTag = (pmt) => {
  //   if (!pmt) return <Tag>—</Tag>;
  //   const map = { SUCCESS: "green", FAILED: "red", PENDING: "orange" };
  //   return <Tag color={map[pmt.status] || "default"}>{pmt.status}</Tag>;
  // };

  // 🟦 1) Fetch danh sách subscription plan
  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get("/api/subscription-plans/all");
        const list = res?.data?.result || [];
        setPlans(list);
      } catch (e) {
        console.warn("Không tải được danh sách plan:", e);
        setPlans([]);
      }
    };
    run();
  }, []);

  // 🟦 2) Fetch lịch sử subscriptions
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
        const raw = Array.isArray(res.data) ? res.data : [];

        const data = raw.map((item) => {
          if (item.plan) return item;

          const {
            planName,
            swapLimit,
            price,
            durationDays,
            pricePerSwap,
            pricePerExtraSwap,
            description,
          } = item;

          return {
            ...item,
            plan: {
              name: planName || "Gói đăng ký",
              swapLimit: swapLimit,
              price: price,
              durationDays: durationDays,
              pricePerSwap: pricePerSwap,
              pricePerExtraSwap: pricePerExtraSwap,
              description: description,
            },
          };
        });

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

  // 🟦 Tổng tiền đã thanh toán thành công
  // const totalPaid = useMemo(() => {
  //   return data
  //     .filter((r) => r?.payment?.status === "SUCCESS")
  //     .reduce((sum, r) => sum + (r?.payment?.amountVnd || 0), 0);
  // }, [data]);

  // 🟦 NEW: Tổng tiền từ các gói ACTIVE theo bảng plan
  const totalActivePlanPrice = useMemo(() => {
    if (!plans.length) return 0;

    return data
      .filter((r) => r.status === "ACTIVE" || r.active === true)
      .reduce((sum, r) => {
        const p = plans.find((pl) => pl.name === r.plan?.name);
        return sum + (p?.price || 0);
      }, 0);
  }, [data, plans]);

  const columns = [
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
      width: 300,
    },
    {
      title: "Giá",
      key: "price",
      render: (_, r) => {
        const p = plans.find((pl) => pl.name === r.plan?.name);
        // fallback: nếu không tìm thấy trong plans thì lấy từ r.plan
        const price = p?.price ?? r?.plan?.price;
        return vnd(price);
      },
      width: 120,
    },
    {
      title: "Thời hạn",
      key: "durationDays",
      render: (_, r) => {
        const p = plans.find((pl) => pl.name === r.plan?.name);
        const duration = p?.durationDays ?? r?.plan?.durationDays;
        return duration ? `${duration} ngày` : "-";
      },
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
      title: "Trạng thái",
      key: "status",
      render: (_, r) => statusTag(r?.status),
      width: 120,
    },
    // {
    //   title: "Thanh toán",
    //   key: "payment",
    //   render: (_, r) => (
    //     <Space direction="vertical" size={0}>
    //       {paymentTag(r?.payment)}
    //       {r?.payment?.amountVnd != null && (
    //         <Text style={{ fontSize: 12 }}>{vnd(r.payment.amountVnd)}</Text>
    //       )}
    //     </Space>
    //   ),
    //   width: 140,
    // },
  ];

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

        {/* Tổng tiền đã thanh toán */}
        {/* <div
          style={{
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: 8,
            padding: "10px 16px",
          }}
        >
          <Text strong style={{ fontSize: 15 }}>
            Tổng tiền thanh toán thành công:
          </Text>{" "}
          <Text style={{ fontSize: 15, color: "#1677ff", fontWeight: 600 }}>
            {vnd(totalPaid)}
          </Text>
        </div> */}

        {/* NEW: Tổng tiền gói active */}
        <div
          style={{
            background: "#e6f7ff",
            border: "1px solid #91d5ff",
            borderRadius: 8,
            padding: "10px 16px",
          }}
        >
          <Text strong style={{ fontSize: 15 }}>
            Tổng tiền đã thanh toán:
          </Text>{" "}
          <Text style={{ fontSize: 15, color: "#096dd9", fontWeight: 600 }}>
            {vnd(totalActivePlanPrice)}
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
