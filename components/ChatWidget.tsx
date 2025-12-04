"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Ahoj! Som AI chatbot tejto stránky. Môžem ti vysvetliť, čo tento nástroj robí a ako ti môže pomôcť. Opýtaj sa ma čokoľvek. 🙂",
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // auto scroll na koniec pri novej správe
  useEffect(() => {
    if (messagesEndRef.current && open) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const text = input.trim();
    setInput("");
    setError(null);

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const apiError =
          (data as any)?.error || "Server vrátil chybu. Skús to znova neskôr.";
        setError(apiError);

        const botErrorMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "Hmm, momentálne sa mi nepodarilo získať odpoveď z backendu. Skús to, prosím, o chvíľu znova. 🙏",
        };
        setMessages((prev) => [...prev, botErrorMessage]);
        return;
      }

      const data = (await res.json()) as { reply?: string };
      const replyText =
        data.reply ??
        "Dostal som tvoju správu, ale odpoveď sa nepodarilo načítať. Skús to znova.";

      const botMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: replyText,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("ChatWidget fetch error:", err);
      setError("Nepodarilo sa spojiť so serverom.");
      const botErrorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "Vyzerá to, že sa neviem pripojiť k serveru. Skontroluj pripojenie alebo to skús znova. 🌐",
      };
      setMessages((prev) => [...prev, botErrorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  // zavretý stav – iba plávajúce tlačidlo
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-12 px-4 rounded-full shadow-xl flex items-center gap-2 text-sm font-semibold"
        style={{
          background:
            "linear-gradient(135deg, rgba(16, 185, 129, 1), rgba(56, 189, 248, 1))",
        }}
      >
        <span className="inline-flex h-8 w-8 rounded-full bg-black/20 items-center justify-center text-lg">
          💬
        </span>
        <span>Opýtať sa chatbota</span>
      </button>
    );
  }

  // otvorený chat
  return (
    <div className="fixed bottom-5 right-5 z-40 w-[320px] sm:w-[380px] rounded-2xl border border-slate-700 bg-slate-950/95 shadow-2xl shadow-black/60 backdrop-blur-md flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-xs font-semibold text-emerald-300">
            AI
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">AI asistent</span>
            <span className="text-[11px] text-emerald-300">
              Online · odpovedá do pár sekúnd
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="text-slate-400 hover:text-slate-200 text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 px-3 py-3 space-y-2 text-[13px] overflow-y-auto max-h-[300px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${
                m.role === "user"
                  ? "bg-emerald-500 text-black"
                  : "bg-slate-900 border border-slate-700 text-slate-100"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-1 rounded-2xl px-3 py-2 bg-slate-900 border border-slate-700 text-[11px] text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" />
              <span>Premýšľam…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="px-3 pb-1 text-[11px] text-red-400">
          Chyba: {error}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-800 bg-slate-900/90 p-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Napíš otázku…"
            className="flex-1 bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="h-9 px-3 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-black transition-colors"
          >
            Poslať
          </button>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          Tento chat používa demo odpovede z API. Neskôr ho prepojíme na reálne AI
          a tvoje firemné dáta.
        </p>
      </form>
    </div>
  );
}