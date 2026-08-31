import { useState, useEffect, useRef, useCallback } from "react";

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle");
  const watchIdRef = useRef(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setStatus("error");
      return;
    }

    setStatus("requesting");

    const options = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setStatus("active");
        setError(null);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError(
              "Location permission was denied. Please enable location permission in your browser settings if you want to share your location."
            );
            setStatus("denied");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Unable to determine your location. Please try again.");
            setStatus("unavailable");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.");
            setStatus("error");
            break;
          default:
            setError("An unknown error occurred.");
            setStatus("error");
        }
      },
      options
    );
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus("stopped");
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { position, error, status, startWatching, stopWatching };
}
