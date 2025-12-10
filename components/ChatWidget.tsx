"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type WidgetPosition = "left" | "right";

// Tvoj hlavný účet – platformový bot, ktorý má byť všade ako default
const PLATFORM_OWNER_ID = "faeb1920-35fe-47be-a169-1393591cc3e4";

// Pomocná funkcia na konverziu hex na RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 16, g: 185, b: 129 }; // default emerald
};

// Pomocná funkcia na určenie kontrastnej farby (čierna alebo biela)
const getContrastColor = (hex: string) => {
  const rgb = hexToRgb(hex);
  // Vypočítaj jasnosť (luminance)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

export function ChatWidget({ ownerUserId }: { ownerUserId?: string }) {
  const pathname = usePathname();

  // ID bota, ktoré posielame do API (chat + leads)
  // - ak príde ownerUserId v props → použijeme ho (test-bot, embed)
  // - inak použijeme PLATFORM_OWNER_ID → tvoj hlavný bot všade na webe
  const [resolvedOwnerId, setResolvedOwnerId] = useState<string | null>(
    ownerUserId ?? PLATFORM_OWNER_ID
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

  // 📍 pozícia widgetu (default: vpravo pre všetkých, prepíše sa po načítaní nastavení z DB)
  const [widgetPosition, setWidgetPosition] = useState<WidgetPosition>("right");
  const [positionLoaded, setPositionLoaded] = useState(false); // Flag pre načítanie pozície

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 🔁 Načítanie ID bota
  // - Ak máme ownerUserId v props → použij ho (my-bot page, embed)
  // - Inak → vždy použij PLATFORM_OWNER_ID (admin bot všade inde)
  useEffect(() => {
    if (ownerUserId) {
      setResolvedOwnerId(ownerUserId);
    } else {
      // Vždy použij admin bot (PLATFORM_OWNER_ID) pre všetky stránky okrem my-bot
      setResolvedOwnerId(PLATFORM_OWNER_ID);
    }
  }, [ownerUserId]);

  // 🔁 Reset pri zmene stránky alebo ownerUserId
  useEffect(() => {
    setError(null);
    setLeadMessage(null);
    setShowLeadForm(false);

    // pri zmene stránky začíname od „defaultu" - NERESETUJEM pozíciu ani leadFormEnabled, necháme ich načítať z DB
    // Pozíciu widgetu a leadFormEnabled NERESETUJEM tu - necháme ich načítať z DB cez loadBotUiSettings
  }, [ownerUserId, pathname, resolvedOwnerId]);

  // 🎨 Widget styling state
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState("#10b981");
  const [widgetBackgroundColor, setWidgetBackgroundColor] = useState("#0f172a");
  const [widgetWelcomeMessage, setWidgetWelcomeMessage] = useState<string | null>(null);
  const [widgetLogoUrl, setWidgetLogoUrl] = useState<string | null>(null);

  // 🔧 Načítanie UI nastavení bota priamo zo Supabase (lead form + pozícia widgetu + farby)
  useEffect(() => {
    const loadBotUiSettings = async () => {
      if (!resolvedOwnerId) return;

      try {
        // Skús načítať všetky nastavenia (vrátane pokročilých)
        const { data, error } = await supabase
          .from("bot_settings")
          .select("show_lead_form_enabled, widget_position, widget_primary_color, widget_background_color, widget_welcome_message, widget_logo_url")
          .eq("user_id", resolvedOwnerId)
          .maybeSingle();

        if (error) {
          console.warn("Chyba pri načítaní UI nastavení bota:", error.message);
          // Skús načítať len základné nastavenia
          const { data: basicData } = await supabase
            .from("bot_settings")
            .select("show_lead_form_enabled, widget_position")
            .eq("user_id", resolvedOwnerId)
            .maybeSingle();
          
          if (basicData) {
            // Nastav leadFormEnabled - ak je null/undefined, použijeme false
            setLeadFormEnabled(basicData.show_lead_form_enabled === true);
            
            if (basicData.widget_position === "left" || basicData.widget_position === "right") {
              setWidgetPosition(basicData.widget_position);
            }
          }
          setPositionLoaded(true);
          return;
        }

        if (data) {
          // Nastav leadFormEnabled - explicitne kontrolujeme boolean hodnotu (true = true, inak false)
          setLeadFormEnabled(data.show_lead_form_enabled === true);

          if (data.widget_position === "left" || data.widget_position === "right") {
            setWidgetPosition(data.widget_position);
          }
          setPositionLoaded(true);

          // Pokročilé nastavenia (farby, welcome message, logo)
          if (data.widget_primary_color) {
            setWidgetPrimaryColor(data.widget_primary_color);
          }
          if (data.widget_background_color) {
            setWidgetBackgroundColor(data.widget_background_color);
          }
          if (data.widget_welcome_message) {
            setWidgetWelcomeMessage(data.widget_welcome_message);
          }
          if (data.widget_logo_url) {
            setWidgetLogoUrl(data.widget_logo_url);
          }
        } else {
          // Ak nemáme žiadne nastavenia v databáze, nastavíme default hodnoty
          setLeadFormEnabled(false);
          setPositionLoaded(true);
        }
      } catch (err) {
        console.warn("Chyba pri loadBotUiSettings:", err);
        setPositionLoaded(true); // Aj pri chybe nastavíme, aby sa widget zobrazil
        setLeadFormEnabled(false); // Pri chybe nastavíme na false
      }
    };

    loadBotUiSettings();
  }, [resolvedOwnerId]);

  // Ak nemáme resolvedOwnerId, nastavíme pozíciu ako loaded
  useEffect(() => {
    if (!resolvedOwnerId) {
      setPositionLoaded(true);
    }
  }, [resolvedOwnerId]);

  // 🔁 Aktualizuj welcome message keď sa načíta z DB alebo sa zmení pathname
  useEffect(() => {
    const defaultMessage = pathname.startsWith("/dashboard/my-bot")
      ? "Ahoj! Som tvoj firemný AI chatbot. Tu si ma môžeš otestovať presne tak, ako budem odpovedať tvojim zákazníkom. 🙂"
      : pathname.startsWith("/dashboard")
      ? "Ahoj! Som tvoj AI asistent. Môžem ti pomôcť s nastavením chatbota, FAQ a odpovedať na otázky o platforme. 🙂"
      : "Ahoj! Som chatbot tejto stránky. Môžem ti vysvetliť, čo tento nástroj robí a ako ti môže pomôcť. Opýtaj sa ma čokoľvek. 🙂";

    const finalMessage = widgetWelcomeMessage || defaultMessage;

    // Aktualizuj len ak sa správa zmenila alebo je prázdny zoznam
    if (messages.length === 0 || (messages[0].role === "assistant" && messages[0].content !== finalMessage)) {
      setMessages([
        {
          id: Date.now(),
          role: "assistant",
          content: finalMessage,
        },
      ]);
    }
  }, [widgetWelcomeMessage, pathname]);

  // auto scroll na koniec pri novej správe
  useEffect(() => {
    if (messagesEndRef.current && open) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleToggle = () => {
    if (open) {
      // Pri zatváraní - najprv zatvoríme, potom sa zobrazí tlačidlo
      setOpen(false);
      setError(null);
      setLeadMessage(null);
    } else {
      // Pri otváraní - normálne
      setOpen(true);
      setError(null);
      setLeadMessage(null);
    }
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
      // Posielame posledných 10 správ ako históriu konverzácie (okrem počiatočnej správy)
      const conversationHistory = messages
        .filter((m) => m.id !== 1) // Odstránime počiatočnú správu
        .slice(-10) // Posledných 10 správ
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          ownerUserId: resolvedOwnerId ?? null,
          conversationHistory: conversationHistory,
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

      // 🌱 aktivujeme/deaktivujeme lead formulár podľa nastavení bota (z API)
      if (typeof data.useLeadsForm === "boolean") {
        setLeadFormEnabled(data.useLeadsForm);
      }

      // 📍 nastavíme pozíciu widgetu podľa nastavení bota (z API)
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
  const positionClass = widgetPosition === "left" ? "left-5" : "right-5";

  // Nezobrazuj widget, kým sa nenačíta pozícia (aby sa nespawol na zlom mieste)
  if (!positionLoaded) {
    return null;
  }

  // zavretý stav – iba plávajúce tlačidlo
  const primaryRgb = hexToRgb(widgetPrimaryColor);

  return (
    <>
      {!open && (
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.2,
            ease: "easeOut"
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`fixed bottom-5 ${positionClass} z-40 h-14 px-5 rounded-full shadow-2xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] backdrop-blur-sm border border-white/10`}
          style={{
            background: `linear-gradient(135deg, rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.95), rgba(${Math.min(primaryRgb.r + 40, 255)}, ${Math.min(primaryRgb.g + 40, 255)}, ${Math.min(primaryRgb.b + 40, 255)}, 0.95))`,
            color: getContrastColor(widgetPrimaryColor || "#10b981"),
            willChange: "transform, opacity",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
            WebkitTransform: "translateZ(0)",
            transform: "translateZ(0)",
          }}
        >
          {widgetLogoUrl ? (
            <img
              src={widgetLogoUrl}
              alt="Bot logo"
              className="h-8 w-8 rounded-full object-cover"
              onError={(e) => {
                // Fallback na emoji ak obrázok nefunguje
                (e.target as HTMLImageElement).style.display = "none";
                const parent = (e.target as HTMLElement).parentElement;
                if (parent && !parent.querySelector(".fallback-emoji")) {
                  const emoji = document.createElement("span");
                  emoji.className = "fallback-emoji inline-flex h-8 w-8 rounded-full bg-black/20 items-center justify-center text-lg";
                  emoji.textContent = "💬";
                  parent.insertBefore(emoji, e.target);
                }
              }}
            />
          ) : (
            <span className="inline-flex h-8 w-8 rounded-full bg-white/20 items-center justify-center text-lg backdrop-blur-sm">
              💬
            </span>
          )}
          <span className="text-white drop-shadow-sm">Opýtať sa chatbota</span>
        </motion.button>
      )}
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.2,
            ease: "easeOut"
          }}
          className={`fixed bottom-5 ${positionClass} z-40 w-[340px] sm:w-[400px] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden`}
          style={{
            background: `linear-gradient(135deg, ${widgetBackgroundColor || "#0a0f1e"} 0%, ${widgetBackgroundColor || "#0f172a"} 100%)`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`,
            willChange: "transform, opacity",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
            WebkitTransform: "translateZ(0)",
            transform: "translateZ(0)",
            WebkitPerspective: "1000px",
            perspective: "1000px",
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1) 0%, transparent 100%)`,
            }}
          >
              <div className="flex items-center gap-2">
                {widgetLogoUrl ? (
                  <img
                    src={widgetLogoUrl}
                    alt="Bot logo"
                    className="h-8 w-8 rounded-full object-cover border border-slate-700"
                    onError={(e) => {
                      // Fallback na default AI ikonu
                      (e.target as HTMLImageElement).style.display = "none";
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent && !parent.querySelector(".fallback-ai")) {
                        const aiDiv = document.createElement("div");
                        aiDiv.className = "fallback-ai h-8 w-8 rounded-full border border-slate-700 flex items-center justify-center text-xs font-semibold";
                        aiDiv.style.backgroundColor = `${widgetPrimaryColor || "#10b981"}15`;
                        aiDiv.style.borderColor = `${widgetPrimaryColor || "#10b981"}40`;
                        aiDiv.style.color = widgetPrimaryColor || "#10b981";
                        aiDiv.textContent = "AI";
                        parent.insertBefore(aiDiv, e.target);
                      }
                    }}
                  />
                ) : (
                  <div
                    className="h-10 w-10 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-lg backdrop-blur-sm"
                    style={{
                      background: `linear-gradient(135deg, rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2), rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1))`,
                      borderColor: `${widgetPrimaryColor || "#10b981"}60`,
                      color: widgetPrimaryColor || "#10b981",
                      boxShadow: `0 0 20px rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`,
                    }}
                  >
                    AI
                  </div>
                )}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">AI asistent</span>
                <span className="text-[11px] flex items-center gap-1.5" style={{ color: widgetPrimaryColor || "#10b981" }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: widgetPrimaryColor || "#10b981" }} />
                  Online · odpovedá do pár sekúnd
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className="text-slate-400 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 px-4 py-4 space-y-3 text-[13px] overflow-y-auto max-h-[350px] bg-gradient-to-b from-transparent to-black/5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                } animate-in fade-in slide-in-from-bottom-2`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur-sm ${
                    m.role === "user"
                      ? "text-white"
                      : "bg-white/5 border border-white/10 text-slate-100"
                  }`}
                  style={
                    m.role === "user"
                      ? {
                          background: `linear-gradient(135deg, ${widgetPrimaryColor || "#10b981"}, rgba(${Math.min(primaryRgb.r + 30, 255)}, ${Math.min(primaryRgb.g + 30, 255)}, ${Math.min(primaryRgb.b + 30, 255)}, 1))`,
                          color: getContrastColor(widgetPrimaryColor || "#10b981"),
                          boxShadow: `0 4px 20px rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.4)`,
                        }
                      : {
                          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                        }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start animate-in fade-in">
                <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-white/5 border border-white/10 text-[12px] text-slate-300 backdrop-blur-sm shadow-lg">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
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
          <div className="border-t border-white/10 bg-gradient-to-t from-black/20 to-transparent backdrop-blur-sm p-4 space-y-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Napíš otázku…"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                className="h-10 px-4 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${widgetPrimaryColor || "#10b981"}, rgba(${Math.min(primaryRgb.r + 30, 255)}, ${Math.min(primaryRgb.g + 30, 255)}, ${Math.min(primaryRgb.b + 30, 255)}, 1))`,
                  color: getContrastColor(widgetPrimaryColor || "#10b981"),
                  boxShadow: `0 4px 20px rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.4)`,
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = `0 6px 30px rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.6)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = `0 4px 20px rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.4)`;
                  }
                }}
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
                      className="w-full mt-1 h-8 rounded-lg text-[11px] font-semibold disabled:bg-slate-700 disabled:text-slate-400 transition-colors"
                      style={{
                        backgroundColor: widgetPrimaryColor || "#10b981",
                        color: getContrastColor(widgetPrimaryColor || "#10b981"),
                      }}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.disabled) {
                          const rgb = hexToRgb(widgetPrimaryColor || "#10b981");
                          e.currentTarget.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.backgroundColor = widgetPrimaryColor || "#10b981";
                        }
                      }}
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
        </motion.div>
      )}
    </>
  );
}