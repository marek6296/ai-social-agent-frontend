"use client";

import { ReactNode, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MessageSquare,
  UserPlus,
  FileText,
  Clock,
  Calendar,
  Shield,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
} from "lucide-react";

const modules = [
  {
    id: "general",
    label: "Základné nastavenia",
    icon: SettingsIcon,
    href: (botId: string) => `/dashboard/discord-bot/${botId}`,
  },
  {
    id: "message-reply",
    label: "Odpovedanie",
    icon: MessageSquare,
    href: (botId: string) => `/dashboard/discord-bot/${botId}/message-reply`,
  },
  {
    id: "welcome",
    label: "Welcome & Onboarding",
    icon: UserPlus,
    href: (botId: string) => `/dashboard/discord-bot/${botId}/welcome`,
  },
  {
    id: "rules",
    label: "Pravidlá & Auto-odpovede",
    icon: FileText,
    href: (botId: string) => `/dashboard/discord-bot/${botId}/rules`,
  },
  {
    id: "scheduled",
    label: "Plánované správy",
    icon: Clock,
    href: (botId: string) => `/dashboard/discord-bot/${botId}/scheduled`,
  },
  {
    id: "events",
    label: "Eventy & Interakcie",
    icon: Calendar,
    href: (botId: string) => `/dashboard/discord-bot/${botId}/events`,
  },
  {
    id: "templates",
    label: "Message Templates",
    icon: FileText,
    href: (botId: string) => `/dashboard/discord-bot/${botId}/templates`,
  },
  {
    id: "moderation",
    label: "Moderácia",
    icon: Shield,
    href: (botId: string) => `/dashboard/discord-bot/${botId}/moderation`,
  },
  {
    id: "logs",
    label: "Logy & Diagnostika",
    icon: BarChart3,
    href: (botId: string) => `/dashboard/discord-bot/${botId}/logs`,
  },
];

export default function DiscordBotLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const botId = params.id as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Určiť aktívny modul podľa pathname
  // Ak je pathname presne /dashboard/discord-bot/[id], tak je to "general"
  const activeModule = 
    pathname === `/dashboard/discord-bot/${botId}` 
      ? "general"
      : modules.find((m) => pathname.startsWith(m.href(botId)))?.id || "general";

  const NavigationContent = () => (
    <nav className="p-4 space-y-1">
      {modules.map((module) => {
        const Icon = module.icon;
        const isActive = activeModule === module.id;
        const href = module.href(botId);

        return (
          <Link
            key={module.id}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{module.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop: Ľavé menu */}
      <aside className="hidden md:block w-64 border-r bg-muted/40 flex-shrink-0">
        <div className="sticky top-0 max-h-screen overflow-y-auto">
          <NavigationContent />
        </div>
      </aside>

      {/* Hlavný obsah */}
      <main className="flex-1 bg-background min-w-0 w-full md:w-auto">
        {/* Mobile: Hamburger menu */}
        <div className="md:hidden border-b bg-background px-4 py-2 mb-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Menu className="h-5 w-5" />
                <span>Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-muted dark:bg-muted">
              <div className="h-full bg-muted dark:bg-muted">
                <NavigationContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

