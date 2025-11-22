// src/pages/find-station/AccountAndPlanCard.jsx
import React from "react";
import {
  Card,
  Row,
  Col,
  Space,
  Badge,
  Skeleton,
  Divider,
  Avatar,
  Button,
  Tag,
  Typography,
} from "antd";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  CarOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const AccountAndPlanCard = ({
  user,
  showInfoCard,
  setShowInfoCard,
  vehicle,
  vehLoading,
  onLinkVehicle,
  planLoading,
  activePlan,
  activeSub,
  onGoPlans,
  vnd,
  fmtVN,
  glassCard,
}) => {
  if (!user) return null;

  return (
    <Card bordered={false} style={glassCard} bodyStyle={{ padding: 16 }}>
      {/* Header có nút ẩn/hiện */}
      <Row align="middle" justify="space-between" style={{ marginBottom: 8 }}>
        <Col>
          <Title level={5} style={{ margin: 0 }}>
            Tài khoản & dịch vụ
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Phương tiện đã liên kết và gói đăng ký
          </Text>
        </Col>
        <Col>
          <Button
            type="text"
            icon={showInfoCard ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setShowInfoCard((prev) => !prev)}
          >
            {showInfoCard ? "Ẩn" : "Hiện"}
          </Button>
        </Col>
      </Row>

      {showInfoCard && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* ========== PHƯƠNG TIỆN ========== */}
          <div>
            <Row
              align="middle"
              justify="space-between"
              style={{ marginBottom: 8 }}
            >
              <Col>
                <Text strong>Thông tin phương tiện đã liên kết</Text>
              </Col>
              <Col>
                <Badge color="blue" text="Xe điện" />
              </Col>
            </Row>

            {vehLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : vehicle ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 12,
                }}
              >
                <Avatar
                  shape="square"
                  size={90}
                  src={vehicle.imageUrl}
                  icon={<CarOutlined />}
                  style={{
                    borderRadius: 16,
                    backgroundColor: "#fff",
                    boxShadow: "0 0 6px rgba(0,0,0,0.1)",
                  }}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <div>
                    <Text type="secondary">Biển số xe</Text>
                    <div>{vehicle.vin || "-"}</div>
                  </div>
                  <div>
                    <Text type="secondary">Loại pin</Text>
                    <div>{vehicle.batteryType || "-"}</div>
                  </div>
                  <div>
                    <Text type="secondary">Model</Text>
                    <div>{vehicle.model || "-"}</div>
                  </div>
                  <div>
                    <Text type="secondary">Hãng</Text>
                    <div>{vehicle.manufacturer || "-"}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Bạn chưa liên kết phương tiện
                </div>
                <div style={{ color: "#595959", marginBottom: 12 }}>
                  Hãy liên kết phương tiện để sử dụng dịch vụ.
                </div>
                <Button type="primary" onClick={onLinkVehicle}>
                  Liên kết ngay
                </Button>
              </div>
            )}
          </div>

          <Divider style={{ margin: "0px 0" }} />

          {/* ========== GÓI ĐÃ ĐĂNG KÝ ========== */}
          <div>
            <Text strong>Gói đã đăng ký</Text>
            {planLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : activePlan && activeSub ? (
              <div style={{ marginTop: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Title level={4} style={{ margin: 0 }}>
                    {activePlan.name}
                  </Title>
                  <Tag color={activeSub.active ? "green" : "red"}>
                    {activeSub.active
                      ? "Đang hoạt động"
                      : activeSub.status || "Hết hiệu lực"}
                  </Tag>
                </div>

                <Divider style={{ margin: "12px 0" }} />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <div>
                    <Text type="secondary">Ngày bắt đầu</Text>
                    <div>{fmtVN(activeSub.startDate)}</div>
                  </div>
                  <div>
                    <Text type="secondary">Ngày kết thúc</Text>
                    <div>{fmtVN(activeSub.endDate)}</div>
                  </div>
                  <div>
                    <Text type="secondary">Số lượt đổi</Text>
                    <div>{activePlan.swapLimit ?? "-"}</div>
                  </div>
                  <div>
                    <Text type="secondary">Đã sử dụng</Text>
                    <div>{activeSub.swapsUsed ?? 0}</div>
                  </div>
                  <div>
                    <Text type="secondary">Giá mỗi lần đổi</Text>
                    <div>{vnd(0)}</div>
                  </div>
                  <div>
                    <Text type="secondary">Giá cho lượt vượt</Text>
                    <div>{vnd(20000)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "left", paddingTop: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  Bạn chưa đăng ký gói nào
                </div>
                <Button type="primary" onClick={onGoPlans}>
                  Đăng ký ngay
                </Button>
              </div>
            )}
          </div>
        </Space>
      )}
    </Card>
  );
};

export default AccountAndPlanCard;
