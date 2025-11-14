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
  message,
  Tooltip,
  Badge,
  Skeleton,
  Result,
  Divider,
  Avatar,
  Rate,
} from "antd";
import {
  SearchOutlined,
  LoadingOutlined,
  CalendarOutlined,
  AimOutlined,
  InfoCircleOutlined,
  CarOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
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

// ===== NEW: Redux + Router
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/accountSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import FeedbackSummary from "../../components/feedback/FeedbackSummary";
import FeedbackDetailContent from "../../components/feedback/FeedbackDetailContent";

const { Content } = Layout;
const { Title, Text } = Typography;

// ====== CONFIG ======
const GOONG_MAPTILES_KEY = "5rWK5vcJS8dTPc40MUoG5vgaiuYY4tk2FTnoh6AK";
const GOONG_DIRECTIONS_KEY = "hz2CGz7GrqThwJGquwAnyAZrbJgsPEgjztaRd3zo";
const GOONG_DIRECTIONS_URL = "https://rsapi.goong.io/Direction";
const DEFAULT_CENTER = [106.7009, 10.7769]; // [lng, lat] HCMC

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

const chip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "#fff",
  border: "1px solid #f0f0f0",
  borderRadius: 999,
  padding: "4px 10px",
  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
};

const glassCard = {
  borderRadius: 12,
  boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
};

const toolbarCss = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  marginBottom: 8,
};

const FindStation = () => {
  // ===== Redux + Router =====
  const user = useSelector(selectUser);
  const driverId = user?.driverId ?? null; // BE trả account.user.driverId
  const navigate = useNavigate();

  // ===== Vehicle (NEW) =====
  const [vehicle, setVehicle] = useState(null);
  const [vehLoading, setVehLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [vehError, setVehError] = useState(null);

  // ===== Danh sách trạm: cột phải (không đổi) + map (đổi theo search)
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
  // state để hiển thị card thông tin phương tiện + gói đăng ký
  const [showInfoCard, setShowInfoCard] = useState(true);

  // state để hiển thị modal feedback người dùng
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackModalStation, setFeedbackModalStation] = useState(null);
  const [feedbackModalData, setFeedbackModalData] = useState([]); // lưu luôn list feedback đã load

  // --- NEW: Active plan state ---
  const [activeSub, setActiveSub] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [planError, setPlanError] = useState(null);

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

  const openBookingForStation = (stationId) => {
    setBookingStationId(stationId);
    setBookingTime(dayjs().add(30, "minute").second(0).millisecond(0));
    setBookingOpen(true);
  };

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

  // ====== NEW: Fetch my vehicle ======
  const fetchMyVehicle = async () => {
    setVehLoading(true);
    setVehError(null);
    try {
      const res = await api.get(`/api/vehicles/myVehicle`);
      setVehicle(res?.data || null);
    } catch (err) {
      setVehicle(null);
      setVehError(
        err?.response?.data?.message ||
          "Bạn chưa liên kết phương tiện với tài khoản."
      );
    } finally {
      setVehLoading(false);
    }
  };

  useEffect(() => {
    // gọi ngay khi người dùng đã đăng nhập
    fetchMyVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const renderStationMarkers = () => {
    const map = mapRef.current;
    if (!map) return;

    // dọn marker cũ
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    mapStations.forEach((st) => {
      const { latitude: lat, longitude: lng } = st || {};
      if (typeof lat !== "number" || typeof lng !== "number") return;

      // ==== Tính số pin FULL ====
      const fullCount = (st?.batteries || []).filter(
        (b) => b.status === "FULL"
      ).length;

      // ==== Xác định màu marker ====
      let color = "green";
      if (fullCount === 0) color = "red";
      else if (fullCount < 5) color = "orange";

      // ==== tạo icon ====
      const el = document.createElement("div");
      el.innerHTML = renderToString(
        <BsEvStationFill color={color} size={32} />
      );
      el.style.transform = "translate(-50%, -50%)";

      // ==== popup ====
      const popupHtml = `
      <div style="min-width:240px">
        <b>${st.name ?? "Trạm"}</b><br/>
        ${st.address ?? ""}<br/>
        Số pin đầy: ${fullCount}<br/>
        ${
          nearest?.stationId === st.stationId && nearest?.__distance != null
            ? `<span>Gần bạn nhất: ${metersToKmText(
                nearest.__distance
              )}</span><br/>`
            : ""
        }
        <div style="margin-top:8px">
          <button id="book-${st.stationId}"
                  style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:0;border-radius:8px;background:#1677ff;color:#fff;cursor:pointer;">
            <svg viewBox="64 64 896 896" focusable="false" data-icon="calendar" width="1em" height="1em" fill="currentColor" aria-hidden="true">
              <path d="M880 184H792V104a8 8 0 00-8-8h-48a8 8 0 00-8 8v80H296V104a8 8 0 00-8-8h-48a8 8 0 00-8 8v80H144c-17.7 0-32 14.3-32 32v624c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 616H184V376h656v424z"></path>
            </svg>
            Đặt lịch tại trạm này
          </button>
        </div>
      </div>
    `;

      const popup = new goongjs.Popup({ offset: 16 }).setHTML(popupHtml);
      popup.on("open", () => {
        const btn = document.getElementById(`book-${st.stationId}`);
        if (btn) {
          btn.onclick = (e) => {
            e.preventDefault();
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

    // Fit bounds
    const pts = mapStations
      .filter(
        (s) => typeof s.latitude === "number" && typeof s.longitude === "number"
      )
      .map((s) => [s.longitude, s.latitude]);

    if (pts.length && !userPos && !nearest) {
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

  // ==== Active subscription from HISTORY ====
  // ==== Active subscription from HISTORY (support response mới) ====
  const fetchActiveSubscription = async (driverId) => {
    if (!driverId) {
      setActiveSub(null);
      setActivePlan(null);
      return;
    }

    setPlanLoading(true);
    setPlanError(null);

    try {
      const res = await api.get(
        `/api/driver-subscriptions/${driverId}/history`
      );

      const rawList = Array.isArray(res.data) ? res.data : [];

      // Chuẩn hóa để hỗ trợ cả dạng cũ (có plan) và dạng mới (phẳng như em gửi)
      const list = rawList.map((item) => {
        // Nếu BE cũ: đã có item.plan thì giữ nguyên
        if (item.plan) return item;

        // BE mới: phẳng -> build object plan từ các field phẳng
        const {
          planName,
          swapLimit,
          // nếu BE có thêm các field khác thì lấy thêm ở đây
          price,
          durationDays,
          pricePerSwap,
          pricePerExtraSwap,
        } = item;

        return {
          ...item,
          plan: {
            name: planName || "Gói đăng ký",
            swapLimit: swapLimit,
            price: price,
            durationDays: durationDays,
            pricePerSwap: pricePerSwap,
            pricePerExtraSwap: pricePerExtraSwap,
          },
        };
      });

      // Ưu tiên status === "ACTIVE", sau đó tới active === true
      let found =
        list.find((s) => s.status === "ACTIVE") ||
        list.find((s) => s.active === true);

      if (!found) {
        setActiveSub(null);
        setActivePlan(null);
        setPlanError("Bạn chưa đăng ký gói đang hoạt động.");
      } else {
        setActiveSub(found);
        setActivePlan(found.plan); // vẫn dùng như cũ
      }
    } catch (err) {
      setActiveSub(null);
      setActivePlan(null);
      setPlanError(
        err?.response?.data?.message || "Không thể tải lịch sử gói."
      );
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    if (driverId) fetchActiveSubscription(driverId);
  }, [driverId]);

  // ==== Booking modal handlers ====
  const openBookingModal = () => {
    const defaultStationId =
      nearest?.stationId ??
      initialStations?.find((s) => typeof s.stationId === "number")
        ?.stationId ??
      null;
    setBookingStationId(defaultStationId);
    setBookingTime(dayjs().add(30, "minute").second(0).millisecond(0));
    setBookingOpen(true);
  };

  const submitBooking = async () => {
    if (!bookingStationId || !bookingTime) {
      message.warning("Vui lòng chọn trạm và thời gian.");
      return;
    }
    if (!driverId) {
      message.error("Thiếu driverId. Hãy đăng nhập lại tài khoản tài xế.");
      return;
    }

    try {
      setBookingSubmitting(true);
      const isoUtc = dayjs(bookingTime).utc().toISOString();
      const res = await api.post(
        `/api/booking/${bookingStationId}/bookings`,
        null,
        { params: { driverId, bookingTime: isoUtc } }
      );
      const data = res?.data;
      toast.success("Đặt lịch thành công!");
      message.success(`Đặt lịch #${data?.bookingId} lúc ${data?.bookingTime}`);
      setBookingOpen(false);
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 401) {
        message.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else {
        toast.error(
          e?.response?.data?.message || "Đặt lịch thất bại, thử lại sau."
        );
      }
    } finally {
      setBookingSubmitting(false);
    }
  };
  // chỉ được đặt từ hôm nay đến tối đa 3 ngày tới
  const disableBookingDate = (current) => {
    if (!current) return false;
    const today = dayjs().startOf("day");
    const maxDay = today.add(3, "day").endOf("day");
    // chặn ngày trước hôm nay hoặc sau 3 ngày nữa
    return current < today || current > maxDay;
  };

  // helper format VND
  const vnd = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        }).format(n)
      : "-";
  //helper format gmt +7
  const fmtVN = (iso) =>
    iso ? dayjs(iso).add(7, "hour").format("DD/MM/YYYY HH:mm") : "-";

  // ==== small UI helpers ====
  const Legend = () => (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <span style={chip}>
        <BsEvStationFill color="green" size={18} />
        <Text strong>Pin đầy: Nhiều</Text>
      </span>
      <span style={chip}>
        <BsEvStationFill color="orange" size={18} />
        <Text strong>Pin đầy: Ít</Text>
      </span>
      <span style={chip}>
        <BsEvStationFill color="red" size={18} />
        <Text strong>Hết pin đầy</Text>
      </span>
    </div>
  );

  return (
    <Content style={{ padding: "24px 50px" }}>
      <Row gutter={[24, 24]}>
        {/* BẢN ĐỒ */}
        <Col xl={16} lg={24} xs={24}>
          <Card bordered={false} style={glassCard} bodyStyle={{ padding: 16 }}>
            {/* Toolbar */}
            <div style={toolbarCss}>
              <Input
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value);
                  setNearest(null);
                  setUserPos(null);
                  setRouteCoords(null);
                }}
                placeholder="Tìm trạm theo địa chỉ hoặc tên trạm…"
                prefix={<SearchOutlined />}
                allowClear
                size="large"
                style={{ flex: 1, minWidth: 260 }}
              />

              <Space wrap>
                <Tooltip title="Xác định vị trí hiện tại & tìm trạm gần nhất">
                  <Button
                    type="primary"
                    icon={<AimOutlined />}
                    loading={locating}
                    size="large"
                    onClick={handleFindNearest}
                  >
                    {locating ? "Đang định vị…" : "Trạm gần nhất"}
                  </Button>
                </Tooltip>
                {user && (
                  <Tooltip title="Mở hộp thoại đặt lịch nhanh">
                    <Button
                      icon={<CalendarOutlined />}
                      size="large"
                      onClick={openBookingModal}
                      style={{ background: "#24a148", color: "#fff" }}
                    >
                      Đặt lịch đổi pin
                    </Button>
                  </Tooltip>
                )}
              </Space>
            </div>

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
                Đang tìm kiếm…
              </div>
            )}

            {/* Map container */}
            <div
              style={{
                position: "relative",
                height: "68vh",
                borderRadius: 12,
                overflow: "hidden",
                background:
                  "linear-gradient(180deg, rgba(240,249,255,0.8), rgba(255,255,255,0.8))",
              }}
            >
              <div
                ref={mapContainerRef}
                style={{ height: "100%", width: "100%" }}
              />

              {/* Floating action buttons */}
              <div
                style={{
                  position: "absolute",
                  right: 12,
                  bottom: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <Tooltip title="Trạm gần nhất">
                  <Button
                    shape="circle"
                    type="primary"
                    size="large"
                    icon={<AimOutlined />}
                    onClick={handleFindNearest}
                    loading={locating}
                  />
                </Tooltip>
                <Tooltip title="Đặt lịch">
                  <Button
                    shape="circle"
                    size="large"
                    icon={<CalendarOutlined />}
                    onClick={openBookingModal}
                    style={{
                      background: "#24a148",
                      color: "#fff",
                      border: "none",
                    }}
                  />
                </Tooltip>
              </div>
            </div>

            {/* Legend */}
            <div
              style={{
                marginTop: 12,
                background: "#fafafa",
                border: "1px dashed #f0f0f0",
                borderRadius: 12,
                padding: "12px 16px",
              }}
            >
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Legend />
                <Tooltip title="Màu marker dựa vào số pin FULL của trạm">
                  <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
                </Tooltip>
              </Space>
            </div>
          </Card>
        </Col>

        {/* CỘT PHẢI */}
        <Col xl={8} lg={24} xs={24}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* THÔNG TIN + GÓI ĐÃ ĐĂNG KÝ (GỘP) */}
            {user && (
              <Card
                bordered={false}
                style={glassCard}
                bodyStyle={{ padding: 16 }}
              >
                {/* Header có nút ẩn/hiện */}
                <Row
                  align="middle"
                  justify="space-between"
                  style={{ marginBottom: 8 }}
                >
                  <Col>
                    <Title level={5} style={{ margin: 0 }}>
                      Tài khoản & dịch vụ
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Phương tiện đã liên kết và gói đăng ký
                    </Text>
                  </Col>
                  <Col>
                    <Button
                      type="text"
                      icon={
                        showInfoCard ? (
                          <EyeInvisibleOutlined />
                        ) : (
                          <EyeOutlined />
                        )
                      }
                      onClick={() => setShowInfoCard((prev) => !prev)}
                    >
                      {showInfoCard ? "Ẩn" : "Hiện"}
                    </Button>
                  </Col>
                </Row>

                {showInfoCard && (
                  <Space
                    direction="vertical"
                    size="large"
                    style={{ width: "100%" }}
                  >
                    {/* ========== PHƯƠNG TIỆN ========== */}
                    <div>
                      <Row
                        align="middle"
                        justify="space-between"
                        style={{ marginBottom: 8 }}
                      >
                        <Col>
                          <Text strong>Thông tin phương tiện đã liên kết</Text>
                        </Col>
                        <Col>
                          <Badge color="blue" text="Xe điện" />
                        </Col>
                      </Row>

                      {vehLoading ? (
                        <Skeleton active paragraph={{ rows: 2 }} />
                      ) : vehicle ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "auto 1fr",
                            gap: 12,
                          }}
                        >
                          <Avatar
                            shape="square"
                            size={90}
                            src={vehicle.imageUrl}
                            icon={<CarOutlined />}
                            style={{
                              borderRadius: 16,
                              backgroundColor: "#fff",
                              boxShadow: "0 0 6px rgba(0,0,0,0.1)",
                            }}
                          />

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 10,
                            }}
                          >
                            <div>
                              <Text type="secondary">Biển số xe</Text>
                              <div>{vehicle.vin || "-"}</div>
                            </div>
                            <div>
                              <Text type="secondary">Loại pin</Text>
                              <div>{vehicle.batteryType || "-"}</div>
                            </div>
                            <div>
                              <Text type="secondary">Model</Text>
                              <div>{vehicle.model || "-"}</div>
                            </div>
                            <div>
                              <Text type="secondary">Hãng</Text>
                              <div>{vehicle.manufacturer || "-"}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: 8 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            Bạn chưa liên kết phương tiện
                          </div>
                          <div style={{ color: "#595959", marginBottom: 12 }}>
                            Hãy liên kết phương tiện để sử dụng dịch vụ.
                          </div>
                          <Button
                            type="primary"
                            onClick={() => navigate("/account")}
                          >
                            Liên kết ngay
                          </Button>
                        </div>
                      )}
                    </div>

                    <Divider style={{ margin: "0px 0" }} />

                    {/* ========== GÓI ĐÃ ĐĂNG KÝ ========== */}
                    <div>
                      <Text strong>Gói đã đăng ký</Text>
                      {planLoading ? (
                        <Skeleton active paragraph={{ rows: 3 }} />
                      ) : activePlan && activeSub ? (
                        <div style={{ marginTop: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <Title level={4} style={{ margin: 0 }}>
                              {activePlan.name}
                            </Title>
                            <Tag color={activeSub.active ? "green" : "red"}>
                              {activeSub.active
                                ? "Đang hoạt động"
                                : activeSub.status || "Hết hiệu lực"}
                            </Tag>
                          </div>

                          <Divider style={{ margin: "12px 0" }} />

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 10,
                            }}
                          >
                            {/* <div>
                              <Text type="secondary">Giá gói</Text>
                              <div>{vnd(activePlan.price)}</div>
                            </div>
                            <div>
                              <Text type="secondary">Thời hạn</Text>
                              <div>{activePlan.durationDays ?? "-"} ngày</div>
                            </div> */}
                            <div>
                              <Text type="secondary">Ngày bắt đầu</Text>
                              <div>{fmtVN(activeSub.startDate)}</div>
                            </div>
                            <div>
                              <Text type="secondary">Ngày kết thúc</Text>
                              <div>{fmtVN(activeSub.endDate)}</div>
                            </div>
                            <div>
                              <Text type="secondary">Số lượt đổi</Text>
                              <div>{activePlan.swapLimit ?? "-"}</div>
                            </div>
                            <div>
                              <Text type="secondary">Đã sử dụng</Text>
                              <div>{activeSub.swapsUsed ?? 0}</div>
                            </div>
                            <div>
                              <Text type="secondary">Giá mỗi lần đổi</Text>
                              <div>{vnd(0)}</div>
                            </div>
                            <div>
                              <Text type="secondary">Giá cho lượt vượt</Text>
                              <div>{vnd(20000)}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: "left", paddingTop: 8 }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>
                            Bạn chưa đăng ký gói nào
                          </div>
                          <Button
                            type="primary"
                            onClick={() => navigate("/plans")}
                          >
                            Đăng ký ngay
                          </Button>
                        </div>
                      )}
                    </div>
                  </Space>
                )}
              </Card>
            )}
            {/* DANH SÁCH TRẠM */}
            <Card
              bordered={false}
              style={glassCard}
              bodyStyle={{ padding: 16 }}
            >
              <Title level={5} style={{ marginBottom: 12 }}>
                Các trạm hiện tại
              </Title>

              {loadingList ? (
                <>
                  <Skeleton active avatar paragraph={{ rows: 1 }} />
                  <Skeleton active avatar paragraph={{ rows: 1 }} />
                  <Skeleton active avatar paragraph={{ rows: 1 }} />
                </>
              ) : (
                <List
                  dataSource={initialStations}
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
                              onClick={() =>
                                openBookingForStation(st.stationId)
                              }
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
                              <Tag
                                color={st.status === "ACTIVE" ? "green" : "red"}
                              >
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
                                  onClick={({ feedbacks }) => {
                                    setFeedbackModalStation(st);
                                    setFeedbackModalData(feedbacks); // lưu luôn list feedback
                                    setFeedbackModalOpen(true);
                                  }}
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
              disabledDate={disableBookingDate}
              format="YYYY-MM-DD HH:mm"
            />
          </div>
        </Space>
      </Modal>
      {/* modal đánh giá trạm */}
      <Modal
        title="Đánh giá trạm"
        open={feedbackModalOpen}
        onCancel={() => setFeedbackModalOpen(false)}
        footer={null}
        width={650}
        destroyOnClose
      >
        <FeedbackDetailContent
          station={feedbackModalStation}
          feedbacks={feedbackModalData}
        />
      </Modal>
    </Content>
  );
};

export default FindStation;
