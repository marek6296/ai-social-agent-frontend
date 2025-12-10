"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function NavigationLoading() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ak sa pathname zmenil, zobraz loading
    if (pathname !== prevPathnameRef.current) {
      // Zruš predchádzajúci timeout ak existuje
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      setIsLoading(true);
      prevPathnameRef.current = pathname;
      
      // Skryj loading po tom, ako sa stránka načíta
      // Použijeme requestAnimationFrame pre lepšiu synchronizáciu
      const hideLoading = () => {
        // Počkaj na dokončenie renderu
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            loadingTimeoutRef.current = setTimeout(() => {
              setIsLoading(false);
            }, 200);
          });
        });
      };

      hideLoading();
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-md"
          style={{ 
            willChange: 'opacity',
            WebkitBackfaceVisibility: 'hidden',
            WebkitPerspective: '1000px'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-center"
          >
            <div className="relative mb-4">
              {/* Hlavný spinner */}
              <div 
                className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full mx-auto" 
                style={{ animation: 'spin 1s linear infinite' }} 
              />
              {/* Sekundárny spinner pre efekt */}
              <div 
                className="absolute inset-0 h-16 w-16 border-4 border-transparent border-t-primary/30 rounded-full mx-auto" 
                style={{ animation: 'spin 0.8s linear infinite reverse' }} 
              />
            </div>
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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

