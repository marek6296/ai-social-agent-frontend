"use client";

import { usePathname } from "next/navigation";
import { ChatWidget } from "./ChatWidget";

export function GlobalChat() {
  const pathname = usePathname();

  // Na stránke Test môjho bota NEZOBRAZUJ globálny chat
  if (pathname.startsWith("/dashboard/my-bot")) {
    return null;
  }

  // všade inde zobraz klasického bota (AI Social Agent)
  return <ChatWidget />;
}