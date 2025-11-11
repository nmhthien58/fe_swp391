// src/components/feedback/FeedbackDetailContent.jsx
import React, { useEffect, useState } from "react";
import {
  Typography,
  Rate,
  List,
  Result,
  Divider,
  Button,
  Input,
  Space,
  message,
} from "antd";
import dayjs from "dayjs";
import api from "../../config/axios";

const { Title, Text } = Typography;

const FeedbackDetailContent = ({ station, feedbacks: initialFeedbacks }) => {
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks || []);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // sync khi đổi trạm / data
  useEffect(() => {
    setFeedbacks(initialFeedbacks || []);
    setShowForm(false);
    setRating(0);
    setComment("");
  }, [initialFeedbacks, station]);

  if (!station) return null;

  const avg =
    feedbacks && feedbacks.length
      ? feedbacks.reduce((s, f) => s + (f.overallRating || 0), 0) /
        feedbacks.length
      : 0;

  const handleSubmit = async () => {
    if (!rating) {
      message.warning("Vui lòng chọn số sao.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/api/feedbacks/create", {
        stationId: station.stationId,
        overallRating: rating,
        comments: comment,
        serviceRatings: [
          {
            category: "STAFF_ATTITUDE",
            rating,
            comment,
          },
        ],
      });

      const newFb = res?.data
        ? res.data
        : {
            feedbackId: Math.random().toString(36).slice(2),
            stationId: station.stationId,
            overallRating: rating,
            comments: comment,
            serviceRatings: [
              {
                serviceRatingId: Math.random().toString(36).slice(2),
                category: "STAFF_ATTITUDE",
                rating,
                comment,
              },
            ],
            createdAt: new Date().toISOString(),
          };

      setFeedbacks((prev) => [newFb, ...prev]);
      message.success("Đã gửi đánh giá.");
      setShowForm(false);
      setRating(0);
      setComment("");
    } catch (err) {
      console.error(err);
      message.error("Gửi đánh giá thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header trạm */}
      <div
        style={{
          marginBottom: 16,
          padding: 12,
          borderRadius: 12,
          background: "#fafafa",
          border: "1px solid #f0f0f0",
        }}
      >
        <Title level={5} style={{ marginBottom: 4 }}>
          {station.name}
        </Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
          {station.address}
        </Text>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Rate disabled allowHalf value={avg} />
          <span>
            {avg.toFixed(1)} · {feedbacks ? feedbacks.length : 0} đánh giá
          </span>
        </div>
      </div>

      {/* Danh sách feedback */}
      {!feedbacks || feedbacks.length === 0 ? (
        <Result
          status="info"
          title="Chưa có đánh giá cho trạm này"
          subTitle="Hãy là người đầu tiên đánh giá!"
        />
      ) : (
        <List
          dataSource={feedbacks}
          style={{ maxHeight: "45vh", overflowY: "auto", marginBottom: 16 }}
          renderItem={(fb) => (
            <List.Item
              style={{
                borderBottom: "1px solid #f0f0f0",
                paddingLeft: 0,
                paddingRight: 0,
              }}
            >
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <Rate disabled value={fb.overallRating} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {fb.createdAt
                      ? dayjs(fb.createdAt)
                          .add(7, "hour")
                          .format("DD/MM/YYYY HH:mm")
                      : ""}
                  </Text>
                </div>
                {fb.comments && (
                  <p style={{ marginBottom: 4 }}>{fb.comments}</p>
                )}
              </div>
            </List.Item>
          )}
        />
      )}

      <Divider style={{ margin: "8px 0 12px" }} />

      {!showForm ? (
        <Button type="primary" block onClick={() => setShowForm(true)}>
          Viết đánh giá
        </Button>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <Text strong>Đánh giá của bạn</Text>
            <div style={{ marginTop: 4 }}>
              <Rate value={rating} onChange={setRating} />
            </div>
          </div>
          <div>
            <Text strong>Nhận xét</Text>
            <Input.TextArea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Dịch vụ thế nào, nhân viên hỗ trợ ra sao..."
            />
          </div>
          <Space style={{ justifyContent: "flex-end" }}>
            <Button onClick={() => setShowForm(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSubmit} loading={submitting}>
              Gửi đánh giá
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
};

export default FeedbackDetailContent;
