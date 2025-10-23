// src/components/map/mapUtils.js

// --- Geo helpers ---
export const toRad = (v) => (v * Math.PI) / 180;

export const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // m
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export const metersToKmText = (m) =>
  m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;

// Vẽ polygon xấp xỉ hình tròn quanh [lng,lat]
export function circlePolygon([lng, lat], radiusMeters, points = 64) {
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
export function decodePolyline(str, precision = 5) {
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

    coordinates.push([lng / factor, lat / factor]);
  }
  return coordinates;
}
