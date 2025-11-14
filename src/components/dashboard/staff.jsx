// src/layouts/StaffDashboard.jsx
import React, { useState } from "react";
import {
  HomeFilled,
  UserOutlined,
  LogoutOutlined,
  CalendarFilled,
} from "@ant-design/icons";
import {
  Breadcrumb,
  Layout,
  Menu,
  theme,
  Avatar,
  Dropdown,
  Button,
} from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FiBattery } from "react-icons/fi";

import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser } from "../../redux/accountSlice";
import { persistor } from "../../redux/store";
import { toast } from "react-toastify";

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
  getItem("Quản lý pin tồn kho", "stock", <FiBattery size={15} />),
  getItem(
    "Quản lý giao dịch đổi pin",
    "booking",
    <CalendarFilled style={{ fontSize: 16 }} />
  ),
];

const StaffDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useSelector(selectUser);
  const userNameToShow = user?.fullName || user?.userName || "Staff";

  // /staff/stock -> "stock"
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const selectedKey = pathSegments.length > 1 ? pathSegments[1] : "/";

  const itemsDropdown = [
    {
      key: "profileHeader",
      disabled: true,
      label: (
        <div>
          <strong style={{ display: "block" }}>{userNameToShow}</strong>
          <span style={{ fontSize: 12, color: "#999" }}>
            {(user?.roles && user?.roles[0]?.userType) || "STAFF"}
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
    <Layout style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      {/* SIDEBAR */}
      <Sider
        width={240}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{
          background:
            "radial-gradient(circle at top left, #111827 0%, #020617 60%)",
          boxShadow: "2px 0 16px rgba(15,23,42,0.6)",
        }}
      >
        {/* Logo + tiêu đề nhỏ (Clickable) */}
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
            transition: "0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
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
              <div style={{ color: "#9ca3af", fontSize: 11 }}>Staff page</div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          mode="inline"
          items={items}
          style={{
            borderInlineEnd: "none",
            background: "transparent",
            marginTop: 4,
          }}
        />
      </Sider>

      {/* PHẦN BÊN PHẢI */}
      <Layout>
        {/* HEADER */}
        <Header
          style={{
            padding: "0 24px",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            height: 64,
            borderBottom: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
            position: "sticky",
            top: 0,
            zIndex: 10,
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
                gap: 10,
                padding: "0 12px",
                fontWeight: 500,
                color: "#111827",
                borderRadius: 999,
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
              }}
            >
              <Avatar
                size={26}
                style={{
                  background:
                    "linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #0ea5e9 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
                icon={<UserOutlined />}
              />
              <span style={{ lineHeight: 1 }}>{userNameToShow}</span>
            </Button>
          </Dropdown>
        </Header>

        {/* CONTENT + FOOTER giữ nguyên như cũ */}
        <Content style={{ margin: "0 16px" }}>
          <Breadcrumb style={{ margin: "16px 0" }} items={[{ title: "" }]} />
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
            }}
          >
            <Outlet />
          </div>
        </Content>

        <Footer style={{ textAlign: "center", background: "transparent" }}>
          EV Battery Swap Station Management System
        </Footer>
      </Layout>
    </Layout>
  );
};

export default StaffDashboard;
