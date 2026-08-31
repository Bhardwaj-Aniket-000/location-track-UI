import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { validateToken } from "../services/api";
import { createSocket } from "../services/socket";
import { useGeolocation } from "../hooks/useGeolocation";
import { formatTimestamp } from "../utils/format";

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

export default function TrackUser() {
  const { token } = useParams();
  const [tokenStatus, setTokenStatus] = useState("loading");
  const [tokenInfo, setTokenInfo] = useState(null);
  const { position, error: geoError, status: geoStatus, startWatching, stopWatching } = useGeolocation();
  const [joined, setJoined] = useState(false);
  const socketRef = useRef(null);
  const lastSentRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function validate() {
      try {
        const data = await validateToken(token);
        if (!cancelled) {
          if (data.valid) {
            setTokenStatus("valid");
            setTokenInfo(data);
          } else {
            setTokenStatus("invalid");
          }
        }
      } catch {
        if (!cancelled) setTokenStatus("invalid");
      }
    }
    validate();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (tokenStatus !== "valid") return;

    const socket = createSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("tracking:join", { token });
    });

    socket.on("tracking:joined", () => {
      console.log("Tracking joined");
      setJoined(true);
    });

    socket.on("tracking:error", (data) => {
      console.error("Tracking error:", data.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tokenStatus, token]);

  function pushLocation() {
    const socket = socketRef.current;
    if (!socket || !position || !joined) return;
    if (!socket.connected) return;
    const key = `${position.latitude},${position.longitude},${position.timestamp}`;
    if (lastSentRef.current === key) return;
    lastSentRef.current = key;
    socket.emit("location:update", {
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      timestamp: position.timestamp,
    });
  }

  useEffect(() => {
    pushLocation();
  }, [position, joined]);

  const handleStart = useCallback(() => {
    startWatching();
  }, [startWatching]);

  const handleStop = useCallback(() => {
    stopWatching();
    if (socketRef.current) {
      socketRef.current.emit("tracking:stop");
    }
  }, [stopWatching]);

  if (tokenStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Validating tracking link...</p>
        </div>
      </div>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Link Invalid or Expired</h2>
          <p className="text-gray-500 text-sm">This tracking link has expired, been deactivated, or is invalid. Please request a new link from the admin.</p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    idle: { color: "bg-gray-400", text: "Ready", textColor: "text-gray-500" },
    requesting: { color: "bg-yellow-400 animate-pulse", text: "Requesting permission...", textColor: "text-yellow-600" },
    active: { color: "bg-green-500", text: "Location sharing active", textColor: "text-green-600" },
    denied: { color: "bg-red-500", text: "Permission denied", textColor: "text-red-600" },
    unavailable: { color: "bg-orange-500", text: "Location unavailable", textColor: "text-orange-600" },
    error: { color: "bg-red-500", text: "Error", textColor: "text-red-600" },
    stopped: { color: "bg-gray-400", text: "Location sharing stopped", textColor: "text-gray-500" },
  };

  const currentStatus = statusConfig[geoStatus] || statusConfig.idle;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-800">Location Sharing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentStatus.color}`}></div>
            <span className={`text-sm font-medium ${currentStatus.textColor}`}>{currentStatus.text}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">
            Tracking: <span className="font-semibold">{tokenInfo?.name}</span>
          </p>
        </div>

        {geoStatus === "idle" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Location Permission Required</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              To show your current position on the map and share it with the authorized admin, please allow location access.
            </p>
            <button
              onClick={handleStart}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition text-sm"
            >
              Enable Location
            </button>
          </div>
        )}

        {geoStatus === "requesting" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Waiting for location permission...</p>
            <p className="text-sm text-gray-400 mt-1">Please allow location access in the browser dialog.</p>
          </div>
        )}

        {(geoStatus === "denied" || geoStatus === "unavailable" || geoStatus === "error") && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-2">
              {geoStatus === "denied" && "Location permission was denied."}
              {geoStatus === "unavailable" && "Unable to determine your location."}
              {geoStatus === "error" && "An error occurred."}
            </p>
            <p className="text-sm text-gray-500 mb-4">{geoError}</p>
            {(geoStatus === "unavailable" || geoStatus === "error") && (
              <button
                onClick={handleStart}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition text-sm"
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {geoStatus === "stopped" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Location Sharing Stopped</h2>
            <p className="text-gray-500 text-sm mb-4">Your location is no longer being shared.</p>
            <button
              onClick={handleStart}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition text-sm"
            >
              Restart Sharing
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-[300px] md:h-[400px]">
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
              {position && (
                <>
                  <MapUpdater position={position} />
                  <Marker position={[position.latitude, position.longitude]} icon={markerIcon}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">Your Location</p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>
          </div>
        </div>

        {position && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Your Current Location</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Latitude</p>
                <p className="font-mono font-semibold text-gray-800">{position.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Longitude</p>
                <p className="font-mono font-semibold text-gray-800">{position.longitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Accuracy</p>
                <p className="font-semibold text-gray-800">{Math.round(position.accuracy)} m</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Last Updated</p>
                <p className="font-semibold text-gray-800">{formatTimestamp(position.timestamp)}</p>
              </div>
            </div>
          </div>
        )}

        {geoStatus === "active" && (
          <button
            onClick={handleStop}
            className="w-full bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-medium hover:bg-red-100 transition text-sm"
          >
            Stop Sharing Location
          </button>
        )}

        <p className="text-xs text-center text-gray-400 pb-4">
          Your location is only shared with the authorized admin. No other data is collected.
        </p>
      </div>
    </div>
  );
}
