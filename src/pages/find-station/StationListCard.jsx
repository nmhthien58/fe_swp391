// src/pages/find-station/StationListCard.jsx
import React from "react";
import {
  Card,
  List,
  Button,
  Tooltip,
  Skeleton,
  Typography,
  Tag,
  Badge,
} from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { BsEvStationFill } from "react-icons/bs";
import FeedbackSummary from "../../components/feedback/FeedbackSummary";

const { Title, Text } = Typography;

const StationListCard = ({
  loading,
  stations,
  glassCard,
  onOpenBookingForStation,
  onOpenFeedbackModal,
}) => {
  return (
    <Card bordered={false} style={glassCard} bodyStyle={{ padding: 16 }}>
      <Title level={5} style={{ marginBottom: 12 }}>
        Các trạm hiện tại
      </Title>

      {loading ? (
        <>
          <Skeleton active avatar paragraph={{ rows: 1 }} />
          <Skeleton active avatar paragraph={{ rows: 1 }} />
          <Skeleton active avatar paragraph={{ rows: 1 }} />
        </>
      ) : (
        <List
          dataSource={stations}
          locale={{ emptyText: "Không có trạm" }}
          itemLayout="horizontal"
          style={{ maxHeight: 400, overflowY: "auto" }}
          renderItem={(st) => {
            const fullCount = (st.batteries || []).filter(
              (b) => b.status === "FULL"
            ).length;

            return (
              <List.Item
                key={st.stationId}
                actions={[
                  <Tooltip title="Đặt lịch tại trạm này" key="calendar">
                    <Button
                      type="text"
                      icon={<CalendarOutlined />}
                      onClick={() => onOpenBookingForStation(st.stationId)}
                    />
                  </Tooltip>,
                ]}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                <List.Item.Meta
                  avatar={
                    <BsEvStationFill
                      color={
                        fullCount === 0
                          ? "red"
                          : fullCount < 5
                          ? "orange"
                          : "green"
                      }
                      size={24}
                    />
                  }
                  title={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <Text strong>{st.name}</Text>
                      <Tag color={st.status === "ACTIVE" ? "green" : "red"}>
                        {st.status}
                      </Tag>
                      <Badge
                        count={`${fullCount} PIN ĐẦY`}
                        style={{ backgroundColor: "#52c41a" }}
                      />
                    </div>
                  }
                  description={
                    <>
                      <div style={{ marginTop: 6 }}>
                        <FeedbackSummary
                          stationId={st.stationId}
                          onClick={({ feedbacks }) =>
                            onOpenFeedbackModal(st, feedbacks)
                          }
                        />
                      </div>
                      <Text type="secondary">{st.address}</Text>
                    </>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
};

export default StationListCard;
