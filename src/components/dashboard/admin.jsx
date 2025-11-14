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
import { GiBatteries } from "react-icons/gi";
import { BsBatteryCharging } from "react-icons/bs";

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
  getItem("Quản lý trạm", "station", <FaChargingStation size={15} />),
  getItem("Quản lý User", "user", <IoPeopleOutline size={15} />),
  getItem("Quản lý gói dịch vụ", "rentpackage", <PiPackage size={15} />),
  getItem("Thống kê & Báo cáo", "overview", <PieChartOutlined size={15} />),
  getItem("Quản lý vé hỗ trợ", "manageticket", <WarningOutlined size={15} />),
  getItem("Quản lý pin", "batteries", <BsBatteryCharging size={15} />),
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
        style={{
          background:
            "radial-gradient(circle at top, #0f172a 0, #020617 45%, #000 100%)",
          boxShadow: "2px 0 16px rgba(15,23,42,0.7)",
          borderRight: "1px solid rgba(15,23,42,0.9)",
        }}
      >
        {/* Logo + tiêu đề (clickable) */}
        <div
          onClick={() => navigate("/")}
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            padding: collapsed ? "0 12px" : "0 18px",
            gap: 10,
            borderBottom: "1px solid rgba(55,65,81,0.7)",
            cursor: "pointer",
          }}
        >
          {!collapsed && (
            <div style={{ lineHeight: 1.2 }}>
              <div
                style={{
                  color: "#e5e7eb",
                  fontWeight: 700,
                  fontSize: 16,
                  letterSpacing: 0.2,
                }}
              >
                EV Battery Swap Station
              </div>
              <div style={{ color: "#9ca3af", fontSize: 11 }}>Admin page</div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          mode="inline"
          items={items}
          style={{
            background: "transparent",
            paddingTop: 8,
            borderRight: 0,
          }}
        />
      </Sider>

      <Layout>
        {/* HEADER */}
        <Header
          style={{
            padding: "0 24px",
            background:
              "linear-gradient(90deg, #f9fafb 0%, #eef2ff 45%, #eff6ff 100%)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 64,
            borderBottom: "1px solid #e5e7eb",
            boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
          }}
        >
          {/* Title bên trái */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: 16,
                color: "#111827",
              }}
            >
              Admin Dashboard
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              EV Battery Swap Station Management
            </span>
          </div>

          {/* User dropdown bên phải */}
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
                color: "#1d4ed8",
                borderRadius: 999,
                boxShadow: "0 0 0 1px rgba(59,130,246,0.15)",
                background: "rgba(255,255,255,0.9)",
              }}
            >
              <Avatar
                size={28}
                style={{
                  background: "linear-gradient(135deg, #2563eb, #22c55e)",
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
              borderRadius: 12,
              boxShadow: "0 10px 40px rgba(15,23,42,0.06)",
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
