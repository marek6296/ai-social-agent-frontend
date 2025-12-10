"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  CreditCard, 
  Ban, 
  CheckCircle, 
  Search,
  RefreshCw,
  TrendingUp,
  Calendar
} from "lucide-react";
import Link from "next/link";

const SUPER_ADMIN_ID = "faeb1920-35fe-47be-a169-1393591cc3e4";

type User = {
  id: string;
  email: string;
  created_at: string;
  plan: "starter" | "pro" | "agency";
  is_active: boolean;
  is_admin: boolean;
  credits_used_this_month: number;
  last_credit_reset: string;
};

const PLAN_LIMITS: Record<string, number> = {
  starter: 1000,
  pro: 10000,
  agency: 999999,
};

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  pro: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  agency: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Musíš byť prihlásený.");
        setLoading(false);
        return;
      }

      // Kontrola admin práv
      const userIsAdmin = user.id === SUPER_ADMIN_ID;
      setIsAdmin(userIsAdmin);

      if (!userIsAdmin) {
        // Skús načítať z users_profile
        const { data: profile } = await supabase
          .from("users_profile")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (profile?.is_admin) {
          setIsAdmin(true);
        } else {
          setError("Nemáš oprávnenie na prístup k admin rozhraniu.");
          setLoading(false);
          return;
        }
      }

      await loadUsers();
    };

    checkAdminAndLoad();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Musíš byť prihlásený.");
        return;
      }

      const res = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Nepodarilo sa načítať userov.");
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Load users error:", err);
      setError("Nepodarilo sa načítať userov.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setUpdating(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Musíš byť prihlásený.");
        return;
      }

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          is_active: !currentStatus,
        }),
      });

      if (!res.ok) {
        throw new Error("Nepodarilo sa aktualizovať užívateľa.");
      }

      await loadUsers();
    } catch (err) {
      console.error("Toggle active error:", err);
      setError("Nepodarilo sa aktualizovať užívateľa.");
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    // Super admin nemôže byť zmenený
    if (userId === SUPER_ADMIN_ID) {
      setError("Super admin nemôže byť zmenený.");
      return;
    }

    setUpdating(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Musíš byť prihlásený.");
        return;
      }

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          is_admin: !currentIsAdmin,
        }),
      });

      if (!res.ok) {
        throw new Error("Nepodarilo sa zmeniť admin práva.");
      }

      await loadUsers();
    } catch (err) {
      console.error("Toggle admin error:", err);
      setError("Nepodarilo sa zmeniť admin práva.");
    } finally {
      setUpdating(null);
    }
  };

  const handleChangePlan = async (userId: string, newPlan: "starter" | "pro" | "agency") => {
    setUpdating(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Musíš byť prihlásený.");
        return;
      }

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          plan: newPlan,
        }),
      });

      if (!res.ok) {
        throw new Error("Nepodarilo sa zmeniť plán.");
      }

      await loadUsers();
    } catch (err) {
      console.error("Change plan error:", err);
      setError("Nepodarilo sa zmeniť plán.");
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sk-SK", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    blocked: users.filter((u) => !u.is_active).length,
    starter: users.filter((u) => u.plan === "starter").length,
    pro: users.filter((u) => u.plan === "pro").length,
    agency: users.filter((u) => u.plan === "agency").length,
    totalCredits: users.reduce((sum, u) => sum + u.credits_used_this_month, 0),
  };

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
            <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" style={{ animation: 'spin 1s linear infinite' }} />
            <p className="text-sm text-muted-foreground">Načítavam admin rozhranie…</p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  if (!isAdmin) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                Prístup zamietnutý
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Nemáš oprávnenie na prístup k admin rozhraniu.
              </p>
              <Button asChild>
                <Link href="/dashboard">Späť na Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <motion.header
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <Badge variant="secondary" className="mb-2 gap-1.5">
                <Shield className="h-3 w-3" />
                Admin rozhranie
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Správa užívateľov
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Prehľad všetkých užívateľov, ich plánov, spotreby kreditov a možnosť manuálneho blokovania/aktivovania účtov.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadUsers} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Obnoviť
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Späť
                </Link>
              </Button>
            </div>
          </motion.header>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
          >
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Celkom</p>
                </div>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">Aktívnych</p>
                </div>
                <p className="text-2xl font-bold text-emerald-500">{stats.active}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Ban className="h-4 w-4 text-destructive" />
                  <p className="text-xs text-muted-foreground">Blokovaných</p>
                </div>
                <p className="text-2xl font-bold text-destructive">{stats.blocked}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={PLAN_COLORS.starter}>
                    Starter
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{stats.starter}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={PLAN_COLORS.pro}>
                    Pro
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{stats.pro}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={PLAN_COLORS.agency}>
                    Agency
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{stats.agency}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Kredity</p>
                </div>
                <p className="text-2xl font-bold text-primary">{stats.totalCredits.toLocaleString()}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Vyhľadať podľa emailu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Users List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  Užívatelia ({filteredUsers.length})
                </CardTitle>
                <CardDescription>
                  Prehľad všetkých registrovaných užívateľov a ich nastavení
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Žiadni užívatelia</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map((user, index) => {
                      const limit = PLAN_LIMITS[user.plan] || 1000;
                      const percentage = limit > 0 ? (user.credits_used_this_month / limit) * 100 : 0;
                      
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className={`border-border/50 ${!user.is_active ? "opacity-60" : ""}`}>
                            <CardContent className="p-6">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <p className="font-semibold text-lg">{user.email}</p>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <Calendar className="h-3 w-3" />
                                        Registrovaný: {formatDate(user.created_at)}
                                      </p>
                                    </div>
                                    {user.is_admin && (
                                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Admin
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className={PLAN_COLORS[user.plan]}>
                                      {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                                    </Badge>
                                    {user.is_active ? (
                                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Aktívny
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                        <Ban className="h-3 w-3 mr-1" />
                                        Blokovaný
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">Kredity tento mesiac:</span>
                                      <span className="font-semibold">
                                        {user.credits_used_this_month.toLocaleString()} / {limit.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-full transition-all ${
                                          percentage >= 100
                                            ? "bg-destructive"
                                            : percentage >= 80
                                            ? "bg-amber-500"
                                            : "bg-primary"
                                        }`}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2 md:min-w-[200px]">
                                  {(user.is_admin || user.id === SUPER_ADMIN_ID) ? (
                                    <div className="space-y-2">
                                      <Label className="text-xs">Plán</Label>
                                      <Badge variant="outline" className="w-full justify-center py-2 border-primary/50 bg-primary/10 text-primary">
                                        Unlimited
                                      </Badge>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <Label className="text-xs">Plán</Label>
                                      <div className="grid grid-cols-3 gap-2">
                                        {(["starter", "pro", "agency"] as const).map((plan) => (
                                          <button
                                            key={plan}
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              if (updating !== user.id) {
                                                handleChangePlan(user.id, plan);
                                              }
                                            }}
                                            disabled={updating === user.id}
                                            className={`relative px-2 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all cursor-pointer overflow-hidden ${
                                              user.plan === plan
                                                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                                                : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                          >
                                            {user.plan === plan && (
                                              <div className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-primary" />
                                            )}
                                            {user.plan === plan && (
                                              <div className="absolute top-0.5 right-0.5 text-white text-[8px] font-bold z-10">
                                                ✓
                                              </div>
                                            )}
                                            {plan.charAt(0).toUpperCase()}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">Admin</span>
                                    </div>
                                    {user.id === SUPER_ADMIN_ID ? (
                                      <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-500">
                                        Super Admin
                                      </Badge>
                                    ) : (
                                      <Switch
                                        checked={user.is_admin}
                                        onCheckedChange={() => {
                                          if (updating !== user.id) {
                                            handleToggleAdmin(user.id, user.is_admin);
                                          }
                                        }}
                                        disabled={updating === user.id}
                                      />
                                    )}
                                  </div>

                                  <Button
                                    type="button"
                                    variant={user.is_active ? "destructive" : "default"}
                                    size="sm"
                                    onClick={() => handleToggleActive(user.id, user.is_active)}
                                    disabled={updating === user.id}
                                    className="gap-2"
                                  >
                                    {updating === user.id ? (
                                      <>
                                        <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                                        Čakaj...
                                      </>
                                    ) : user.is_active ? (
                                      <>
                                        <Ban className="h-4 w-4" />
                                        Blokovať
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4" />
                                        Aktivovať
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
}

