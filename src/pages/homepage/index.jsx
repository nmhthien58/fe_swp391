import React from "react";
import {
  Layout,
  Input,
  Button,
  Row,
  Col,
  Card,
  Avatar,
  Typography,
  Space,
  Menu,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CarOutlined,
  UnorderedListOutlined,
  CreditCardOutlined,
  SettingOutlined,
  LogoutOutlined,
  DollarCircleFilled,
  DollarCircleOutlined,
} from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { BiPackage } from "react-icons/bi";

// Fix leaflet's default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const Homepage = () => {
  const position = [10.7769, 106.7009]; // Tọa độ ví dụ cho TP.HCM

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <Header
        style={{
          backgroundColor: "white",
          padding: "0 50px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            {/* <Space align="center">
              <img
                src="https://cdn-icons-png.freepik.com/512/6004/6004658.png"
                style={{ height: "32px" }}
              />
              <Title level={4} style={{ marginBottom: 0, color: "#00529B" }}>
                EV Swap Connect
              </Title>
            </Space> */}
            <Space>
              Nút tạm để test nha
              <Button href="/dashboard">Admin Page</Button>
              <Button href="/staff">Staff Page</Button>
              <Button href="/login">Login</Button>
              <Button href="/register">Register</Button>
            </Space>
          </Col>
          <Col>
            <Menu
              mode="horizontal"
              defaultSelectedKeys={["tim-tram"]}
              style={{ borderBottom: "none" }}
            >
              <Menu.Item key="trang-chu">Trang chủ</Menu.Item>
              <Menu.Item key="tim-tram">Tìm Trạm</Menu.Item>
              <Menu.Item key="lich-su">Lịch Sử</Menu.Item>
              <Menu.Item key="ho-tro">Hỗ Trợ</Menu.Item>
              <Menu.Item key="tai-khoan">Tài Khoản</Menu.Item>
            </Menu>
          </Col>
          <Col>
            <Space align="center">
              <Avatar icon={<UserOutlined />} />
              <Text>User name</Text>
            </Space>
          </Col>
        </Row>
      </Header>
      <Content style={{ padding: "24px 50px" }}>
        <Row gutter={24}>
          <Col span={16}>
            <Card bordered={false}>
              <Input
                placeholder="Tìm trạm theo địa chỉ hoặc tên trạm..."
                prefix={<SearchOutlined />}
                style={{ marginBottom: 16 }}
              />
              <Space>
                <Button type="primary">Tìm trạm gần nhất</Button>
                <Button>Đặt lịch trước</Button>
              </Space>
              <div
                style={{
                  height: "500px",
                  marginTop: "16px",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <MapContainer
                  center={position}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[10.779, 106.702]}>
                    <Popup>Có 12 pin</Popup>
                  </Marker>
                  <Marker position={[10.775, 106.705]}>
                    <Popup>Có 3 pin</Popup>
                  </Marker>
                  <Marker position={[10.781, 106.699]}>
                    <Popup>Bảo trì</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Card bordered={false}>
                <Row gutter={16} align="middle">
                  <Col>
                    <img
                      src="https://vinfast3slangson.com.vn/wp-content/uploads/2024/07/vinfast-vfe34-3480-351.jpg"
                      alt="VinFast VFe34"
                      style={{ width: "100px" }}
                    />
                  </Col>
                  <Col>
                    <Title level={5}>VinFast VFe34</Title>
                    <Text strong>59A-123.45</Text>
                    <br />
                    <Text type="secondary">Loại pin: Lithium-ion 42 kWh</Text>
                  </Col>
                </Row>
              </Card>
              <Card
                bordered={false}
                bodyStyle={{
                  borderLeft: "4px solid #1890ff",
                  paddingLeft: "20px",
                }}
              >
                <Title level={5}>Gói đã đăng ký</Title>
                <Space align="center">
                  <DollarCircleOutlined />
                  <Text>Gói 1: 36 lượt đổi pin</Text>
                </Space>
                <br />
                <Text style={{ marginLeft: "25px" }}></Text>
                <br />
                <Space style={{}}>
                  <Button type="primary">Xem gói</Button>
                </Space>
              </Card>
              {/* <Card
                bordered={false}
                bodyStyle={{
                  borderLeft: "4px solid ",
                  paddingLeft: "20px",
                }}
              >
                <Title level={5}>Truy cập nhanh</Title>
                <Row justify="space-around">
                  <Col align="center">
                    <Button
                      type="text"
                      icon={
                        <UnorderedListOutlined style={{ fontSize: "24px" }} />
                      }
                    />
                    <Text>Lịch sử đổi pin</Text>
                  </Col>
                  <Col align="center">
                    <Button
                      type="text"
                      icon={<CreditCardOutlined style={{ fontSize: "24px" }} />}
                    />
                    <Text>Thanh toán</Text>
                  </Col>
                  <Col align="center">
                    <Button
                      type="text"
                      icon={<SettingOutlined style={{ fontSize: "24px" }} />}
                    />
                    <Text>Cài đặt</Text>
                  </Col>
                  <Col align="center">
                    <Button
                      type="text"
                      icon={<LogoutOutlined style={{ fontSize: "24px" }} />}
                    />
                    <Text>Đăng xuất</Text>
                  </Col>
                </Row>
              </Card> */}
            </Space>
          </Col>
        </Row>
      </Content>
      <Footer
        style={{
          textAlign: "center",
          backgroundColor: "white",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <Space>
          <a href="#">Về chúng tôi</a> <a href="#">Điều khoản</a>{" "}
          <a href="#">Bảo mật</a> <a href="#">Liên hệ</a>{" "}
        </Space>
      </Footer>
    </Layout>
  );
};

export default Homepage;
