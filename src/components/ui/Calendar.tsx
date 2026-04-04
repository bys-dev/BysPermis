"use client";

import { useState, useMemo, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────
export interface CalendarEvent {
  date: string; // ISO date string or YYYY-MM-DD
  title: string;
  color?: string;
  id: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onDayClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

// ─── Helpers ──────────────────────────────────────────────
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0 in our grid (ISO week)
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6; // Sunday

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month fill
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  // Next month fill (to complete last row)
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
  }

  return days;
}

// ─── Component ────────────────────────────────────────────
export function Calendar({ events, onDayClick, onEventClick }: CalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // Group events by date key
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const d = new Date(ev.date);
      const key = toDateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events]);

  const days = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const goToPrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }, [today]);

  return (
    <div className="w-full">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">
          {MONTHS[currentMonth]} {currentYear}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors text-gray-400 hover:text-white"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={goToPrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors text-gray-400 hover:text-white"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}
          >
            &larr;
          </button>
          <button
            onClick={goToNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors text-gray-400 hover:text-white"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}
          >
            &rarr;
          </button>
        </div>
      </div>

      {/* Desktop: Grid view */}
      <div className="hidden sm:block">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          {days.map(({ date, isCurrentMonth }, i) => {
            const key = toDateKey(date);
            const dayEvents = eventsByDate[key] || [];
            const isToday = isSameDay(date, today);

            return (
              <button
                key={i}
                onClick={() => onDayClick?.(date)}
                className={`
                  relative min-h-[90px] p-2 text-left transition-colors
                  ${isCurrentMonth ? "hover:bg-white/10" : "opacity-40"}
                `}
                style={{ background: isCurrentMonth ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.15)" }}
              >
                <span
                  className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium
                    ${isToday ? "bg-blue-600 text-white" : isCurrentMonth ? "text-gray-300" : "text-gray-600"}
                  `}
                >
                  {date.getDate()}
                </span>
                {/* Events */}
                <div className="mt-1 space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(ev);
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer hover:brightness-125 transition-all"
                      style={{ backgroundColor: `${ev.color ?? "#2563EB"}20`, color: ev.color ?? "#2563EB" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.color ?? "#2563EB" }} />
                      <span className="truncate">{ev.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-gray-500 px-1.5">
                      +{dayEvents.length - 3} de plus
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: List view */}
      <div className="sm:hidden space-y-2">
        {days
          .filter(({ isCurrentMonth }) => isCurrentMonth)
          .map(({ date }, i) => {
            const key = toDateKey(date);
            const dayEvents = eventsByDate[key] || [];
            const isToday = isSameDay(date, today);

            if (dayEvents.length === 0 && !isToday) return null;

            return (
              <div
                key={i}
                className="rounded-lg border p-3"
                style={{ borderColor: isToday ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
              >
                <button
                  onClick={() => onDayClick?.(date)}
                  className="flex items-center gap-2 mb-2"
                >
                  <span
                    className={`
                      inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                      ${isToday ? "bg-blue-600 text-white" : "text-gray-300 bg-white/5"}
                    `}
                  >
                    {date.getDate()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                </button>
                {dayEvents.length > 0 && (
                  <div className="space-y-1 ml-10">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => onEventClick?.(ev)}
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg transition-colors hover:bg-white/5"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.color ?? "#2563EB" }} />
                        <span className="text-xs text-gray-300 truncate">{ev.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {dayEvents.length === 0 && isToday && (
                  <p className="text-xs text-gray-600 ml-10">Aucune session</p>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
