import { API_URL } from "../config";

const API_BASE = `${API_URL}/api`;

let adminKey = localStorage.getItem("adminKey") || "";

export function setAdminKey(key) {
  adminKey = key;
  localStorage.setItem("adminKey", key);
}

export function getAdminKey() {
  return adminKey;
}

async function adminFetch(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function createTrackingLink(name, expiryMinutes) {
  return adminFetch("/admin/tracking-links", {
    method: "POST",
    body: JSON.stringify({ name, expiryMinutes }),
  });
}

export async function listTrackingLinks() {
  return adminFetch("/admin/tracking-links");
}

export async function deactivateTrackingLink(id) {
  return adminFetch(`/admin/tracking-links/${id}/deactivate`, {
    method: "POST",
  });
}

export async function validateToken(token) {
  const res = await fetch(`${API_BASE}/tracking/${token}`);
  return res.json();
}
