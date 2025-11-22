// src/components/feedback/FeedbackSummary.jsx
import React, { useEffect, useState } from "react";
import { Rate } from "antd";
import api from "../../config/axios";

const FeedbackSummary = ({ stationId, onClick }) => {
  const [loading, setLoading] = useState(true);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/api/feedbacks/station/${stationId}`);
        const data = Array.isArray(res.data) ? res.data : [];
        if (!mounted) return;

        setFeedbacks(data);

        const total = data.reduce(
          (sum, fb) => sum + (fb.overallRating || 0),
          0
        );
        const len = data.length;
        setAvg(len ? total / len : 0);
        setCount(len);
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        if (mounted) {
          setFeedbacks([]);
          setAvg(0);
          setCount(0);
        }
      } finally {
        mounted && setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [stationId]);

  return (
    <div
      onClick={() => onClick && onClick({ feedbacks })}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "#f5f7ff",
        border: "1px solid rgba(22, 119, 255, 0.18)",
        borderRadius: 999,
        padding: "3px 10px",
        cursor: "pointer",
      }}
    >
      {loading ? (
        <span style={{ fontSize: 12, color: "#888" }}>Đang tải…</span>
      ) : count === 0 ? (
        <span style={{ fontSize: 12, color: "#888" }}>Chưa có đánh giá</span>
      ) : (
        <>
          <span style={{ fontWeight: 600, fontSize: 12 }}>
            {avg.toFixed(1)}
          </span>
          <Rate
            disabled
            allowHalf
            value={avg}
            style={{ fontSize: 12, lineHeight: 1 }}
          />
          <span style={{ fontSize: 12, color: "#555" }}>({count})</span>
        </>
      )}
    </div>
  );
};

export default FeedbackSummary;
