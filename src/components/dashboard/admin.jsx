import React, { useState } from "react";
import {
  PieChartOutlined,
  WarningOutlined,
  HomeFilled,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import {
  Breadcrumb,
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Button,
} from "antd";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { IoPeopleOutline } from "react-icons/io5";
import { PiPackage } from "react-icons/pi";
import { FaChargingStation } from "react-icons/fa";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { logout, selectUser } from "../../redux/accountSlice";
import { persistor } from "../../redux/store";

const { Header, Content, Footer, Sider } = Layout;

// Hàm tạo menu item
function getItem(label, key, icon) {
  return {
    key,
    icon,
    label: <Link to={key}>{label}</Link>,
  };
}

const items = [
  getItem(
    <span style={{ fontWeight: 700, fontSize: "16px" }}>Homepage</span>,
    "/",
    <HomeFilled style={{ fontSize: "16px" }} />
  ),
  {
    type: "divider",
    style: { backgroundColor: "rgba(255, 255, 255, 0.3)", margin: "8px 16px" },
  },
  getItem("Manage Station", "station", <FaChargingStation size={15} />),
  getItem("Manage User", "user", <IoPeopleOutline size={15} />),
  getItem(
    "Manage Battery Rent Package",
    "rentpackage",
    <PiPackage size={15} />
  ),
  getItem("Reports and Statistics", "overview", <PieChartOutlined size={15} />),
  getItem("Manage Ticket", "manageticket", <WarningOutlined size={15} />),
];

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const userNameToShow = user?.fullName || user?.userName || "Admin";

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const selectedKey = pathSegments.length > 1 ? pathSegments[1] : "/";

  // Dropdown menu
  const itemsDropdown = [
    {
      key: "profile",
      disabled: true,
      label: (
        <div>
          <strong style={{ display: "block" }}>{userNameToShow}</strong>
          <span style={{ fontSize: 12, color: "#999" }}>
            {(user?.roles && user?.roles[0]?.userType) || "ADMIN"}
          </span>
        </div>
      ),
    },
    { type: "divider" },
    {
      key: "account",
      label: <Link to="/account">Quản lý tài khoản</Link>,
      icon: <UserOutlined />,
    },
    {
      key: "logout",
      label: (
        <span
          style={{ color: "red", fontWeight: 600 }}
          onClick={async () => {
            dispatch(logout());
            await persistor.purge();
            toast.success("Đăng xuất thành công!");
            navigate("/", { replace: true });
          }}
        >
          Đăng xuất
        </span>
      ),
      icon: <LogoutOutlined style={{ color: "red" }} />,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <Sider
        width={260}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          mode="inline"
          items={items}
        />
      </Sider>

      <Layout>
        {/* HEADER */}
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            height: 64,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Dropdown
            menu={{ items: itemsDropdown }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              style={{
                height: 40,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 12px",
                fontWeight: 500,
                color: "#1677ff",
              }}
            >
              <Avatar
                size={28}
                style={{
                  backgroundColor: "#1677ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                icon={<UserOutlined />}
              />
              <span style={{ lineHeight: 1 }}>{userNameToShow}</span>
            </Button>
          </Dropdown>
        </Header>

        {/* MAIN CONTENT */}
        <Content style={{ margin: "0 16px" }}>
          <Breadcrumb style={{ margin: "16px 0" }} />
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: "#fff",
              borderRadius: 8,
            }}
          >
            <Outlet />
          </div>
        </Content>

        {/* FOOTER */}
        <Footer style={{ textAlign: "center" }}>
          EV Battery Swap Station Management System ©2025
        </Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
