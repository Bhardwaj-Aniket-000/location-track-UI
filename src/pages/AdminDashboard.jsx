import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createTrackingLink, listTrackingLinks, deactivateTrackingLink } from "../services/api";
import { formatDate, formatTimestamp, copyToClipboard } from "../utils/format";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState(null);
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState(30);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadLinks = async () => {
    try {
      setLoading(true);
      const data = await listTrackingLinks();
      setLinks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
    const interval = setInterval(loadLinks, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const result = await createTrackingLink(name, expiry);
      setNewLink(result);
      setName("");
      setExpiry(30);
      loadLinks();
      showToast("Tracking link created successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (token) => {
    try {
      await deactivateTrackingLink(token);
      loadLinks();
      showToast("Link deactivated.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopy = (link) => {
    copyToClipboard(link);
    showToast("Link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium animate-pulse">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create and manage temporary tracking links. In-memory MVP — data resets on server restart.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Tracking Link</h2>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tracking Name"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <select
            value={expiry}
            onChange={(e) => setExpiry(Number(e.target.value))}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm whitespace-nowrap"
          >
            {creating ? "Generating..." : "Generate Link"}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {newLink && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">Tracking Link Created</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm text-gray-700 bg-white px-3 py-2 rounded-lg border flex-1 overflow-x-auto">
                {newLink.link}
              </code>
              <button
                onClick={() => handleCopy(newLink.link)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
              >
                Copy
              </button>
              <button
                onClick={() => navigate(`/admin/live/${newLink.trackingId}`)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition whitespace-nowrap"
              >
                View Live
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Active Links</h2>
          <button
            onClick={loadLinks}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh
          </button>
        </div>

        {loading && links.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : links.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No tracking links yet. Create one above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Tracking ID</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium">Expires</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const expired = Date.now() > link.expiresAt;
                  const statusColor =
                    link.status === "active" && !expired
                      ? "bg-green-100 text-green-700"
                      : expired
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700";
                  const statusText =
                    link.status === "active" && !expired
                      ? "Active"
                      : expired
                      ? "Expired"
                      : "Deactivated";

                  return (
                    <tr key={link.token} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-800">{link.name}</td>
                      <td className="px-6 py-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{link.trackingId}</code>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {formatDate(link.createdAt)} {formatTimestamp(link.createdAt)}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {formatDate(link.expiresAt)} {formatTimestamp(link.expiresAt)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/track/${link.token}`;
                              handleCopy(url);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => {
                              window.open(`${window.location.origin}/track/${link.token}`, "_blank");
                            }}
                            className="text-gray-600 hover:text-gray-700 text-xs font-medium"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => navigate(`/admin/live/${link.trackingId}`)}
                            className="text-green-600 hover:text-green-700 text-xs font-medium"
                          >
                            View Live
                          </button>
                          {link.status === "active" && !expired && (
                            <button
                              onClick={() => handleDeactivate(link.token)}
                              className="text-red-600 hover:text-red-700 text-xs font-medium"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
