"use client";

import { useState, useRef, useEffect } from "react";

const FAQ_DATA = [
  { q: "How do I get paid?", a: "Payouts are processed via Stripe Connect. You can request a payout from your dashboard once your balance exceeds $20. Funds typically arrive in 3-5 business days." },
  { q: "What is stem separation?", a: "Our AI-powered stem separation tool allows you to split any beat into 4 individual tracks: Drums, Bass, Melody, and Other. This is great for offering exclusive content to your buyers." },
  { q: "How do licenses work?", a: "We offer three main types: Basic (MP3), Premium (WAV + Stems), and Exclusive (Full Ownership). You can customize the terms for each beat in the producer dashboard." },
  { q: "Can I sell merch?", a: "Yes! WAVR integrates with print-on-demand services. You just upload your design, and we handle the printing, shipping, and fulfillment automatically." },
];

export default function SupportAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Hi! I'm WAVR Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let aiContent = "I'm sorry, I couldn't find a specific answer for that. Would you like to open a support ticket or talk to a human?";
      
      const lowerMsg = userMsg.toLowerCase();
      const match = FAQ_DATA.find(f => lowerMsg.includes(f.q.toLowerCase().split(' ').slice(-2).join(' ')));
      
      if (lowerMsg.includes("paid") || lowerMsg.includes("money") || lowerMsg.includes("payout")) {
        aiContent = FAQ_DATA[0].a;
      } else if (lowerMsg.includes("stem") || lowerMsg.includes("split")) {
        aiContent = FAQ_DATA[1].a;
      } else if (lowerMsg.includes("license") || lowerMsg.includes("ownership")) {
        aiContent = FAQ_DATA[2].a;
      } else if (lowerMsg.includes("merch") || lowerMsg.includes("shirt") || lowerMsg.includes("shop")) {
        aiContent = FAQ_DATA[3].a;
      } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
        aiContent = "Hello! I can help you with questions about payments, licensing, stems, or merch. What's on your mind?";
      }

      setMessages(prev => [...prev, { role: "ai", content: aiContent }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-purple-600 to-fuchsia-600 rounded-full shadow-2xl shadow-purple-900/40 flex items-center justify-center text-white z-50 hover:scale-110 transition-transform active:scale-95"
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
        <div className="fixed bottom-24 right-6 w-[350px] sm:w-[400px] h-[500px] bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 p-4 text-white">
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
                    ? "bg-purple-600 text-white rounded-tr-none" 
                    : "bg-gray-800 text-gray-300 rounded-tl-none border border-gray-700"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 p-3 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
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
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center hover:bg-purple-500"
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
