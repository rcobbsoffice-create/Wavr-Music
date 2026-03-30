"use client";

import { useState, useEffect } from "react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  response: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "text-yellow-400 bg-yellow-900/20 border-yellow-800/30",
  in_progress: "text-blue-400 bg-blue-900/20 border-blue-800/30",
  resolved: "text-green-400 bg-green-900/20 border-green-800/30",
  closed: "text-gray-400 bg-gray-800 border-gray-700",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/support")
      .then((r) => r.json())
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit ticket"); return; }
      setTickets((prev) => [data, ...prev]);
      setSubject(""); setMessage(""); setPriority("medium");
      setShowForm(false);
      setSuccess("Ticket submitted! We'll get back to you within 24 hours.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gradient-to-r from-purple-900/30 via-gray-900 to-gray-900 border-b border-gray-800 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-black text-white mb-2">Support</h1>
          <p className="text-gray-400">Get help from our team. We typically respond within 24 hours.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {success && (
          <div className="bg-green-900/20 border border-green-800/30 text-green-400 rounded-xl px-5 py-3 text-sm">
            {success}
          </div>
        )}

        {/* New ticket button / form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold px-6 py-3 rounded-xl"
          >
            + Open New Ticket
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-bold text-lg">New Support Ticket</h2>
            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                maxLength={200}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="Brief description of your issue"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                placeholder="Describe your issue in detail..."
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm"
              >
                {submitting ? "Submitting…" : "Submit Ticket"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="text-gray-400 hover:text-white text-sm px-4 py-2.5"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Ticket list */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4">Your Tickets</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <div key={i} className="h-24 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
              <p className="text-gray-500">No tickets yet. Open one above if you need help.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold text-sm">{ticket.subject}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${STATUS_COLORS[ticket.status] ?? STATUS_COLORS.open}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{ticket.message}</p>
                  {ticket.response && (
                    <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-3 mt-3">
                      <p className="text-purple-300 text-xs font-semibold mb-1">Support Response</p>
                      <p className="text-gray-300 text-sm">{ticket.response}</p>
                    </div>
                  )}
                  <p className="text-gray-600 text-xs mt-3">
                    {new Date(ticket.createdAt).toLocaleDateString()} · Priority: {ticket.priority}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
