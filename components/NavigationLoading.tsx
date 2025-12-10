"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function NavigationLoading() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathnameRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minDisplayTimeRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Ignoruj prvý render
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevPathnameRef.current = pathname;
      return;
    }

    // Ak sa pathname zmenil, zobraz loading
    if (pathname !== prevPathnameRef.current) {
      // Zruš predchádzajúce timeouty ak existujú
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      // Zaznamenaj čas začiatku zobrazenia
      const startTime = Date.now();
      minDisplayTimeRef.current = startTime;
      
      setIsLoading(true);
      prevPathnameRef.current = pathname;
      
      // Počkaj na načítanie stránky a zabezpeč minimálny čas zobrazenia
      const checkAndHide = () => {
        const elapsed = Date.now() - startTime;
        const minDisplayTime = 800; // Minimálne 800ms zobrazenie
        
        if (elapsed < minDisplayTime) {
          // Ešte nie je uplynulý minimálny čas, počkaj
          loadingTimeoutRef.current = setTimeout(() => {
            setIsLoading(false);
            loadingTimeoutRef.current = null;
            minDisplayTimeRef.current = null;
          }, minDisplayTime - elapsed);
        } else {
          // Už uplynul minimálny čas, skryj okamžite
          setIsLoading(false);
          loadingTimeoutRef.current = null;
          minDisplayTimeRef.current = null;
        }
      };

      // Počkaj na načítanie DOM a potom skontroluj
      if (typeof window !== 'undefined') {
        if (document.readyState === 'complete') {
          // Stránka je už načítaná, počkaj minimálny čas
          loadingTimeoutRef.current = setTimeout(checkAndHide, 100);
        } else {
          // Počkaj na načítanie stránky
          window.addEventListener('load', () => {
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
            }
            loadingTimeoutRef.current = setTimeout(checkAndHide, 100);
          }, { once: true });
          
          // Fallback - ak sa load event nespustí, skryj po 1.5s
          loadingTimeoutRef.current = setTimeout(checkAndHide, 1500);
        }
      } else {
        // Fallback pre SSR
        loadingTimeoutRef.current = setTimeout(checkAndHide, 1000);
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm"
          style={{ 
            willChange: 'opacity',
            WebkitBackfaceVisibility: 'hidden',
            WebkitPerspective: '1000px'
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="text-center"
          >
            <div className="relative mb-6 flex items-center justify-center">
              {/* Hlavný spinner */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="h-16 w-16 border-4 border-primary/20 border-t-4 border-t-primary rounded-full"
                style={{ willChange: 'transform' }}
              />
            </div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-sm text-muted-foreground font-medium"
            >
              Načítavam…
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

