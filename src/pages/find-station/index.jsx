// src/pages/find-station/index.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Layout,
  Input,
  Button,
  Row,
  Col,
  Card,
  Typography,
  Space,
  List,
  Tag,
  Spin,
  Modal,
  Select,
  DatePicker,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  LoadingOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { renderToString } from "react-dom/server";
import { BsEvStationFill } from "react-icons/bs";
import api from "../../config/axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

// ==== Goong JS (vector maps) ====
import goongjs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";

import { haversineMeters, metersToKmText } from "../../components/map/mapUtils";
import { toast } from "react-toastify";
import { IoLocationOutline } from "react-icons/io5";

const { Content } = Layout;
const { Title, Text } = Typography;

// ====== CONFIG ======
const GOONG_MAPTILES_KEY = "5rWK5vcJS8dTPc40MUoG5vgaiuYY4tk2FTnoh6AK";
const GOONG_DIRECTIONS_KEY = "hz2CGz7GrqThwJGquwAnyAZrbJgsPEgjztaRd3zo";
const GOONG_DIRECTIONS_URL = "https://rsapi.goong.io/Direction";
const DEFAULT_CENTER = [106.7009, 10.7769]; // [lng, lat] HCMC

// Icon trạm: HTML để gắn vào Marker Goong
const stationMarkerHtml = renderToString(
  <BsEvStationFill color="green" size={32} />
);

// Vẽ polygon xấp xỉ hình tròn (accuracy)
function circlePolygon([lng, lat], radiusMeters, points = 64) {
  const coords = [];
  const R = 6371000;
  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const dx = (radiusMeters * Math.cos(angle)) / R;
    const dy = (radiusMeters * Math.sin(angle)) / R;
    const newLat = lat + (dy * 180) / Math.PI;
    const newLng = lng + (dx * 180) / Math.PI / Math.cos((lat * Math.PI) / 180);
    coords.push([newLng, newLat]);
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

// Giải mã encoded polyline (Google/Goong) -> mảng [lng, lat]
function decodePolyline(str, precision = 5) {
  let index = 0,
    lat = 0,
    lng = 0,
    coordinates = [];
  const factor = Math.pow(10, precision);
  while (index < str.length) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    coordinates.push([lng / factor, lat / factor]); // [lng, lat]
  }
  return coordinates;
}

const FindStation = () => {
  // Danh sách trạm: cột phải (không đổi) + map (đổi theo search)
  const [initialStations, setInitialStations] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [mapStations, setMapStations] = useState([]);
  const [loadingMap, setLoadingMap] = useState(false);

  // Input tìm kiếm (debounce 500ms cho map)
  const [typed, setTyped] = useState(" ");

  // Định vị + trạm gần nhất
  const [locating, setLocating] = useState(false);
  const [userPos, setUserPos] = useState(null); // [lat, lng]
  const [nearest, setNearest] = useState(null); // { ...station, __distance, __accuracy }

  // Tuyến đường từ Directions API (mảng [lng,lat])
  const [routeCoords, setRouteCoords] = useState(null);

  // --- Booking modal state ---
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingStationId, setBookingStationId] = useState(null);
  const [bookingTime, setBookingTime] = useState(
    dayjs().add(30, "minute").second(0).millisecond(0)
  );

  // --- Goong map refs ---
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]); // quản lý vòng đời marker
  const geolocateRef = useRef(null);
  const mapStationsRef = useRef([]); // luôn giữ mapStations mới nhất cho listener

  // Layer/Source ids
  const lineSourceId = "nearest-line";
  const lineLayerId = "nearest-line-layer";
  const accuracySourceId = "user-accuracy";
  const accuracyLayerId = "user-accuracy-layer";
  const routeSourceId = "goong-route"; // <— Directions
  const routeLayerId = "goong-route-layer"; // <— Directions

  // Luôn đồng bộ mapStations -> ref
  useEffect(() => {
    mapStationsRef.current = mapStations;
  }, [mapStations]);

  // Tọa độ polyline fallback
  const polylineLngLat = useMemo(() => {
    if (!userPos || !nearest) return null;
    const [ulat, ulng] = userPos;
    const { latitude: slat, longitude: slng } = nearest;
    if (typeof slat !== "number" || typeof slng !== "number") return null;
    return [
      [ulng, ulat],
      [slng, slat],
    ];
  }, [userPos, nearest]);

  // --- API ban đầu ---
  const fetchInitialStations = async () => {
    setLoadingList(true);
    setLoadingMap(true);
    try {
      const res = await api.get(`/api/stations/search`, {
        params: { keyword: " " },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setInitialStations(data);
      setMapStations(data);
    } catch (e) {
      console.error("Lỗi tải danh sách trạm:", e);
      setInitialStations([]);
      setMapStations([]);
    } finally {
      setLoadingList(false);
      setLoadingMap(false);
    }
  };

  // --- API tìm kiếm cho map ---
  const fetchMapStations = async (kw) => {
    setLoadingMap(true);
    try {
      const res = await api.get(`/api/stations/search`, {
        params: { keyword: kw },
      });
      setMapStations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi khi tìm trạm:", e);
      setMapStations([]);
    } finally {
      setLoadingMap(false);
    }
  };

  useEffect(() => {
    fetchInitialStations();
  }, []);

  // Debounce 500ms cho ô tìm kiếm
  useEffect(() => {
    const t = setTimeout(() => {
      const kw = typed.trim() === "" ? " " : typed;
      fetchMapStations(kw);
    }, 500);
    return () => clearTimeout(t);
  }, [typed]);

  // Khởi tạo Goong map 1 lần
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    goongjs.accessToken = GOONG_MAPTILES_KEY;
    const map = new goongjs.Map({
      container: mapContainerRef.current,
      style: "https://tiles.goong.io/assets/goong_map_web.json",
      center: DEFAULT_CENTER,
      zoom: 13,
    });
    mapRef.current = map;

    const geolocate = new goongjs.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showAccuracyCircle: false,
      showUserLocation: false,
    });
    geolocateRef.current = geolocate;
    map.addControl(geolocate, "top-left");

    map.on("load", () => {
      if (!map.getSource(lineSourceId)) {
        map.addSource(lineSourceId, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: lineLayerId,
          type: "line",
          source: lineSourceId,
          paint: { "line-width": 5, "line-opacity": 0.6 },
        });
      }
      if (!map.getSource(accuracySourceId)) {
        map.addSource(accuracySourceId, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: accuracyLayerId,
          type: "fill",
          source: accuracySourceId,
          paint: { "fill-opacity": 0.15 },
        });
      }
      if (!map.getSource(routeSourceId)) {
        map.addSource(routeSourceId, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: routeLayerId,
          type: "line",
          source: routeSourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-width": 6, "line-opacity": 0.95 },
        });
      }

      geolocate.on("geolocate", (e) => {
        const { latitude, longitude, accuracy } = e.coords;
        const valid = (mapStationsRef.current || []).filter(
          (s) =>
            typeof s.latitude === "number" && typeof s.longitude === "number"
        );
        if (!valid.length) {
          setUserPos([latitude, longitude]);
          setNearest(null);
          setRouteCoords(null);
          setLocating(false);
          return;
        }
        const withDistance = valid.map((s) => ({
          ...s,
          __distance: haversineMeters(
            latitude,
            longitude,
            s.latitude,
            s.longitude
          ),
        }));
        withDistance.sort((a, b) => a.__distance - b.__distance);
        const best = withDistance[0];

        setUserPos([latitude, longitude]);
        setNearest({ ...best, __accuracy: accuracy });

        getAndDrawDirections(latitude, longitude, best.latitude, best.longitude)
          .catch(() => setRouteCoords(null))
          .finally(() => setLocating(false));
      });

      geolocate.on("error", () => setLocating(false));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const getAndDrawDirections = async (olat, olng, dlat, dlng) => {
    const qs = new URLSearchParams({
      origin: `${olat},${olng}`,
      destination: `${dlat},${dlng}`,
      vehicle: "car",
      api_key: GOONG_DIRECTIONS_KEY,
    }).toString();
    const res = await fetch(`${GOONG_DIRECTIONS_URL}?${qs}`);
    const json = await res.json();
    const route = (json?.routes && json.routes[0]) || null;
    const encoded = route?.overview_polyline?.points;
    if (!encoded) {
      setRouteCoords(null);
      fitUserAndStationBounds([olng, olat], [dlng, dlat]);
      return;
    }
    const coords = decodePolyline(encoded);
    setRouteCoords(coords);
    const map = mapRef.current;
    if (map && coords.length) {
      const bounds = coords.reduce(
        (b, p) => b.extend(p),
        new goongjs.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, { padding: 80, duration: 600 });
    }
  };

  const fitUserAndStationBounds = (aLngLat, bLngLat) => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = new goongjs.LngLatBounds(aLngLat, aLngLat).extend(bLngLat);
    map.fitBounds(bounds, { padding: 80, duration: 500 });
  };

  // Thay toàn bộ hàm renderStationMarkers bằng phiên bản có nút đặt lịch trong popup
  const renderStationMarkers = () => {
    const map = mapRef.current;
    if (!map) return;

    // dọn các marker cũ
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    mapStations.forEach((st) => {
      const { latitude: lat, longitude: lng } = st || {};
      if (typeof lat !== "number" || typeof lng !== "number") return;

      // DOM icon
      const el = document.createElement("div");
      el.innerHTML = stationMarkerHtml;
      el.style.transform = "translate(-50%, -50%)";

      // HTML popup có nút Đặt lịch
      const popupHtml = `
      <div style="min-width:240px">
        <b>${st.name ?? "Trạm"}</b><br/>
        ${st.address ?? ""}<br/>
        Số pin đầy: ${
          (st?.batteries || []).filter((b) => b.status === "FULL").length
        }<br/>
        ${
          nearest?.stationId === st.stationId && nearest?.__distance != null
            ? `<span>Gần bạn nhất: ${metersToKmText(
                nearest.__distance
              )}</span><br/>`
            : ""
        }
        <div style="margin-top:8px">
          <button id="book-${st.stationId}"
                  style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:0;border-radius:6px;background:#1677ff;color:#fff;cursor:pointer;">
            <svg viewBox="64 64 896 896" focusable="false" data-icon="calendar" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M880 184H792V104a8 8 0 00-8-8h-48a8 8 0 00-8 8v80H296V104a8 8 0 00-8-8h-48a8 8 0 00-8 8v80H144c-17.7 0-32 14.3-32 32v624c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 616H184V376h656v424z"></path></svg>
            Đặt lịch tại trạm này
          </button>
        </div>
      </div>
    `;

      const popup = new goongjs.Popup({ offset: 16 }).setHTML(popupHtml);

      // bind click cho nút sau khi popup mở
      popup.on("open", () => {
        const btn = document.getElementById(`book-${st.stationId}`);
        if (btn) {
          btn.onclick = (e) => {
            e.preventDefault();
            // dùng hàm đã có sẵn để mở modal và set stationId
            openBookingForStation(st.stationId);
          };
        }
      });

      const marker = new goongjs.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    });

    // fit bounds lần đầu khi chưa có userPos/nearest
    const pts = mapStations
      .filter(
        (s) => typeof s.latitude === "number" && typeof s.longitude === "number"
      )
      .map((s) => [s.longitude, s.latitude]);

    const shouldFitStations = !userPos && !nearest;
    if (pts.length && shouldFitStations) {
      const bounds = pts.reduce(
        (b, p) => b.extend(p),
        new goongjs.LngLatBounds(pts[0], pts[0])
      );
      map.fitBounds(bounds, { padding: 60, duration: 500 });
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.isStyleLoaded()) {
      const onLoad = () => {
        renderStationMarkers();
        map.off("load", onLoad);
      };
      map.on("load", onLoad);
      return;
    }
    renderStationMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStations, nearest, userPos]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const routeSrc = map.getSource(routeSourceId);
    if (routeSrc) {
      const fc = routeCoords
        ? {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "LineString", coordinates: routeCoords },
                properties: {},
              },
            ],
          }
        : { type: "FeatureCollection", features: [] };
      routeSrc.setData(fc);
    }

    const lineSrc = map.getSource(lineSourceId);
    if (lineSrc) {
      const fc =
        !routeCoords && polylineLngLat
          ? {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: { type: "LineString", coordinates: polylineLngLat },
                  properties: {},
                },
              ],
            }
          : { type: "FeatureCollection", features: [] };
      lineSrc.setData(fc);
    }

    const accSrc = map.getSource(accuracySourceId);
    if (accSrc) {
      if (userPos && nearest?.__accuracy) {
        const [ulat, ulng] = userPos;
        const poly = circlePolygon([ulng, ulat], nearest.__accuracy);
        accSrc.setData({ type: "FeatureCollection", features: [poly] });
      } else {
        accSrc.setData({ type: "FeatureCollection", features: [] });
      }
    }

    const coordsForMid =
      routeCoords && routeCoords.length >= 2 ? routeCoords : polylineLngLat;
    if (coordsForMid && nearest?.__distance != null) {
      const mid = coordsForMid[Math.floor(coordsForMid.length / 2)];
      if (!map.__distancePopup) {
        map.__distancePopup = new goongjs.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "distance-popup",
        }).addTo(map);
      }
      map.__distancePopup
        .setLngLat(mid)
        .setHTML(metersToKmText(nearest.__distance));
    } else if (map.__distancePopup) {
      map.__distancePopup.remove();
      map.__distancePopup = null;
    }
  }, [routeCoords, polylineLngLat, nearest, userPos]);

  const handleFindNearest = () => {
    const map = mapRef.current;
    if (!map || !geolocateRef.current) return;
    setLocating(true);
    setRouteCoords(null);
    try {
      geolocateRef.current.trigger();
    } catch {
      navigator.geolocation?.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const valid = (mapStationsRef.current || []).filter(
            (s) =>
              typeof s.latitude === "number" && typeof s.longitude === "number"
          );
          if (!valid.length) {
            setUserPos([latitude, longitude]);
            setNearest(null);
            setRouteCoords(null);
            setLocating(false);
            return;
          }
          const withDistance = valid.map((s) => ({
            ...s,
            __distance: haversineMeters(
              latitude,
              longitude,
              s.latitude,
              s.longitude
            ),
          }));
          withDistance.sort((a, b) => a.__distance - b.__distance);
          const best = withDistance[0];

          setUserPos([latitude, longitude]);
          setNearest({ ...best, __accuracy: accuracy });

          await getAndDrawDirections(
            latitude,
            longitude,
            best.latitude,
            best.longitude
          );
          setLocating(false);
        },
        () => setLocating(false),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  // ==== Booking handlers ====
  const openBookingModal = () => {
    // mặc định chọn trạm gần nhất nếu đã có, nếu không chọn trạm đầu tiên
    const defaultStationId =
      nearest?.stationId ??
      initialStations?.find((s) => typeof s.stationId === "number")
        ?.stationId ??
      null;
    setBookingStationId(defaultStationId);
    setBookingTime(dayjs().add(30, "minute").second(0).millisecond(0));
    setBookingOpen(true);
  };

  // NEW: mở modal với station được chọn từ icon calendar ở cột phải
  const openBookingForStation = (stationId) => {
    setBookingStationId(stationId);
    setBookingTime(dayjs().add(30, "minute").second(0).millisecond(0));
    setBookingOpen(true);
  };

  const submitBooking = async () => {
    if (!bookingStationId || !bookingTime) {
      toast.warning("Vui lòng chọn trạm và thời gian.");
      return;
    }

    try {
      setBookingSubmitting(true);
      // Backend yêu cầu bookingTime kiểu ISO UTC
      const isoUtc = dayjs(bookingTime).utc().toISOString();

      const res = await api.post(
        `/api/booking/${bookingStationId}/bookings`,
        null,
        {
          params: { bookingTime: isoUtc },
        }
      );

      if (res.status === 200) {
        toast.success("Đặt lịch thành công!");
        setBookingOpen(false);
      } else {
        toast.error(
          "Đặt lịch thất bại, không thể đặt lịch ở trạm không có pin đầy."
        );
      }
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          "Đặt lịch thất bại, không thể đặt lịch ở trạm không có pin đầy."
      );
    } finally {
      setBookingSubmitting(false);
    }
  };

  const disablePast = (current) => {
    return current && current < dayjs().subtract(1, "minute");
  };

  return (
    <Content style={{ padding: "24px 50px" }}>
      <Row gutter={24}>
        {/* BẢN ĐỒ */}
        <Col span={16}>
          <Card bordered={false}>
            <Input
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setNearest(null);
                setUserPos(null);
                setRouteCoords(null);
              }}
              placeholder="Tìm trạm theo địa chỉ hoặc tên trạm..."
              prefix={<SearchOutlined />}
              style={{ marginBottom: 8 }}
              allowClear
            />
            {loadingMap && (
              <div
                style={{
                  color: "#1890ff",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Spin indicator={<LoadingOutlined spin />} size="small" />
                Đang tìm kiếm...
              </div>
            )}

            <Space>
              <Button
                type="primary"
                loading={locating}
                onClick={handleFindNearest}
                size="large"
                style={{
                  fontSize: 16,
                }}
              >
                <IoLocationOutline />
                {locating ? "Đang định vị..." : "Tìm trạm gần nhất"}
              </Button>
              <Button
                type="primary"
                onClick={openBookingModal}
                size="large"
                style={{
                  backgroundColor: "green",
                  fontSize: 16,
                }}
              >
                <CalendarOutlined />
                Đặt lịch đổi pin
              </Button>
            </Space>

            <div
              style={{
                height: "68vh",
                marginTop: 8,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                ref={mapContainerRef}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          </Card>
        </Col>

        {/* CỘT PHẢI */}
        <Col span={8}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card bordered={false}>
              <Row gutter={16} align="middle">
                <Col>
                  <Title level={5}>Thông tin phương tiện đã liên kết</Title>
                </Col>
              </Row>
            </Card>

            <Card
              bordered={false}
              bodyStyle={{ borderLeft: "4px solid #1890ff", paddingLeft: 20 }}
            >
              <Title level={5}>Gói đã đăng ký</Title>
            </Card>

            <Card
              bordered={false}
              bodyStyle={{ borderLeft: "4px solid #52c41a", paddingLeft: 20 }}
            >
              <Title level={5} style={{ marginBottom: 12 }}>
                Các trạm hiện tại
              </Title>
              {loadingList ? (
                <Spin />
              ) : (
                <List
                  dataSource={initialStations}
                  locale={{ emptyText: "Không có trạm" }}
                  renderItem={(st) => (
                    <List.Item
                      key={st.stationId}
                      // NEW: icon calendar đặt ở bên phải item
                      actions={[
                        <Tooltip title="Đặt lịch tại trạm này" key="calendar">
                          <Button
                            type="text"
                            icon={<CalendarOutlined />}
                            onClick={() => openBookingForStation(st.stationId)}
                          />
                        </Tooltip>,
                      ]}
                    >
                      <div style={{ width: "100%" }}>
                        <Text strong>{st.name}</Text>
                        <br />
                        <Text type="secondary">{st.address}</Text>
                        <br />
                        <Tag color={st.status === "ACTIVE" ? "green" : "red"}>
                          {st.status}
                        </Tag>
                        <Text style={{ marginLeft: 8 }}>
                          (
                          {
                            (st.batteries || []).filter(
                              (b) => b.status === "FULL"
                            ).length
                          }{" "}
                          pin đầy)
                        </Text>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      {/* MODAL ĐẶT LỊCH */}
      <Modal
        title="Đặt lịch đổi pin"
        open={bookingOpen}
        onOk={submitBooking}
        okText="Đặt lịch"
        confirmLoading={bookingSubmitting}
        onCancel={() => setBookingOpen(false)}
        destroyOnClose
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Text strong>Chọn trạm</Text>
            <Select
              style={{ width: "100%", marginTop: 6 }}
              placeholder="Chọn trạm"
              value={bookingStationId}
              onChange={setBookingStationId}
              options={initialStations.map((s) => ({
                value: s.stationId,
                label: `${s.name} — ${s.address}`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </div>

          <div>
            <Text strong>Thời gian</Text>
            <DatePicker
              style={{ width: "100%", marginTop: 6 }}
              showTime
              value={bookingTime}
              onChange={setBookingTime}
              disabledDate={disablePast}
              // để FE nhìn thấy theo local, nhưng gửi lên luôn ISO UTC:
              format="YYYY-MM-DD HH:mm"
            />
          </div>
        </Space>
      </Modal>
    </Content>
  );
};

export default FindStation;
