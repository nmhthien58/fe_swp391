// src/pages/manage-user/UserTable.jsx
import React from "react";
import { Button, Popconfirm, Table, Tag } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const UserTable = ({
  users,
  loading,
  pagination,
  onChange,
  onEditUser,
  onDeleteUser,
  onAssignStaff,
}) => {
  const columns = [
    {
      title: "Driver ID",
      dataIndex: "driverId",
      key: "driverId",
      width: 110,
    },
    {
      title: "Tên đăng nhập",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Đang hoạt động" : "Ngừng"}
        </Tag>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "roles",
      key: "roles",
      render: (roles) =>
        Array.isArray(roles)
          ? roles.map((r, i) => {
              const type = r?.userType;
              let color = "blue";
              if (type === "ADMIN") color = "red";
              if (type === "DRIVER") color = "green";
              if (type === "STAFF") color = "geekblue";
              return (
                <Tag color={color} key={i}>
                  {type}
                </Tag>
              );
            })
          : null,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 280,
      render: (_, record) => {
        const isStaff =
          Array.isArray(record.roles) &&
          record.roles.some((r) => r?.userType === "STAFF");

        return (
          <>
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => onEditUser(record)}
              style={{ marginRight: 8 }}
            >
              Sửa
            </Button>

            <Popconfirm
              title="Xóa tài khoản?"
              description="Bạn có chắc chắn muốn xóa tài khoản này? "
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDeleteUser(record.driverId)}
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>

            {isStaff && (
              <Button
                size="small"
                style={{ marginRight: 8, marginLeft: 8 }}
                onClick={() => onAssignStaff(record)}
              >
                Assign Staff
              </Button>
            )}
          </>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users}
      rowKey={(r) => r.driverId ?? r.id}
      loading={loading}
      pagination={{
        ...pagination,
        showSizeChanger: true,
        showTotal: (total) => `Tổng cộng ${total} tài khoản`,
      }}
      onChange={onChange}
      bordered
      size="middle"
    />
  );
};

export default UserTable;
