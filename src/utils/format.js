export function formatTimestamp(ts) {
  if (!ts) return "N/A";
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

export function formatDate(ts) {
  if (!ts) return "N/A";
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatCoords(lat, lng) {
  if (lat == null || lng == null) return "N/A";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}
