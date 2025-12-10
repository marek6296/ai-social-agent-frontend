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
import { OnboardingModal } from "@/components/OnboardingModal";
import {
  Settings,
  MessageSquare,
  BarChart3,
  Users,
  FileText,
  Code,
  User,
  LogOut,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
} from "lucide-react";

type UserProfile = {
  id: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
};

const cardSpring = (delay: number) => ({
  type: "spring" as const,
  stiffness: 100,
  damping: 15,
  delay,
});

const SUPER_ADMIN_ID = "faeb1920-35fe-47be-a169-1393591cc3e4";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [plan, setPlan] = useState<string>("starter");

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
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

      // Načítanie admin práv a plánu z users_profile
      // Použijeme API endpoint ako primárny spôsob (server-side má lepší prístup)
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
            // Ak API vráti aspoň plán, vytvoríme minimálny objekt
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
            .select("is_admin, plan")
            .eq("id", id)
            .maybeSingle();
          
          profileData = result.data;
          profileError = result.error;

          // Debug log (len ak je error)
          if (profileError && typeof window !== 'undefined') {
            console.warn(`Failed to load profile from DB (attempt ${attempt + 1}):`, {
              userId: id,
              error: profileError?.message || profileError?.code,
            });
          }

          // Ak máme dáta alebo je to posledný pokus, skonči
          if (profileData || attempt === 2) {
            break;
          }

          // Počkaj 200ms pred ďalším pokusom
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Error je už logovaný v debug logoch vyššie

      // Ak záznam neexistuje, vytvor ho s default hodnotami
      if (!profileData && !profileError) {
        const { error: createError } = await supabase
          .from("users_profile")
          .insert({
            id,
            plan: "starter",
            is_active: true,
            is_admin: false,
            credits_used_this_month: 0,
            last_credit_reset: new Date().toISOString(),
          });

        if (createError) {
          console.error("Failed to create user profile:", createError);
        } else {
          // Načítaj znovu po vytvorení
          const { data: newProfileData } = await supabase
            .from("users_profile")
            .select("is_admin, plan")
            .eq("id", id)
            .maybeSingle();

          const userIsAdmin = newProfileData?.is_admin === true || id === SUPER_ADMIN_ID;
          const isSuperAdmin = id === SUPER_ADMIN_ID;
          setIsAdmin(userIsAdmin);
          const finalPlan = (userIsAdmin || isSuperAdmin) ? "unlimited" : (newProfileData?.plan || "starter");
          setPlan(finalPlan);
          setLoading(false);
          return;
        }
      }

      const userIsAdmin = profileData?.is_admin === true || id === SUPER_ADMIN_ID;
      const isSuperAdmin = id === SUPER_ADMIN_ID;
      setIsAdmin(userIsAdmin);
      
      // Pre admina/super admina zobraz "Unlimited", inak skutočný plán
      let finalPlan = "starter";
      
      if (userIsAdmin || isSuperAdmin) {
        // Admin/Super Admin má vždy unlimited
        finalPlan = "unlimited";
      } else if (profileData) {
        // Máme dáta z DB - použij plán z DB (aj keď je null, použijeme starter)
        const planFromDB = profileData.plan;
        if (planFromDB && typeof planFromDB === 'string' && planFromDB.trim() !== '') {
          finalPlan = planFromDB.toLowerCase();
        } else {
          // Plán je null alebo prázdny - použijeme starter
          finalPlan = "starter";
        }
      } else {
        // Záznam neexistuje alebo je error - použijeme default "starter"
        finalPlan = "starter";
      }
      
      // Plan is set below
      
      setPlan(finalPlan);

      setLoading(false);
    };

    loadUser();
  }, [router]);


  // Refresh plánu pri focus na okno (ak admin zmenil plán)
  useEffect(() => {
    if (!user?.id) return;

    const handleFocus = async () => {
      // Retry logika aj pre focus refresh
      let profileData = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await supabase
          .from("users_profile")
          .select("plan, is_admin")
          .eq("id", user.id)
          .maybeSingle();
        
        profileData = result.data;
        if (profileData || attempt === 2) break;
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (profileData) {
        const userIsAdmin = profileData.is_admin === true || user.id === SUPER_ADMIN_ID;
        const isSuperAdmin = user.id === SUPER_ADMIN_ID;
        
        let newPlan = "starter";
        if (userIsAdmin || isSuperAdmin) {
          newPlan = "unlimited";
        } else if (profileData.plan && typeof profileData.plan === 'string' && profileData.plan.trim() !== '') {
          newPlan = profileData.plan.toLowerCase();
        }
        
        if (newPlan !== plan) {
          console.log("Focus refresh - updating plan:", { oldPlan: plan, newPlan });
          setPlan(newPlan);
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user?.id, plan]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

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
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Načítavam tvoj dashboard…</p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  const dashboardCards = [
    {
      title: "Nastavenia chatbota",
      description: "Uprav meno bota, firmu, popis a štýl komunikácie, ktorý bude používať pri odpovediach.",
      href: "/dashboard/bot-settings",
      icon: Settings,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      hoverColor: "hover:bg-emerald-500/20",
    },
    {
      title: "FAQ",
      description: "Pridaj, uprav alebo vymaž otázky a odpovede, na ktoré sa tvoj bot bude odvolávať.",
      href: "/dashboard/faq",
      icon: MessageSquare,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      hoverColor: "hover:bg-cyan-500/20",
    },
    {
      title: "Konverzácie",
      description: "Prehľad všetkých konverzácií, ktoré tvoj bot viedol s návštevníkmi tvojho webu.",
      href: "/dashboard/conversations",
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      hoverColor: "hover:bg-purple-500/20",
    },
    {
      title: "Analytics",
      description: "Štatistiky a metriky o tom, ako často a kedy ľudia používajú tvojho chatbota.",
      href: "/dashboard/analytics",
      icon: BarChart3,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      hoverColor: "hover:bg-amber-500/20",
    },
    {
      title: "Leady",
      description: "Kontakty, ktoré tvoj bot zachytil cez lead form – email, meno a poznámka.",
      href: "/dashboard/leads",
      icon: Users,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      hoverColor: "hover:bg-pink-500/20",
    },
    {
      title: "Môj bot",
      description: "Otestuj svojho chatbota priamo tu – presne tak, ako ho uvidia návštevníci tvojho webu.",
      href: "/dashboard/my-bot",
      icon: Sparkles,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      hoverColor: "hover:bg-indigo-500/20",
    },
    {
      title: "Môj účet a nastavenia",
      description: "Spravuj svoj profil, heslo a API kľúče pre integrácie.",
      href: "/dashboard/settings",
      icon: User,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      hoverColor: "hover:bg-blue-500/20",
    },
    {
      title: "Využitie a limity",
      description: "Sleduj, koľko konverzácií tvoj bot spracoval a koľko ti zostáva do limitu.",
      href: "/dashboard/usage",
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      hoverColor: "hover:bg-orange-500/20",
    },
    ...(isAdmin ? [{
      title: "Admin rozhranie",
      description: "Správa všetkých užívateľov, ich plánov, kreditov a manuálne blokovanie/aktivovanie účtov.",
      href: "/dashboard/admin",
      icon: Shield,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      hoverColor: "hover:bg-red-500/20",
    }] : []),
  ];

  return (
    <AnimatedPage>
      <OnboardingModal />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <motion.header
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20 relative">
                {loading ? (
                  <div className="h-6 w-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  "AI"
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex items-center justify-center gap-1.5 rounded-full border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 text-xs font-semibold transition-colors min-w-fit">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                    Vitaj späť
                  </div>
                  {user?.id === SUPER_ADMIN_ID && (
                    <Badge variant="outline" className="gap-1.5 border-purple-500/50 text-purple-500">
                      <Shield className="h-3 w-3" />
                      Super Admin
                    </Badge>
                  )}
                  {isAdmin && user?.id !== SUPER_ADMIN_ID && (
                    <Badge variant="outline" className="gap-1.5 border-red-500/50 text-red-500">
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Ahoj, {fullName || user?.email}
                </h1>
                <p className="text-muted-foreground mt-2">
                  Tu spravuješ svoj firemný AI chatbot – nastavenia, FAQ, históriu konverzácií a analýzy.
                </p>
              </div>
            </motion.div>
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Badge 
                key={`plan-${plan}`}
                variant="outline" 
                className="flex gap-2 px-3 py-1.5 capitalize"
              >
                <Zap className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {plan === "unlimited" ? "Unlimited" : `Chatbot plán · ${plan || "starter"}`}
                </span>
              </Badge>
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Odhlásiť sa
              </Button>
            </motion.div>
          </motion.header>

          {/* Dashboard Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {dashboardCards.map((card, index) => (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={cardSpring(index * 0.05)}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="group relative h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 overflow-hidden border-border/50">
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-500 pointer-events-none`} />
                  
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full"
                    transition={{ duration: 0.7 }}
                  />
                  
                  <CardHeader className="relative z-10">
                    <div className={`h-12 w-12 rounded-xl ${card.bgColor} ${card.hoverColor} flex items-center justify-center mb-4 transition-colors shadow-lg`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <CardTitle className="text-lg mb-2">{card.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                      <span>Otvoriť</span>
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </motion.span>
                    </div>
                  </CardContent>
                  <Link
                    href={card.href}
                    className="absolute inset-0 z-20"
                    aria-label={card.title}
                  />
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Embed Code Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Embed kód pre tvoj web</CardTitle>
                    <CardDescription>
                      Skopíruj tento kód a vlož ho do HTML svojho webu, aby sa chatbot zobrazoval.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative group">
                  <pre className="bg-slate-950/50 border border-slate-800 p-4 rounded-lg text-xs overflow-x-auto font-mono backdrop-blur-sm">
                    <code className="text-slate-300">
                      {`<script src="https://ai-social-agent-frontend.vercel.app/embed.js" data-bot-id="${user?.id ?? "TVOJ_BOT_ID"}"></script>`}
                    </code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `<script src="https://ai-social-agent-frontend.vercel.app/embed.js" data-bot-id="${user?.id ?? "TVOJ_BOT_ID"}"></script>`
                      );
                    }}
                  >
                    Kopírovať
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Vlož tento kód pred uzatvárajúci tag <code className="text-xs bg-muted px-1 py-0.5 rounded">{"</body>"}</code> na tvojej webovej stránke
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
}
