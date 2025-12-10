"use client";

import { ReactNode, useEffect } from "react";
import { motion } from "framer-motion";

type AnimatedPageProps = {
  children: ReactNode;
};

export function AnimatedPage({ children }: AnimatedPageProps) {
  // Scroll na začiatok stránky pri otvorení alebo refreshnutí
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}