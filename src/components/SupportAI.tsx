"use client";

import { useState, useRef, useEffect } from "react";

const FAQ_DATA = [
  { q: "How do I get paid?", a: "Payouts are processed via Stripe Connect. You can request a payout from your dashboard once your balance exceeds $20. Funds typically arrive in 3-5 business days." },
  { q: "What is stem separation?", a: "Our AI-powered stem separation tool allows you to split any beat into 4 individual tracks: Drums, Bass, Melody, and Other. This is great for offering exclusive content to your buyers." },
  { q: "How do licenses work?", a: "We offer three main types: Basic (MP3), Premium (WAV + Stems), and Exclusive (Full Ownership). You can customize the terms for each beat in the producer dashboard." },
  { q: "Can I sell merch?", a: "Yes! WAVR integrates with print-on-demand services. You just upload your design, and we handle the printing, shipping, and fulfillment automatically." },
];

type Message =
  | { role: "user" | "ai"; content: string; ticketPrompt?: false }
  | { role: "ai"; content: string; ticketPrompt: true };

export default function SupportAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hi! I'm WAVR Assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketFormId, setTicketFormId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, ticketFormId]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let aiContent = "";
      let ticketPrompt = false;

      if (lower.includes("paid") || lower.includes("money") || lower.includes("payout")) {
        aiContent = FAQ_DATA[0].a;
      } else if (lower.includes("stem") || lower.includes("split")) {
        aiContent = FAQ_DATA[1].a;
      } else if (lower.includes("license") || lower.includes("ownership")) {
        aiContent = FAQ_DATA[2].a;
      } else if (lower.includes("merch") || lower.includes("shirt") || lower.includes("shop")) {
        aiContent = FAQ_DATA[3].a;
      } else if (lower.includes("hello") || lower.includes("hi")) {
        aiContent = "Hello! I can help you with questions about payments, licensing, stems, or merch. What's on your mind?";
      } else {
        aiContent = "I couldn't find a specific answer for that. Would you like to open a support ticket so our team can help you?";
        ticketPrompt = true;
      }

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: aiContent, ticketPrompt } as Message,
      ]);
      if (ticketPrompt) setTicketFormId(Date.now());
      setIsTyping(false);
    }, 1000);
  };

  const submitTicket = async () => {
    const subject = ticketSubject.trim() || "Support request from chat";
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    setTicketSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message: lastUserMsg, priority: "medium" }),
      });
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "Your ticket has been submitted! Our support team will get back to you via email." },
        ]);
      } else if (res.status === 401) {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "You need to be logged in to open a support ticket. Please sign in and try again." },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "Something went wrong submitting your ticket. Please try again or email us directly." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Something went wrong. Please try again later." },
      ]);
    } finally {
      setTicketSubmitting(false);
      setTicketFormId(null);
      setTicketSubject("");
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-full shadow-2xl shadow-blue-900/20 flex items-center justify-center text-white z-50 hover:scale-110 transition-transform active:scale-95"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] sm:w-[400px] h-[520px] bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs italic">W</div>
              <div>
                <h3 className="font-bold text-sm">WAVR Assistant</h3>
                <p className="text-[10px] text-white/70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  m.role === "user"
                    ? "bg-blue-700 text-white rounded-tr-none"
                    : "bg-gray-800 text-gray-300 rounded-tl-none border border-gray-700"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* Inline ticket form */}
            {ticketFormId !== null && (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-none p-3 space-y-2">
                <p className="text-xs text-gray-400">Enter a subject for your ticket (optional):</p>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Issue with upload"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={submitTicket}
                    disabled={ticketSubmitting}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    {ticketSubmitting ? "Submitting…" : "Submit Ticket"}
                  </button>
                  <button
                    onClick={() => { setTicketFormId(null); setTicketSubject(""); }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 p-3 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-gray-900 border-t border-gray-800">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask a question..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:border-blue-600"
              />
              <button
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-700 text-white rounded-lg flex items-center justify-center hover:bg-blue-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-600 text-center mt-3">Powered by WAVR AI Support</p>
          </div>
        </div>
      )}
    </>
  );
}
