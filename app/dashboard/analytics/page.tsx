"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type ChatLog = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
};

type DayBucket = {
  key: string; // YYYY-MM-DD
  label: string; // 05.12
  count: number;
};

type HourBucket = {
  hour: number; // 0-23
  label: string; // 08:00
  count: number;
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
};

const WEEKDAY_LABELS = ["Ne", "Po", "Ut", "St", "Št", "Pi", "So"];

export default function AnalyticsPage() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
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

      const { data, error } = await supabase
        .from("chat_logs")
        .select("id, question, answer, created_at")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError("Nepodarilo sa načítať konverzácie.");
      } else {
        setLogs(((data as ChatLog[]) ?? []).map((row) => ({
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
    const weekdayMap = new Map<number, number>(); // 0-6
    const hourMap = new Map<number, number>(); // 0-23

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

      const isoDate = created.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!firstDate || isoDate < firstDate) firstDate = isoDate;
      if (!lastDate || isoDate > lastDate) lastDate = isoDate;

      const diffDays = (nowTime - createdTime) / msDay;
      if (diffDays <= 7) last7 += 1;
      if (diffDays <= 30) last30 += 1;

      const weekday = created.getDay(); // 0 = Ne, 1 = Po, ...
      weekdayMap.set(weekday, (weekdayMap.get(weekday) ?? 0) + 1);

      const hour = created.getHours(); // 0-23
      hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);

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
          count: 0,
        });
      }
    }

    // per-hour buckets (0–23)
    const perHour: HourBucket[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const count = hourMap.get(hour) ?? 0;
      const label = `${hour.toString().padStart(2, "0")}:00`;
      perHour.push({ hour, label, count });
    }

    // aktívne dni + priemer
    const activeDaysCount = perDay.filter((d) => d.count > 0).length;
    const avgPerActiveDay =
      activeDaysCount > 0 ? Number((total / activeDaysCount).toFixed(1)) : 0;

    // najvyťaženejší konkrétny deň
    let busiestDayLabel: string | null = null;
    let busiestDayCount = 0;
    for (const d of perDay) {
      if (d.count > busiestDayCount) {
        busiestDayCount = d.count;
        busiestDayLabel = d.label;
      }
    }

    // najvyťaženejší deň v týždni
    let busiestWeekdayLabel: string | null = null;
    let busiestWeekdayCount = 0;
    weekdayMap.forEach((count, weekday) => {
      if (count > busiestWeekdayCount) {
        busiestWeekdayCount = count;
        busiestWeekdayLabel = WEEKDAY_LABELS[weekday];
      }
    });

    // najvyťaženejšia hodina dňa
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
    };
  }, [logs]);

  const maxPerDay = stats.perDay.reduce(
    (max, d) => (d.count > max ? d.count : max),
    0
  );

  const maxPerHour = stats.perHour.reduce(
    (max, h) => (h.count > max ? h.count : max),
    0
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-slate-400">Načítavam štatistiky…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Analytics bota</h1>
            <p className="text-xs text-slate-400">
              Prehľad o tom, ako často a kedy ľudia používajú tvojho AI chatbota.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            ← Späť na dashboard
          </Link>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        {logs.length === 0 ? (
          <p className="text-xs text-slate-400">
            Zatiaľ nemáš žiadne konverzácie. Najprv skús komunikáciu s botom na
            hlavnej stránke a potom sa sem vráť.
          </p>
        ) : (
          <>
            {/* Top cards – základné metriky */}
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-[11px] text-slate-400 mb-1">
                  Celkový počet konverzácií
                </p>
                <p className="text-2xl font-semibold">{stats.total}</p>
                {stats.firstDate && stats.lastDate && (
                  <p className="text-[11px] text-slate-500 mt-2">
                    Od {stats.firstDate} do {stats.lastDate}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-[11px] text-slate-400 mb-1">
                  Posledných 7 dní
                </p>
                <p className="text-2xl font-semibold">{stats.last7}</p>
                <p className="text-[11px] text-slate-500 mt-2">
                  Aktivita za posledný týždeň.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-[11px] text-slate-400 mb-1">
                  Posledných 30 dní
                </p>
                <p className="text-2xl font-semibold">{stats.last30}</p>
                <p className="text-[11px] text-slate-500 mt-2">
                  Vhodné na mesačný report.
                </p>
              </div>
            </section>

            {/* Detailnejšie metriky */}
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-[11px] text-slate-400 mb-1">
                  Priemer na aktívny deň
                </p>
                <p className="text-2xl font-semibold">
                  {stats.avgPerActiveDay}
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                  Počet otázok v dňoch, keď bot reálne niečo riešil.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-[11px] text-slate-400 mb-1">
                  Počet aktívnych dní
                </p>
                <p className="text-2xl font-semibold">
                  {stats.activeDaysCount}
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                  V koľkých dňoch prišla aspoň jedna otázka.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-[11px] text-slate-400 mb-1">
                  Najvyťaženejší deň v týždni
                </p>
                <p className="text-2xl font-semibold">
                  {stats.busiestWeekdayLabel ?? "-"}
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                  Deň, keď sa tvoj bot používa najčastejšie (podľa všetkých
                  konverzácií).
                </p>
              </div>
            </section>

            {/* Graf – sparkline + detail za posledných 14 dní */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm md:text-base font-semibold">
                    Posledných 14 dní
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Jednoduchý „sparkline“ graf, ktorý ukazuje, ako používanie
                    bota kolíše v čase.
                  </p>
                </div>
                {stats.busiestDayLabel && (
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">
                      Najaktívnejší deň
                    </p>
                    <p className="text-xs text-emerald-400 font-semibold">
                      {stats.busiestDayLabel} · {stats.busiestDayCount}{" "}
                      konverzácií
                    </p>
                  </div>
                )}
              </div>

              {/* Sparkline graf */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-4">
                <div className="h-28 flex items-end gap-[3px]">
                  {stats.perDay.map((day) => {
                    const ratio =
                      maxPerDay > 0 ? (day.count / maxPerDay) * 100 : 0;

                    return (
                      <div
                        key={day.key}
                        className="group flex-1 flex flex-col items-center justify-end"
                      >
                        <div className="relative w-full flex-1 flex items-end">
                          <div
                            className="w-full rounded-full bg-emerald-500/80 group-hover:bg-emerald-400 transition-all"
                            style={{
                              height: `${ratio || 5}%`,
                              minHeight: day.count > 0 ? "8%" : "0%",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500">
                  {stats.perDay.map((day, idx) => (
                    <span key={day.key} className="flex-1 text-center">
                      {idx % 2 === 0 ? day.label : ""}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tabuľkový prehľad – textový */}
              <div className="space-y-1 mt-1">
                {stats.perDay.map((day) => (
                  <div
                    key={day.key}
                    className="flex items-center gap-3 text-[11px]"
                  >
                    <span className="w-12 text-right text-slate-400">
                      {day.label}
                    </span>
                    <div className="flex-1 h-[3px] rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-[3px] rounded-full bg-emerald-500/70"
                        style={{
                          width:
                            maxPerDay > 0
                              ? `${(day.count / maxPerDay) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="w-6 text-right text-slate-300">
                      {day.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Rozloženie podľa hodiny dňa */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm md:text-base font-semibold">
                    Rozloženie podľa hodiny dňa
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Ukazuje, v ktoré hodiny počas dňa sa tvoj bot používa
                    najčastejšie.
                  </p>
                </div>
                {stats.busiestHourLabel && (
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">
                      Najaktívnejšia hodina
                    </p>
                    <p className="text-xs text-emerald-400 font-semibold">
                      {stats.busiestHourLabel} · {stats.busiestHourCount}{" "}
                      konverzácií
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {stats.perHour.map((bucket) => {
                  const ratio =
                    maxPerHour > 0 ? (bucket.count / maxPerHour) * 100 : 0;

                  return (
                    <div
                      key={bucket.hour}
                      className="flex items-center gap-3 text-[11px]"
                    >
                      <span className="w-12 text-right text-slate-400">
                        {bucket.label}
                      </span>
                      <div className="flex-1 h-[3px] rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-[3px] rounded-full bg-emerald-500/70"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-slate-300">
                        {bucket.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}