// src/pages/TransHistory.jsx
import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Typography, Space, message } from "antd";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/accountSlice";
import api from "../../config/axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const statusColor = (status) =>
  ({
    COMPLETED: "green",
    PAID: "blue",
    PENDING: "orange",
    CANCELLED: "red",
  }[status] || "default");

const TransHistory = () => {
  const user = useSelector(selectUser); // user chứa driverId
  const [loading, setLoading] = useState(false);
  const [swaps, setSwaps] = useState([]);
  const [page, setPage] = useState(0); // backend 0-index
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchSwaps = async (pageNo = page, size = pageSize) => {
    if (!user?.driverId) return;

    setLoading(true);
    try {
      const res = await api.get("/api/swaps/driver", {
        params: {
          driverId: user.driverId,
          page: pageNo,
          size,
          sort: "createdAt,desc",
        },
      });

      const result = res.data?.result;
      setSwaps(result?.content || []);
      setTotal(result?.totalElements ?? 0);
      setPage(result?.pageNo ?? pageNo);
      setPageSize(result?.pageSize ?? size);
    } catch (err) {
      console.error(err);
      message.error("Không tải được lịch sử đổi pin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwaps(0, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.driverId]);

  const columns = [
    {
      title: "Mã giao dịch",
      dataIndex: "swapId",
      key: "swapId",
      width: 110,
    },
    {
      title: "Trạm",
      dataIndex: "stationId",
      key: "stationId",
      render: (id) => <Text>Trạm #{id}</Text>,
      width: 120,
    },
    {
      title: "Pin lấy",
      dataIndex: "reservedBatteryId",
      key: "reservedBatteryId",
      width: 110,
    },
    {
      title: "Pin trả",
      dataIndex: "returnedBatteryId",
      key: "returnedBatteryId",
      width: 110,
      render: (val) => (val ? val : <Text type="secondary">Chưa trả</Text>),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => (
        <Tag color={statusColor(status)}>{status || "N/A"}</Tag>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amountVnd",
      key: "amountVnd",
      width: 150,
      render: (amount) =>
        amount != null
          ? new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(amount)
          : "--",
    },
    {
      title: "Thời gian tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 190,
      render: (val) =>
        val ? (
          dayjs(val).format("DD/MM/YYYY HH:mm")
        ) : (
          <Text type="secondary">--</Text>
        ),
    },
    {
      title: "Thanh toán",
      dataIndex: "paidAt",
      key: "paidAt",
      width: 190,
      render: (val) =>
        val ? (
          dayjs(val).format("DD/MM/YYYY HH:mm")
        ) : (
          <Text type="secondary">Chưa thanh toán</Text>
        ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              Lịch sử đổi pin
            </Title>
            <Text type="secondary">
              Xem lại các giao dịch đổi pin của bạn theo thứ tự mới nhất.
            </Text>
          </div>

          <Table
            rowKey="swapId"
            loading={loading}
            columns={columns}
            dataSource={swaps}
            pagination={{
              current: page + 1, // Table dùng 1-index
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} giao dịch`,
              onChange: (p, sz) => {
                const newPage = p - 1;
                fetchSwaps(newPage, sz);
              },
            }}
          />
        </Space>
      </Card>
    </div>
  );
};

export default TransHistory;
