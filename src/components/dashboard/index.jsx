import React, { useState } from "react";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  WarningOutlined, // Added for dropdown menu
} from "@ant-design/icons";
import { Breadcrumb, Layout, Menu, theme, Avatar, Dropdown, Space } from "antd";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { IoPeopleOutline } from "react-icons/io5";
import { HiLocationMarker } from "react-icons/hi";
import { PiPackage } from "react-icons/pi";
import { FaChargingStation } from "react-icons/fa";
// import { useDispatch, useSelector } from "react-redux"; // Import useSelector to get data from Redux
// import { logout } from "../../redux/accountSlice";

const { Header, Content, Footer, Sider } = Layout;

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label: <Link to={key}>{label}</Link>,
  };
}

const items = [
  getItem("Manage Station", "station", <FaChargingStation size={15} />),
  getItem("Manage User", "user", <IoPeopleOutline size={15} />),
  getItem(
    "Manage Battery Rent Package",
    "rentpackage",
    <PiPackage size={15} />
  ),
  getItem("Reports and statistics", "overview", <PieChartOutlined size={15} />),
  getItem("Complaints", "complaints", <WarningOutlined size={15} />),
];

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Get account data from Redux store
  // const account = useSelector((state) => state.account);
  // const dispatch = useDispatch();
  const navigate = useNavigate();

  // Define items for the dropdown menu
  const itemsDropdown = [
    {
      key: "1",
      label: <Link to="/profile">Profile</Link>, // Example link
      icon: <UserOutlined />,
    },
    {
      key: "2",
      label: (
        <button
          onClick={() => {
            // dispatch(logout());
            navigate("/");
          }}
        >
          Logout
        </button>
      ), // Example link
      icon: <LogoutOutlined />,
      danger: true, // Mark as a dangerous action
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={260}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          defaultSelectedKeys={["station"]}
          mode="inline"
          items={items}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: "0 24px", background: colorBgContainer }}>
          {/* Header Content: User Info Dropdown */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Dropdown menu={{ items: itemsDropdown }} trigger={["click"]}>
              <a onClick={(e) => e.preventDefault()}>
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  {/* Use optional chaining and nullish coalescing for safety */}
                  {/* <span>{account?.user?.name ?? "Guest"}</span> */}
                </Space>
              </a>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: "0 16px" }}>
          <Breadcrumb style={{ margin: "16px 0" }} items={[{ title: "" }]} />
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          EV Battery Swap Station Management System
        </Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
