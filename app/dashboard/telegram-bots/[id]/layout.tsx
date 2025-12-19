"use client";

import { ReactNode, useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Home,
  Settings,
  MessageSquare,
  Code,
  Link2,
  Sparkles,
  Clock,
  FileText,
  Menu,
} from "lucide-react";

const tabs = [
  {
    id: "overview",
    label: "Prehľad",
    icon: Home,
    href: (botId: string) => `/dashboard/telegram-bots/${botId}`,
  },
  {
    id: "settings",
    label: "Nastavenia",
    icon: Settings,
    href: (botId: string) => `/dashboard/telegram-bots/${botId}/settings`,
  },
  {
    id: "commands",
    label: "Príkazy & Flow",
    icon: Code,
    href: (botId: string) => `/dashboard/telegram-bots/${botId}/commands`,
  },
  {
    id: "integrations",
    label: "Integrácie",
    icon: Link2,
    href: (botId: string) => `/dashboard/telegram-bots/${botId}/integrations`,
  },
  {
    id: "logs",
    label: "Logy",
    icon: FileText,
    href: (botId: string) => `/dashboard/telegram-bots/${botId}/logs`,
  },
];

function NavigationContent({ botId, pathname, onNavigate }: { botId: string; pathname: string; onNavigate?: () => void }) {
  const activeTab = pathname === `/dashboard/telegram-bots/${botId}` 
    ? "overview"
    : tabs.find((t) => pathname.startsWith(t.href(botId)))?.id || "overview";

  return (
    <nav className="space-y-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href(botId)}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function TelegramBotLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const botId = params.id as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure Sheet is only rendered on client to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r bg-muted/40 p-4 sticky top-0 max-h-screen overflow-y-auto">
        <NavigationContent botId={botId} pathname={pathname} />
      </aside>

      {/* Mobile Sidebar */}
      {isClient && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 fixed top-20 left-4 z-50"
              >
                <Menu className="h-4 w-4" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-background">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Navigácia</h2>
                  <p className="text-sm text-muted-foreground">
                    Vyber sekciu pre nastavenia bota
                  </p>
                </div>
                <NavigationContent 
                  botId={botId} 
                  pathname={pathname} 
                  onNavigate={() => setSidebarOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-16 md:pt-6">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
