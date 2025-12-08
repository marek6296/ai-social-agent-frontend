// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Social Agent – Firemný AI chatbot na tvoj web",
  description:
    "AI Social Agent ti pomôže premeniť webstránku na nonstop AI asistenta – odpovede na otázky, leady a podpora 24/7.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  );
}