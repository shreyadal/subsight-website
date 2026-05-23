"use client";

import { useState, useRef, useEffect } from "react";
import { AIDot, Icon } from "@/components/primitives";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "ai";
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: "ai",
    text: "Hey Aanya! I've analysed your 15 subscriptions. You're spending ₹12,847/mo on recurring services. I found 6 opportunities to save up to ₹6,748/mo. What would you like to explore?",
  },
];

const SUGGESTIONS = [
  "Which subscriptions can I cancel?",
  "Am I paying for anything twice?",
  "What trials are about to charge me?",
  "How does my spend compare to last month?",
];

const RESPONSES: Record<string, string> = {
  "Which subscriptions can I cancel?":
    "Based on your usage patterns I'd look at: Canva Pro Workspace #2 (₹499/mo — you already have a personal workspace), Hotstar (₹299/mo — paused 3 weeks, likely unused), and iCloud 50GB (₹75/mo — you're at 18% capacity). Cancelling those three saves ₹873/mo.",
  "Am I paying for anything twice?":
    "Yes — two Canva workspaces: personal + a team workspace from a previous job. That's ₹499/mo duplicate. I'd also flag that GitHub Copilot Business (₹1,670/mo) and Cursor AI (₹1,670/mo) overlap heavily. Worth picking one.",
  "What trials are about to charge me?":
    "Three trials are converting soon: Midjourney in 2 days (₹830/mo), Linear in 6 days (₹680/mo), and Notion AI in 9 days (₹830/mo). Want me to set a reminder or show you how to pause them?",
  "How does my spend compare to last month?":
    "You spent ₹12,847 this month vs ₹11,926 last month — up ₹921. Almost all of it is Adobe's price hike (₹420 more) and GitHub Copilot Business being picked up as a new charge (₹1,670).",
};

function fallback() {
  return "That's a good question. Looking at your subscription data — you're running several overlapping AI tools. I'd recommend reviewing your AI stack first; it's your fastest path to savings. Want a breakdown?";
}

export function AIChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function send(text: string) {
    if (!text.trim() || thinking) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    const reply = RESPONSES[text] ?? fallback();
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: reply }]);
      setThinking(false);
    }, 1100);
  }

  const showSuggestions = messages.length <= 1;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-bg/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-40 w-full max-w-[420px] bg-bg-card flex flex-col shadow-pop transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-5 h-14 border-b border-bg-edge flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <AIDot size={7} />
            <span className="text-[14px] font-medium text-ink tracking-tight">Subsight AI</span>
            <span className="text-[10.5px] font-mono text-ai">co-pilot</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-bg-soft flex items-center justify-center transition"
          >
            <Icon name="x" size={16} className="text-ink-dim" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "ai" && (
                <div className="w-7 h-7 rounded-full bg-ai/10 hairline-ai flex items-center justify-center shrink-0 mt-0.5">
                  <AIDot size={6} />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed",
                  m.role === "ai"
                    ? "bg-bg-soft hairline text-ink-dim rounded-tl-sm"
                    : "bg-ai text-bg rounded-tr-sm"
                )}
              >
                {m.text}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-ai/10 hairline-ai flex items-center justify-center shrink-0">
                <AIDot size={6} />
              </div>
              <div className="bg-bg-soft hairline rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-ai animate-ai-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips */}
        {showSuggestions && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-[12px] text-ink-dim hairline bg-bg-soft hover:bg-bg-edge rounded-full px-3 py-1.5 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-bg-edge shrink-0">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask about your subscriptions…"
              className="flex-1 h-10 px-3.5 rounded-xl bg-bg-soft hairline focus:hairline-ai outline-none text-[13px] placeholder:text-ink-faint"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || thinking}
              className="w-10 h-10 rounded-xl bg-ai flex items-center justify-center disabled:opacity-40 transition"
            >
              <Icon name="send" size={15} className="text-bg" />
            </button>
          </div>
          <div className="mt-2 text-[10.5px] font-mono text-ink-faint text-center">
            AI responses are illustrative · always verify before acting
          </div>
        </div>
      </div>
    </>
  );
}
