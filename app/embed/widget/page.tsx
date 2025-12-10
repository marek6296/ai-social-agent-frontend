"use client";

import { ChatWidget } from "@/components/ChatWidget";
import { useSearchParams } from "next/navigation";

export default function EmbedWidgetPage() {
  const searchParams = useSearchParams();
  const botId = searchParams.get("botId");

  if (!botId) {
    return (
      <div style={{ padding: "20px", color: "#fff", background: "#0f172a" }}>
        <p>Chyba: Chýba bot ID</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", background: "transparent" }}>
      <ChatWidget ownerUserId={botId} />
    </div>
  );
}

