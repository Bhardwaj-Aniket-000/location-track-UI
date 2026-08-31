import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLiveTracking from "./pages/AdminLiveTracking";
import TrackUser from "./pages/TrackUser";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/track/:token" element={<TrackUser />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="live/:trackingId" element={<AdminLiveTracking />} />
      </Route>
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-gray-500">Page not found</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
