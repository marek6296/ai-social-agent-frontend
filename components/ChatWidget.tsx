"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type WidgetPosition = "left" | "right";

export function ChatWidget({ ownerUserId }: { ownerUserId?: string }) {
  const pathname = usePathname();

  // ID bota, ktoré posielame do API (chat + leads)
  const [resolvedOwnerId, setResolvedOwnerId] = useState<string | null>(
    ownerUserId ?? null
  );

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Ahoj! Som chatbot tejto stránky. Môžem ti vysvetliť, čo tento nástroj robí a ako ti môže pomôcť. Opýtaj sa ma čokoľvek. 🙂",
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🌱 lead form state
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadNote, setLeadNote] = useState("");
  const [isSavingLead, setIsSavingLead] = useState(false);
  const [leadMessage, setLeadMessage] = useState<string | null>(null);
  const [leadFormEnabled, setLeadFormEnabled] = useState(false);

  // 📍 pozícia widgetu (default: globálny bot vľavo, klient/test bot vpravo – prepíše sa po 1. odpovedi z API)
  const [widgetPosition, setWidgetPosition] = useState<WidgetPosition>(
    ownerUserId ? "right" : "left"
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 🔁 Reset pri zmene stránky alebo ownerUserId (ale necháme, nech API znova nastaví widgetPosition a lead form)
  useEffect(() => {
    // kto je majiteľ bota na tejto stránke
    setResolvedOwnerId(ownerUserId ?? null);

    // inicializačná správa
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: pathname.startsWith("/dashboard/my-bot")
          ? "Ahoj! Som tvoj firemný AI chatbot. Tu si ma môžeš otestovať presne tak, ako budem odpovedať tvojim zákazníkom. 🙂"
          : "Ahoj! Som chatbot tejto stránky. Môžem ti vysvetliť, čo tento nástroj robí a ako ti môže pomôcť. Opýtaj sa ma čokoľvek. 🙂",
      },
    ]);

    setError(null);
    setLeadMessage(null);
    setShowLeadForm(false);

    // pri zmene stránky začíname od „defaultu“
    setLeadFormEnabled(false);
    setWidgetPosition(ownerUserId ? "right" : "left");
  }, [ownerUserId, pathname]);

  // Ak sme na /dashboard/my-bot a nemáme ownerUserId v props,
  // načítaj id prihláseného usera (test bota)
  useEffect(() => {
    const fetchUserIdIfNeeded = async () => {
      if (resolvedOwnerId) return;
      if (!pathname.startsWith("/dashboard/my-bot")) return;

      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        setResolvedOwnerId(data.user.id);
      }
    };

    fetchUserIdIfNeeded();
  }, [pathname, resolvedOwnerId]);

  // 🔧 Načítanie UI nastavení bota priamo zo Supabase (lead form + pozícia widgetu)
  useEffect(() => {
    const loadBotUiSettings = async () => {
      if (!resolvedOwnerId) return;

      try {
        const { data, error } = await supabase
          .from("bot_settings")
          .select("show_lead_form_enabled, widget_position")
          .eq("user_id", resolvedOwnerId)
          .maybeSingle();

        if (error) {
          console.warn("Chyba pri načítaní UI nastavení bota:", error.message);
          return;
        }

        if (data) {
          if (typeof data.show_lead_form_enabled === "boolean") {
            setLeadFormEnabled(data.show_lead_form_enabled);
          }

          if (data.widget_position === "left" || data.widget_position === "right") {
            setWidgetPosition(data.widget_position);
          }
        }
      } catch (err) {
        console.warn("Chyba pri loadBotUiSettings:", err);
      }
    };

    loadBotUiSettings();
  }, [resolvedOwnerId]);

  // auto scroll na koniec pri novej správe
  useEffect(() => {
    if (messagesEndRef.current && open) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
    setError(null);
    setLeadMessage(null);
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
        body: JSON.stringify({
          message: text,
          ownerUserId: resolvedOwnerId ?? null,
        }),
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

      const data = (await res.json()) as {
        reply?: string;
        useLeadsForm?: boolean;
        widgetPosition?: WidgetPosition;
      };

      const replyText =
        data.reply ??
        "Dostal som tvoju správu, ale odpoveď sa nepodarilo načítať. Skús to znova.";

      // 🌱 aktivujeme/deaktivujeme lead formulár podľa nastavení bota
      if (typeof data.useLeadsForm === "boolean") {
        setLeadFormEnabled(data.useLeadsForm);
      }

      // 📍 nastavíme pozíciu widgetu podľa nastavení bota
      if (data.widgetPosition === "left" || data.widgetPosition === "right") {
        setWidgetPosition(data.widgetPosition);
      }

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

  // 💌 submit lead formulára
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadMessage(null);

    if (!resolvedOwnerId) {
      setLeadMessage("Momentálne sa nepodarilo priradiť tento kontakt k účtu.");
      return;
    }

    if (!leadEmail.trim()) {
      setLeadMessage("Prosím, zadaj svoj email.");
      return;
    }

    setIsSavingLead(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: leadName || null,
          email: leadEmail.trim(),
          note: leadNote || null,
          ownerUserId: resolvedOwnerId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const apiError =
          (data as any)?.error ||
          "Nepodarilo sa uložiť kontakt. Skús to neskôr.";
        setLeadMessage(apiError);
        return;
      }

      setLeadMessage("Ďakujeme! Kontakt bol odoslaný, ozveme sa ti čoskoro. 🙌");
      setLeadName("");
      setLeadEmail("");
      setLeadNote("");
      setShowLeadForm(false);
    } catch (err) {
      console.error("Lead submit error:", err);
      setLeadMessage("Nastala chyba pri odosielaní. Skús to prosím znova.");
    } finally {
      setIsSavingLead(false);
    }
  };

  // 📍 pomocné className pre pozíciu (ľavo / vpravo)
  const positionClass =
    widgetPosition === "left" ? "left-5" : "right-5";

  // zavretý stav – iba plávajúce tlačidlo
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed bottom-5 ${positionClass} z-40 h-12 px-4 rounded-full shadow-xl flex items-center gap-2 text-sm font-semibold`}
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
    <div
      className={`fixed bottom-5 ${positionClass} z-40 w-[320px] sm:w-[380px] rounded-2xl border border-slate-700 bg-slate-950/95 shadow-2xl shadow-black/60 backdrop-blur-md flex flex-col overflow-hidden`}
    >
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

      {/* Input + lead form */}
      <div className="border-t border-slate-800 bg-slate-900/90 p-3 space-y-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
        </form>

        {/* info text len na test-bota stránke */}
        {pathname.startsWith("/dashboard/my-bot") && (
          <p className="text-[10px] text-slate-500">
            Tento chat používa AI asistenta prispôsobeného pre túto stránku a tvoje
            nastavenia bota.
          </p>
        )}

        {/* Lead section – ukážeme len ak má bot túto funkciu zapnutú */}
        {leadFormEnabled && resolvedOwnerId && (
          <div className="mt-1 border-t border-slate-800 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowLeadForm((prev) => !prev);
                setLeadMessage(null);
              }}
              className="w-full text-[11px] text-slate-300 hover:text-white flex items-center justify-between gap-2"
            >
              <span>Chceš, aby sa ti niekto ozval? Zanechaj kontakt.</span>
              <span className="text-emerald-400 text-xs">
                {showLeadForm ? "Skryť" : "Otvoriť"}
              </span>
            </button>

            {showLeadForm && (
              <form
                onSubmit={handleLeadSubmit}
                className="mt-2 space-y-1.5 text-[11px]"
              >
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Meno (voliteľné)"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="Email (povinné)"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <textarea
                  value={leadNote}
                  onChange={(e) => setLeadNote(e.target.value)}
                  placeholder="Čo ťa zaujíma? (voliteľné)"
                  rows={2}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={isSavingLead}
                  className="w-full mt-1 h-8 rounded-lg text-[11px] font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-black transition-colors"
                >
                  {isSavingLead ? "Ukladám..." : "Odoslať kontakt"}
                </button>
                {leadMessage && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    {leadMessage}
                  </p>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}