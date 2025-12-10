"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import Link from "next/link";

type UsageStats = {
  currentMonth: number;
  limit: number;
  percentage: number;
  daysRemaining: number;
  avgPerDay: number;
  projectedEndOfMonth: number;
};

const PLAN_LIMITS: Record<string, number> = {
  starter: 1000,
  pro: 10000,
  agency: 999999,
};

export default function UsagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("starter");

  useEffect(() => {
    const loadUsage = async () => {
      setLoading(true);
      setError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.push("/login");
        return;
      }

      const userId = userData.user.id;

      try {
        // Načítanie profilu používateľa z users_profile (cez API endpoint pre lepší prístup)
        const apiResponse = await fetch(`/api/user/plan?userId=${encodeURIComponent(userId)}`);
        let userPlan = "starter";
        let creditsUsed = 0;
        let createdAt: string | null = null;
        let lastCreditReset: string | null = null;

        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          userPlan = apiData.plan || "starter";
          
          // Použij dáta z API endpointu (už obsahuje všetko potrebné)
          const profileData = apiData.profileData;
          creditsUsed = profileData?.credits_used_this_month ?? 0;
          createdAt = profileData?.created_at || null;
          lastCreditReset = profileData?.last_credit_reset || null;
        } else {
          // Fallback: skús načítať priamo z DB (môže zlyhať kvôli RLS)
          const { data: profileData, error: profileError } = await supabase
            .from("users_profile")
            .select("plan, credits_used_this_month, created_at, last_credit_reset")
            .eq("id", userId)
            .single();

          if (profileError) {
            console.error("Failed to load profile from DB:", profileError);
            throw new Error("Nepodarilo sa načítať profil používateľa.");
          }

          userPlan = profileData?.plan || "starter";
          creditsUsed = profileData?.credits_used_this_month ?? 0;
          createdAt = profileData?.created_at || null;
          lastCreditReset = profileData?.last_credit_reset || null;
        }

        setPlan(userPlan);
        const limit = PLAN_LIMITS[userPlan] || 1000;

        const now = new Date();
        
        // Určenie dátumu, od ktorého sa počíta 30-dňový cyklus
        const resetBaseDate = lastCreditReset 
          ? new Date(lastCreditReset)
          : (createdAt ? new Date(createdAt) : now);
        
        // Vypočítaj, koľko dní uplynulo od posledného resetu (alebo od vytvorenia účtu)
        const daysSinceReset = Math.floor(
          (now.getTime() - resetBaseDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Dní do ďalšieho resetu (30-dňový cyklus)
        const daysRemaining = Math.max(0, 30 - (daysSinceReset % 30));

        // Priemer za deň (od začiatku cyklu)
        const daysPassed = Math.max(1, daysSinceReset % 30 || 1);
        const avgPerDay = creditsUsed / daysPassed;

        // Projekcia na koniec cyklu (30 dní)
        const projectedEndOfCycle = Math.ceil(avgPerDay * 30);

        const percentage = limit > 0 ? (creditsUsed / limit) * 100 : 0;

        setUsage({
          currentMonth: creditsUsed,
          limit,
          percentage: Math.min(percentage, 100),
          daysRemaining,
          avgPerDay: Math.round(avgPerDay * 10) / 10,
          projectedEndOfMonth: projectedEndOfCycle,
        });
      } catch (err) {
        console.error("Usage load error:", err);
        setError("Nepodarilo sa načítať štatistiky použitia.");
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [router]);

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
            <p className="text-sm text-muted-foreground">Načítavam štatistiky…</p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  if (!usage) {
    return null;
  }

  const isNearLimit = usage.percentage >= 80;
  const isOverLimit = usage.percentage >= 100;

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <motion.header
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <Badge variant="secondary" className="mb-2 gap-1.5">
                <TrendingUp className="h-3 w-3" />
                Použitie a limity
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Použitie a limity
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Sleduj, koľko kreditov máš použitých a koľko ti ešte zostáva. Kredity sa resetujú každých 30 dní od založenia účtu.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Späť
              </Link>
            </Button>
          </motion.header>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Main Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      Použité kredity
                    </CardTitle>
                    <CardDescription>
                      {usage.currentMonth.toLocaleString()} / {usage.limit.toLocaleString()} kreditov
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {plan}
                  </Badge>
                </div>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {usage.percentage.toFixed(1)}% použité
                  </span>
                  {isOverLimit ? (
                    <span className="text-destructive font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Limit prekročený
                    </span>
                  ) : isNearLimit ? (
                    <span className="text-yellow-500 font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Blížiš sa limitu
                    </span>
                  ) : (
                    <span className="text-primary">
                      {usage.limit - usage.currentMonth} zostáva
                    </span>
                  )}
                </div>
                <Progress
                  value={usage.percentage}
                  className={`h-3 ${
                    isOverLimit
                      ? "[&>div]:bg-destructive"
                      : isNearLimit
                      ? "[&>div]:bg-yellow-500"
                      : ""
                  }`}
                />
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-border/50 hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Priemer za deň</p>
                    <p className="text-3xl font-bold">{usage.avgPerDay}</p>
                    <p className="text-xs text-muted-foreground">konverzácií denne</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50 hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Dní do resetu kreditov
                    </p>
                    <p className="text-3xl font-bold">{usage.daysRemaining}</p>
                    <p className="text-xs text-muted-foreground">dní zostáva</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border-border/50 hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Projekcia na koniec cyklu</p>
                    <p className="text-3xl font-bold">
                      {usage.projectedEndOfMonth.toLocaleString()}
                    </p>
                    <p className="text-xs">
                      {usage.projectedEndOfMonth > usage.limit ? (
                        <span className="text-destructive">Prekročíš limit</span>
                      ) : (
                        <span className="text-primary">V limite</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Warning */}
          {isNearLimit && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-500 mb-1">
                    {usage.percentage >= 100
                      ? "Dosiahol si limit kreditov"
                      : "Blížiš sa limitu kreditov"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {usage.percentage >= 100
                      ? "Zváž upgrade na vyšší plán alebo počkaj na reset kreditov."
                      : `Zostáva ti ${usage.limit - usage.currentMonth} kreditov. Zváž upgrade na vyšší plán, ak potrebuješ viac.`}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/#pricing">Pozrieť plány</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Poznámka:</strong> Kredity sa resetujú každých 30 dní od založenia účtu (nie kalendárny mesiac). Ak dosiahneš limit, chatbot prestane odpovedať až do resetu kreditov alebo do upgrade-u na vyšší plán.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
}
