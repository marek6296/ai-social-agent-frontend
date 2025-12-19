"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedPage } from "@/components/AnimatedPage";
import {
  Globe,
  MessageCircle,
  Send,
  Instagram,
  ArrowRight,
  LogOut,
  Zap,
  Shield,
  Sparkles,
} from "lucide-react";

type UserProfile = {
  id: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
};

const SUPER_ADMIN_ID = "faeb1920-35fe-47be-a169-1393591cc3e4";

const products = [
  {
    id: "web-bot",
    title: "AI Chatbot pre Web",
    description: "Inteligentný chatbot pre tvoj web, ktorý odpovedá na otázky návštevníkov a zachytáva leady.",
    icon: Globe,
    href: "/dashboard/web-bot",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    hoverColor: "hover:bg-emerald-500/20",
    borderColor: "border-emerald-500/20",
    gradient: "from-emerald-500/10 to-emerald-500/5",
  },
  {
    id: "discord-bot",
    title: "Discord Chatbot",
    description: "Automatizuj komunikáciu na tvojom Discord serveri s AI chatbotom, ktorý pomáha používateľom.",
    icon: MessageCircle,
    href: "/dashboard/discord-bot",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    hoverColor: "hover:bg-indigo-500/20",
    borderColor: "border-indigo-500/20",
    gradient: "from-indigo-500/10 to-indigo-500/5",
  },
  {
    id: "telegram-bot",
    title: "Telegram Chatbot",
    description: "Vytvor Telegram bota, ktorý komunikuje s používateľmi a poskytuje automatizované odpovede.",
    icon: Send,
    href: "/dashboard/telegram-bot",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    hoverColor: "hover:bg-blue-500/20",
    borderColor: "border-blue-500/20",
    gradient: "from-blue-500/10 to-blue-500/5",
  },
  {
    id: "instagram-bot",
    title: "Instagram Chatbot",
    description: "Automatizuj odpovede na Instagram DMs a komentáre s pomocou AI chatbota.",
    icon: Instagram,
    href: "/dashboard/instagram-bot",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    hoverColor: "hover:bg-pink-500/20",
    borderColor: "border-pink-500/20",
    gradient: "from-pink-500/10 to-pink-500/5",
  },
];

const cardSpring = (delay: number) => ({
  type: "spring" as const,
  stiffness: 100,
  damping: 15,
  delay,
});

export default function ProductHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<string>("starter");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        // Handle refresh token errors
        if (error.message?.includes("Refresh Token") || error.message?.includes("refresh_token")) {
          await supabase.auth.signOut();
          router.push("/login");
          return;
        }
        router.push("/login");
        return;
      }

      if (!data.user) {
        router.push("/login");
        return;
      }

      const { id, email, user_metadata } = data.user;

      setUser({
        id,
        email: email ?? null,
        firstName: user_metadata?.firstName,
        lastName: user_metadata?.lastName,
      });

      // Načítanie plánu a admin práv (rovnaká logika ako v web-bot dashboarde)
      let profileData = null;
      let profileError = null;
      
      // Skúsme najprv načítať cez API endpoint (server-side)
      try {
        const apiResponse = await fetch(`/api/user/plan?userId=${encodeURIComponent(id)}`);
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (apiData.profileData) {
            profileData = apiData.profileData;
          } else if (apiData.plan) {
            profileData = {
              plan: apiData.plan,
              is_admin: apiData.isAdmin || false
            };
          }
        }
      } catch (apiError) {
        // Silent fallback to DB
      }

      // Fallback: Ak API nefunguje, skúsme priamo z DB
      if (!profileData) {
        for (let attempt = 0; attempt < 3; attempt++) {
          const result = await supabase
            .from("users_profile")
            .select("plan, is_admin")
            .eq("id", id)
            .maybeSingle();
          
          profileData = result.data;
          profileError = result.error;
          if (profileData || attempt === 2) break;
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      const userIsAdmin = profileData?.is_admin === true || id === SUPER_ADMIN_ID;
      const isSuperAdmin = id === SUPER_ADMIN_ID;
      
      setIsAdmin(userIsAdmin);
      
      let finalPlan = "starter";
      if (userIsAdmin || isSuperAdmin) {
        finalPlan = "unlimited";
      } else if (profileData?.plan && typeof profileData.plan === 'string' && profileData.plan.trim() !== '') {
        finalPlan = profileData.plan.toLowerCase();
      }
      setPlan(finalPlan);

      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const displayName = user?.firstName?.trim() || 
                      user?.email?.split("@")[0] || 
                      "Používateľ";

  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Načítavam produkty…</p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                {/* 
                  UPRAVITEĽNÉ HODNOTY - Riadok 214:
                  mb-1 = vzdialenosť medzi nadpisom a podnadpisom
                  Možnosti: mb-0.5, mb-1, mb-1.5, mb-2, mb-3
                */}
                <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent tracking-tight leading-tight">
                  Vitaj späť, {displayName}! 👋
                </h1>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex items-center gap-3 flex-shrink-0"
              >
                <Badge 
                  variant="outline" 
                  className="flex gap-2 px-3 py-1.5 capitalize"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {plan === "unlimited" ? "Unlimited" : `${plan || "starter"} plán`}
                  </span>
                </Badge>
                {user?.id === SUPER_ADMIN_ID && (
                  <Link href="/dashboard/admin">
                    <Badge 
                      variant="outline" 
                      className="flex gap-2 px-3 py-1.5 border-purple-500/50 text-purple-500 cursor-pointer hover:bg-purple-500/10 transition-colors"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span className="font-medium">Super Admin</span>
                    </Badge>
                  </Link>
                )}
                {isAdmin && user?.id !== SUPER_ADMIN_ID && (
                  <Link href="/dashboard/admin">
                    <Badge 
                      variant="outline" 
                      className="flex gap-2 px-3 py-1.5 border-red-500/50 text-red-500 cursor-pointer hover:bg-red-500/10 transition-colors"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span className="font-medium">Admin</span>
                    </Badge>
                  </Link>
                )}
                <Button variant="outline" onClick={handleLogout} size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Odhlásiť sa
                </Button>
              </motion.div>
            </div>
          </motion.header>

          {/* Product Selection Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-12"
          >
            {/* 
              UPRAVITEĽNÉ HODNOTY - Riadok 283:
              text-3xl = veľkosť textu (možnosti: text-2xl, text-3xl, text-4xl, text-5xl)
              font-medium = hrúbka (možnosti: font-normal, font-medium, font-semibold, font-bold)
              mb-12 = vzdialenosť od kariet (možnosti: mb-8, mb-10, mb-12, mb-16)
            */}
            <p className="text-muted-foreground text-3xl font-medium">
              Vyber si produkt, ktorý chceš spravovať
            </p>
          </motion.div>

          {/* Product Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={cardSpring(index * 0.1)}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex"
              >
                <Card className="group relative w-full flex flex-col h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 overflow-hidden border-border/50">
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient} transition-all duration-500 pointer-events-none opacity-0 group-hover:opacity-100`} />
                  
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full"
                    transition={{ duration: 0.7 }}
                  />
                  
                  <CardHeader className="relative z-10 pb-4 flex-1 flex flex-col">
                    <div className={`h-16 w-16 rounded-2xl ${product.bgColor} ${product.hoverColor} flex items-center justify-center mb-6 transition-colors shadow-lg border ${product.borderColor}`}>
                      <product.icon className={`h-8 w-8 ${product.color}`} />
                    </div>
                    <CardTitle className="text-2xl mb-3">{product.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed flex-1">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10 pt-0 mt-auto">
                    <Button
                      asChild
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant="outline"
                    >
                      <Link href={product.href} className="flex items-center justify-center gap-2">
                        <span>Otvoriť</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12"
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Multi-produktová platforma</CardTitle>
                    <CardDescription>
                      Spravuj všetky svoje AI produkty z jedného miesta
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Každý produkt má svoj vlastný dashboard s nastaveniami, analýzami a konverzáciami. 
                  Vyber si produkt, ktorý chceš spravovať, a začni konfigurovať svojho AI asistenta.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
}
