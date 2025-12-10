"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector pre element, na ktorý sa má ukázať
  position?: "top" | "bottom" | "left" | "right";
};

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Vitaj v AI Social Agent! 🎉",
    description:
      "Tvoj dashboard je pripravený. Prejdi si tento krátky návod a zistíš, ako nastaviť svojho AI chatbota.",
  },
  {
    id: "bot-settings",
    title: "1. Nastavenia chatbota",
    description:
      "Začni tu! Nastav názov firmy, meno bota a tón komunikácie. Tieto informácie bot použije pri každej odpovedi.",
    target: 'a[href="/dashboard/bot-settings"]',
    position: "right",
  },
  {
    id: "faq",
    title: "2. Pridaj FAQ",
    description:
      "Pridaj najčastejšie otázky a odpovede. Chatbot ich použije ako hlavný zdroj pri odpovedaní návštevníkom.",
    target: 'a[href="/dashboard/faq"]',
    position: "right",
  },
  {
    id: "test-bot",
    title: "3. Otestuj svojho bota",
    description:
      "Vyskúšaj, ako bude chatbot odpovedať tvojim zákazníkom. Môžeš ho testovať s tvojimi nastaveniami a FAQ.",
    target: 'a[href="/dashboard/my-bot"]',
    position: "right",
  },
  {
    id: "embed",
    title: "4. Vlož chatbot na web",
    description:
      "Skopíruj embed kód a vlož ho na svoju webstránku. Widget sa automaticky načíta a zobrazí tvojho AI chatbota.",
    target: 'section:has(h2:contains("Embed kód"))',
    position: "top",
  },
  {
    id: "done",
    title: "Hotovo! 🚀",
    description:
      "Máš všetko nastavené. Teraz môžeš sledovať konverzácie, analytics a leady v dashboarde. Veľa šťastia!",
  },
];

export function OnboardingModal() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Skontroluj, či užívateľ už dokončil onboarding
    const checkOnboarding = async () => {
      const onboardingDismissed = localStorage.getItem("onboarding_dismissed");
      if (onboardingDismissed === "true") {
        setDismissed(true);
        return;
      }

      // Skontroluj, či má užívateľ už nastavenia bota (tzn. už prešiel onboarding)
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: settings } = await supabase
          .from("bot_settings")
          .select("id")
          .eq("user_id", userData.user.id)
          .maybeSingle();

        if (settings) {
          // Už má nastavenia, neukazuj onboarding
          setDismissed(true);
          return;
        }
      }

      // Zobraz onboarding po malom delay
      setTimeout(() => setIsVisible(true), 1000);
    };

    checkOnboarding();
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("onboarding_dismissed", "true");
    setDismissed(true);
  };

  const handleSkip = () => {
    handleDismiss();
  };

  if (dismissed || !isVisible) {
    return null;
  }

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  // Pozícia tooltipu - pre jednoduchosť zobrazujeme v strede, tooltips môžeme pridať neskôr
  const tooltipStyle: React.CSSProperties = {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />

          {/* Tooltip */}
          <motion.div
            className="fixed z-[60] w-[320px] sm:w-[380px]"
            style={tooltipStyle}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="bg-slate-950 border border-emerald-500/50 rounded-2xl p-5 shadow-2xl shadow-black/60">
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Krok {currentStep + 1} z {steps.length}</span>
                  <button
                    onClick={handleSkip}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Preskočiť
                  </button>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2 text-emerald-400">
                {step.title}
              </h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                {step.description}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={isFirst}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Späť
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
                >
                  {isLast ? "Začať" : "Ďalej →"}
                </button>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

