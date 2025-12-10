"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, TrendingUp, Users, Clock, Calendar, MessageSquare, Zap, BarChart3 } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ChatLog = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  category?: string | null;
};

type Lead = {
  id: string;
  email: string;
  name: string | null;
  note: string | null;
  created_at: string;
};

type DayBucket = {
  key: string;
  label: string;
  count: number;
  date: string;
};

type HourBucket = {
  hour: number;
  label: string;
  count: number;
};

type CategoryBucket = {
  key: string;
  label: string;
  count: number;
  percentage: number;
};

type Stats = {
  total: number;
  last7: number;
  last30: number;
  firstDate: string | null;
  lastDate: string | null;
  perDay: DayBucket[];
  perHour: HourBucket[];
  activeDaysCount: number;
  avgPerActiveDay: number;
  busiestDayLabel: string | null;
  busiestDayCount: number;
  busiestWeekdayLabel: string | null;
  busiestHourLabel: string | null;
  busiestHourCount: number;
  categories: CategoryBucket[];
};

const WEEKDAY_LABELS = ["Ne", "Po", "Ut", "St", "Št", "Pi", "So"];

// Farba pre grafy
const CHART_COLORS = {
  primary: "#10b981",
  secondary: "#06b6d4",
  accent: "#8b5cf6",
  gradient: {
    from: "#10b981",
    to: "#06b6d4",
  },
};

const CATEGORY_COLORS = [
  "#10b981",
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
];

export default function AnalyticsPage() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Musíš byť prihlásený, aby si videl štatistiky.");
        setLoading(false);
        return;
      }

      const [logsRes, leadsRes] = await Promise.all([
        supabase
          .from("chat_logs")
          .select("id, question, answer, created_at, category")
          .eq("owner_user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("leads")
          .select("id, email, name, note, created_at")
          .eq("owner_user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (logsRes.error) {
        console.error(logsRes.error);
        setError("Nepodarilo sa načítať konverzácie.");
      } else {
        setLogs(((logsRes.data as ChatLog[]) ?? []).map((row) => ({
          ...row,
          created_at: row.created_at,
        })));
      }

      if (leadsRes.error) {
        console.error(leadsRes.error);
      } else {
        setLeads(((leadsRes.data as Lead[]) ?? []).map((row) => ({
          ...row,
          created_at: row.created_at,
        })));
      }

      setLoading(false);
    };

    load();
  }, []);

  const stats: Stats = useMemo(() => {
    if (logs.length === 0) {
      return {
        total: 0,
        last7: 0,
        last30: 0,
        firstDate: null,
        lastDate: null,
        perDay: [],
        perHour: [],
        activeDaysCount: 0,
        avgPerActiveDay: 0,
        busiestDayLabel: null,
        busiestDayCount: 0,
        busiestWeekdayLabel: null,
        busiestHourLabel: null,
        busiestHourCount: 0,
        categories: [],
      };
    }

    const now = new Date();
    const nowTime = now.getTime();
    const msDay = 24 * 60 * 60 * 1000;

    let total = logs.length;
    let last7 = 0;
    let last30 = 0;

    let firstDate: string | null = null;
    let lastDate: string | null = null;

    const dayMap = new Map<string, DayBucket>();
    const weekdayMap = new Map<number, number>();
    const hourMap = new Map<number, number>();
    const categoriesMap = new Map<string, number>();

    const start14 = new Date(now);
    start14.setDate(start14.getDate() - 13);
    const start14Time = new Date(
      start14.getFullYear(),
      start14.getMonth(),
      start14.getDate()
    ).getTime();

    for (const log of logs) {
      const created = new Date(log.created_at);
      const createdTime = created.getTime();

      const isoDate = created.toISOString().slice(0, 10);
      if (!firstDate || isoDate < firstDate) firstDate = isoDate;
      if (!lastDate || isoDate > lastDate) lastDate = isoDate;

      const diffDays = (nowTime - createdTime) / msDay;
      if (diffDays <= 7) last7 += 1;
      if (diffDays <= 30) last30 += 1;

      const weekday = created.getDay();
      weekdayMap.set(weekday, (weekdayMap.get(weekday) ?? 0) + 1);

      const hour = created.getHours();
      hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);

      const categoryKey =
        (log.category && log.category.trim()) || "Nezaradené";
      categoriesMap.set(categoryKey, (categoriesMap.get(categoryKey) ?? 0) + 1);

      const dayKey = isoDate;
      const dayStart = new Date(
        created.getFullYear(),
        created.getMonth(),
        created.getDate()
      ).getTime();

      if (dayStart >= start14Time) {
        if (!dayMap.has(dayKey)) {
          dayMap.set(dayKey, {
            key: dayKey,
            label: created.toLocaleDateString("sk-SK", {
              day: "2-digit",
              month: "2-digit",
            }),
            date: isoDate,
            count: 0,
          });
        }
        const bucket = dayMap.get(dayKey)!;
        bucket.count += 1;
      }
    }

    const perDay: DayBucket[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const existing = dayMap.get(key);
      if (existing) {
        perDay.push(existing);
      } else {
        perDay.push({
          key,
          label: d.toLocaleDateString("sk-SK", {
            day: "2-digit",
            month: "2-digit",
          }),
          date: key,
          count: 0,
        });
      }
    }

    const perHour: HourBucket[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const count = hourMap.get(hour) ?? 0;
      const label = `${hour.toString().padStart(2, "0")}:00`;
      perHour.push({ hour, label, count });
    }

    const categories: CategoryBucket[] = [];
    categoriesMap.forEach((count, key) => {
      const percentage = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
      categories.push({
        key,
        label: key,
        count,
        percentage,
      });
    });
    categories.sort((a, b) => b.count - a.count);

    const activeDaysCount = perDay.filter((d) => d.count > 0).length;
    const avgPerActiveDay =
      activeDaysCount > 0 ? Number((total / activeDaysCount).toFixed(1)) : 0;

    let busiestDayLabel: string | null = null;
    let busiestDayCount = 0;
    for (const d of perDay) {
      if (d.count > busiestDayCount) {
        busiestDayCount = d.count;
        busiestDayLabel = d.label;
      }
    }

    let busiestWeekdayLabel: string | null = null;
    let busiestWeekdayCount = 0;
    weekdayMap.forEach((count, weekday) => {
      if (count > busiestWeekdayCount) {
        busiestWeekdayCount = count;
        busiestWeekdayLabel = WEEKDAY_LABELS[weekday];
      }
    });

    let busiestHourLabel: string | null = null;
    let busiestHourCount = 0;
    for (const bucket of perHour) {
      if (bucket.count > busiestHourCount) {
        busiestHourCount = bucket.count;
        busiestHourLabel = bucket.label;
      }
    }

    return {
      total,
      last7,
      last30,
      firstDate,
      lastDate,
      perDay,
      perHour,
      activeDaysCount,
      avgPerActiveDay,
      busiestDayLabel,
      busiestDayCount,
      busiestWeekdayLabel,
      busiestHourLabel,
      busiestHourCount,
      categories,
    };
  }, [logs]);

  const leadsStats = useMemo(() => {
    if (leads.length === 0) {
      return {
        totalLeads: 0,
        leadsLast30: 0,
        conversion30: 0,
      };
    }

    const now = new Date();
    const nowTime = now.getTime();
    const msDay = 24 * 60 * 60 * 1000;

    let leadsLast30 = 0;
    for (const lead of leads) {
      const created = new Date(lead.created_at);
      const diffDays = (nowTime - created.getTime()) / msDay;
      if (diffDays <= 30) {
        leadsLast30 += 1;
      }
    }

    const totalLeads = leads.length;
    const baseForConversion = stats.last30 > 0 ? stats.last30 : stats.total;
    const conversion30 =
      baseForConversion > 0
        ? Number(((leadsLast30 / baseForConversion) * 100).toFixed(1))
        : 0;

    return {
      totalLeads,
      leadsLast30,
      conversion30,
    };
  }, [leads, stats.last30, stats.total]);

  const handleExport = () => {
    const headers = [
      "Dátum",
      "Celkový počet",
      "Posledných 7 dní",
      "Posledných 30 dní",
      "Priemer na deň",
      "Aktívne dni",
      "Najaktívnejší deň",
      "Najaktívnejšia hodina",
    ];
    const rows = [
      [
        new Date().toLocaleDateString("sk-SK"),
        stats.total.toString(),
        stats.last7.toString(),
        stats.last30.toString(),
        stats.avgPerActiveDay.toString(),
        stats.activeDaysCount.toString(),
        stats.busiestDayLabel || "-",
        stats.busiestHourLabel || "-",
      ],
    ];
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Custom Tooltip pre grafy
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl backdrop-blur-sm">
          <p className="text-sm font-semibold text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold text-white">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
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
            <p className="text-sm text-muted-foreground">Načítavam štatistiky…</p>
          </motion.div>
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
            className="flex items-center justify-between gap-4 pb-6 border-b"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <Badge variant="secondary" className="mb-2">
                <BarChart3 className="h-3 w-3 mr-1.5" />
                Analytics bota
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight">Analytics bota</h1>
              <p className="text-muted-foreground mt-2">
                Prehľad o tom, ako často, kedy a s akým výsledkom ľudia používajú tvojho AI chatbota.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {logs.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Späť
                </Link>
              </Button>
            </div>
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

          {logs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Zatiaľ nemáš žiadne konverzácie. Najprv skús komunikáciu s botom na hlavnej stránke a potom sa sem vráť.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Top Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Celkový počet",
                    value: stats.total,
                    icon: MessageSquare,
                    color: "text-emerald-500",
                    bgColor: "bg-emerald-500/10",
                  },
                  {
                    label: "Posledných 7 dní",
                    value: stats.last7,
                    icon: Calendar,
                    color: "text-cyan-500",
                    bgColor: "bg-cyan-500/10",
                  },
                  {
                    label: "Posledných 30 dní",
                    value: stats.last30,
                    icon: TrendingUp,
                    color: "text-purple-500",
                    bgColor: "bg-purple-500/10",
                  },
                  {
                    label: "Celkový počet leadov",
                    value: leadsStats.totalLeads,
                    icon: Users,
                    color: "text-amber-500",
                    bgColor: "bg-amber-500/10",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-border/50 hover:border-primary/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Secondary Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    label: "Konverzný pomer",
                    value: `${leadsStats.conversion30}%`,
                    icon: Zap,
                    description: `${leadsStats.leadsLast30} leadov z ${stats.last30} konverzácií`,
                  },
                  {
                    label: "Priemer na aktívny deň",
                    value: stats.avgPerActiveDay,
                    icon: Clock,
                    description: `${stats.activeDaysCount} aktívnych dní`,
                  },
                  {
                    label: "Najaktívnejší deň",
                    value: stats.busiestWeekdayLabel || "-",
                    icon: Calendar,
                    description: stats.busiestHourLabel
                      ? `Najviac o ${stats.busiestHourLabel}`
                      : "Zatiaľ žiadne dáta",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <stat.icon className="h-5 w-5 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                        <p className="text-2xl font-bold mb-1">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* 14 Days Line Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Posledných 14 dní</CardTitle>
                        <CardDescription>
                          Trend používania chatbota v posledných 14 dňoch
                        </CardDescription>
                      </div>
                      {stats.busiestDayLabel && (
                        <Badge variant="outline" className="gap-2">
                          <TrendingUp className="h-3 w-3" />
                          {stats.busiestDayLabel} · {stats.busiestDayCount} konverzácií
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={stats.perDay}>
                        <defs>
                          <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                        <XAxis
                          dataKey="label"
                          stroke="#9ca3af"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke={CHART_COLORS.primary}
                          strokeWidth={2}
                          fill="url(#colorConversations)"
                          name="Konverzácie"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Hourly Distribution Bar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Rozloženie podľa hodiny dňa</CardTitle>
                        <CardDescription>
                          V ktoré hodiny počas dňa sa tvoj bot používa najčastejšie
                        </CardDescription>
                      </div>
                      {stats.busiestHourLabel && (
                        <Badge variant="outline" className="gap-2">
                          <Clock className="h-3 w-3" />
                          {stats.busiestHourLabel} · {stats.busiestHourCount} konverzácií
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.perHour}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                        <XAxis
                          dataKey="label"
                          stroke="#9ca3af"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="count"
                          fill={CHART_COLORS.primary}
                          radius={[8, 8, 0, 0]}
                          name="Konverzácie"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Categories - Pie Chart + Bar Chart */}
              {stats.categories.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Pie Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Kategórie otázok</CardTitle>
                            <CardDescription>
                              Rozdelenie podľa typu otázok
                            </CardDescription>
                          </div>
                          <Badge variant="outline">{stats.categories.length} kategórií</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={stats.categories}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry: any) => `${entry.name}: ${entry.percent ? (entry.percent * 100).toFixed(1) : 0}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {stats.categories.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Categories Bar Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <Card>
                      <CardHeader>
                        <div>
                          <CardTitle>Top kategórie</CardTitle>
                          <CardDescription>
                            Najčastejšie typy otázok v poradí
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={stats.categories.slice(0, 6)}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                            <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                            <YAxis
                              dataKey="label"
                              type="category"
                              stroke="#9ca3af"
                              fontSize={11}
                              width={100}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                              dataKey="count"
                              fill={CHART_COLORS.secondary}
                              radius={[0, 8, 8, 0]}
                              name="Počet"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
