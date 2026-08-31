import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { getAdminKey, setAdminKey } from "../services/api";

export default function AdminLayout() {
  const [authenticated, setAuthenticated] = useState(!!getAdminKey());
  const [keyInput, setKeyInput] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    if (!authenticated) setShowKeyModal(true);
  }, [authenticated]);

  function handleLogin(e) {
    e.preventDefault();
    setAdminKey(keyInput);
    setAuthenticated(true);
    setShowKeyModal(false);
  }

  if (!authenticated || showKeyModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Admin Access</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your admin key to continue.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Admin Key"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-800">Location Tracker</span>
          </div>
          <div className="flex items-center gap-1">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              Dashboard
            </NavLink>
            <button
              onClick={() => {
                setAdminKey("");
                setAuthenticated(false);
                setShowKeyModal(true);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
