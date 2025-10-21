import React, { useState } from "react";
import {
  PieChartOutlined,
  WarningOutlined,
  HomeFilled,
  UserOutlined,
  LogoutOutlined,
  DollarOutlined,
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
import { IoPeopleOutline } from "react-icons/io5";
import { PiPackage } from "react-icons/pi";
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
  getItem(
    <span style={{ fontWeight: 700, fontSize: "16px" }}>Trang chủ</span>,
    "/",
    <HomeFilled style={{ fontSize: 16 }} />
  ),
  {
    type: "divider",
    style: { backgroundColor: "rgba(255, 255, 255, 0.3)", margin: "8px 16px" },
  },
  getItem("Quản lý pin tồn kho", "stock", <FiBattery size={15} />),
  getItem("Quản lý giao dịch", "swap", <DollarOutlined size={15} />),
];

const StaffDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy user từ Redux (giống admin)
  const user = useSelector(selectUser);
  const userNameToShow = user?.fullName || user?.userName || "Staff";

  // Tính key đang chọn theo URL
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const selectedKey = pathSegments.length > 1 ? pathSegments[1] : "/";

  // Dropdown menu giống admin
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
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={240}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div className="demo-logo-vertical" />
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

        {/* CONTENT */}
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

export default StaffDashboard;
