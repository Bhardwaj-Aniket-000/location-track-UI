import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { createSocket } from "../services/socket";
import { formatTimestamp, formatDate } from "../utils/format";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.latitude, position.longitude], 16);
    }
  }, [position, map]);
  return null;
}

export default function AdminLiveTracking() {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [linkInfo, setLinkInfo] = useState(null);

  useEffect(() => {
    const socket = createSocket();

    socket.on("connect", () => {
      socket.emit("admin:join", { trackingId });
    });

    socket.on("admin:joined", (data) => {
      setConnected(true);
      if (data.location) setLocation(data.location);
      if (data.session) setSessionInfo(data.session);
      if (data.link) setLinkInfo(data.link);
    });

    socket.on("location:updated", (data) => {
      if (data.trackingId === trackingId) {
        setLocation(data);
      }
    });

    socket.on("tracking:stopped", (data) => {
      if (data.trackingId === trackingId) {
        setSessionInfo((prev) => (prev ? { ...prev, status: "stopped" } : null));
      }
    });

    socket.on("tracking:disconnected", (data) => {
      if (data.trackingId === trackingId) {
        setSessionInfo((prev) => (prev ? { ...prev, connected: false, status: "disconnected" } : null));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [trackingId]);

  const isLive = sessionInfo?.status === "active" && sessionInfo?.connected;
  const statusColor = isLive ? "text-green-600" : location ? "text-yellow-600" : "text-gray-400";
  const statusText = isLive ? "Live" : sessionInfo?.status === "stopped" ? "Stopped" : "Waiting for user...";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/admin")}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            &larr; Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Live Location Tracking</h1>
          <p className="text-sm text-gray-500">Tracking ID: {trackingId}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}></div>
          <span className={`text-sm font-medium ${statusColor}`}>{statusText}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-[400px] md:h-[500px]">
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {location && (
              <>
                <MapUpdater position={location} />
                <Marker position={[location.latitude, location.longitude]} icon={markerIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold mb-1">📍 User Location</p>
                      <p>Latitude: {location.latitude.toFixed(4)}</p>
                      <p>Longitude: {location.longitude.toFixed(4)}</p>
                      {location.accuracy && <p>Accuracy: {Math.round(location.accuracy)} m</p>}
                      <p>Last Update: {formatTimestamp(location.timestamp)}</p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}
          </MapContainer>
        </div>
      </div>

      {location && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Location Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Tracking ID</p>
              <p className="font-mono font-semibold text-gray-800">{location.trackingId}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500" : "bg-gray-400"}`}></div>
                <span className="font-semibold text-gray-800">{isLive ? "Live" : "Disconnected"}</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Latitude</p>
              <p className="font-semibold text-gray-800">{location.latitude.toFixed(6)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Longitude</p>
              <p className="font-semibold text-gray-800">{location.longitude.toFixed(6)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Accuracy</p>
              <p className="font-semibold text-gray-800">{location.accuracy ? `${Math.round(location.accuracy)} meters` : "N/A"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Date</p>
              <p className="font-semibold text-gray-800">{formatDate(location.timestamp)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Time</p>
              <p className="font-semibold text-gray-800">{formatTimestamp(location.timestamp)}</p>
            </div>
            {linkInfo && (
              <>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Link Created At</p>
                  <p className="font-semibold text-gray-800">{formatDate(linkInfo.createdAt)} {formatTimestamp(linkInfo.createdAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Link Expiry</p>
                  <p className="font-semibold text-gray-800">{formatDate(linkInfo.expiresAt)} {formatTimestamp(linkInfo.expiresAt)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!location && connected && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
          <p className="text-gray-500">Waiting for user to share their location...</p>
          <p className="text-sm text-gray-400 mt-1">The user needs to open the tracking link and grant location permission.</p>
        </div>
      )}

      {!location && !connected && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500">Connecting to tracking server...</p>
        </div>
      )}
    </div>
  );
}
