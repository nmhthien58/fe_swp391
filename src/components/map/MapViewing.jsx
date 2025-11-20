// src/components/map/StationMap.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, Input, Button, Space, Tooltip, Typography, Spin } from "antd";
import {
  SearchOutlined,
  LoadingOutlined,
  CalendarOutlined,
  AimOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { BsEvStationFill } from "react-icons/bs";
import { renderToString } from "react-dom/server";

import goongjs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";

import api from "../../config/axios";
import { haversineMeters, metersToKmText } from "./mapUtils";

const { Text } = Typography;

// ====== CONFIG ======
const GOONG_MAPTILES_KEY = "5rWK5vcJS8dTPc40MUoG5vgaiuYY4tk2FTnoh6AK";
const GOONG_DIRECTIONS_KEY = "hz2CGz7GrqThwJGquwAnyAZrbJgsPEgjztaRd3zo";
const GOONG_DIRECTIONS_URL = "https://rsapi.goong.io/Direction";
const DEFAULT_CENTER = [106.7009, 10.7769]; // [lng, lat] HCMC

// Vẽ polygon tròn quanh user (độ chính xác GPS)
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

// Giải mã polyline => [lng, lat][]
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

const MapViewing = ({ onBookStation }) => {
  const [stations, setStations] = useState([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [typed, setTyped] = useState(" ");

  const [locating, setLocating] = useState(false);
  const [userPos, setUserPos] = useState(null); // [lat, lng]
  const [nearest, setNearest] = useState(null); // { ...station, __distance, __accuracy }
  const [routeCoords, setRouteCoords] = useState(null);

  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const geolocateRef = useRef(null);
  const stationsRef = useRef([]);

  const lineSourceId = "nearest-line";
  const lineLayerId = "nearest-line-layer";
  const accuracySourceId = "user-accuracy";
  const accuracyLayerId = "user-accuracy-layer";
  const routeSourceId = "goong-route";
  const routeLayerId = "goong-route-layer";

  // đồng bộ stations vào ref cho geolocate dùng
  useEffect(() => {
    stationsRef.current = stations;
  }, [stations]);

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

  // Fetch danh sách trạm cho map
  const fetchStations = async (kw) => {
    setLoadingMap(true);
    try {
      const res = await api.get(`/api/stations/search`, {
        params: { keyword: kw },
      });
      setStations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Lỗi tải trạm cho map:", e);
      setStations([]);
    } finally {
      setLoadingMap(false);
    }
  };

  useEffect(() => {
    fetchStations(" ");
  }, []);

  // debounce tìm kiếm
  useEffect(() => {
    const t = setTimeout(() => {
      const kw = typed.trim() === "" ? " " : typed;
      fetchStations(kw);
    }, 500);
    return () => clearTimeout(t);
  }, [typed]);

  // Khởi tạo map Goong
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
        const valid = (stationsRef.current || []).filter(
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

    stations.forEach((st) => {
      const { latitude: lat, longitude: lng } = st || {};
      if (typeof lat !== "number" || typeof lng !== "number") return;

      // tính số pin FULL
      const fullCount = (st?.batteries || []).filter(
        (b) => b.status === "FULL"
      ).length;

      let color = "green";
      if (fullCount === 0) color = "red";
      else if (fullCount < 5) color = "orange";

      const el = document.createElement("div");
      el.innerHTML = renderToString(
        <BsEvStationFill color={color} size={32} />
      );
      el.style.transform = "translate(-50%, -50%)";

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
            onBookStation?.(st.stationId);
          };
        }
      });

      const marker = new goongjs.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    });

    const pts = stations
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
  }, [stations, nearest, userPos]);

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
          const valid = (stationsRef.current || []).filter(
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
    <Card bordered={false} style={glassCard} bodyStyle={{ padding: 16 }}>
      {/* Toolbar (search + nearest + đặt lịch nhanh) */}
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
        <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

        {/* Floating buttons */}
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
          {onBookStation && (
            <Tooltip title="Đặt lịch (chọn trạm trong popup)">
              <Button
                shape="circle"
                size="large"
                icon={<CalendarOutlined />}
                style={{
                  background: "#24a148",
                  color: "#fff",
                  border: "none",
                }}
                onClick={() => {
                  // gợi ý: nếu muốn mở modal đặt lịch chung
                  // bạn có thể gọi onBookStation với station gần nhất:
                  if (nearest?.stationId) {
                    onBookStation(nearest.stationId);
                  }
                }}
              />
            </Tooltip>
          )}
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
  );
};

export default MapViewing;
