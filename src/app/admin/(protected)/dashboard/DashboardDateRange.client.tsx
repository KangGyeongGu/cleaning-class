"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DayPicker, TZDate } from "@daypicker/react";
import { ko } from "@daypicker/react/locale";
import "@daypicker/react/style.css";
import styles from "@/app/admin/(protected)/dashboard/DashboardDateRange.module.css";
import {
  MILLISECONDS_PER_DAY,
  offsetDate,
  endOfMonth,
} from "@/shared/lib/pure/analytics";
import { Button } from "@/components/ui/Button";

interface Props {
  start: string;
  end: string;
  earliest: string;
  today: string;
  onApply: (start: string, end: string) => void;
}

function calendarDate(value: string): TZDate {
  const [year, month, day] = value.split("-").map(Number);
  return new TZDate(year, month - 1, day, "Asia/Seoul");
}

function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function DashboardDateRange({
  start,
  end,
  earliest,
  today,
  onApply,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(start.slice(0, 7));
  const [from, setFrom] = useState(start);
  const [to, setTo] = useState(end);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const days =
    Math.round(
      (new Date(`${end}T00:00:00Z`).getTime() -
        new Date(`${start}T00:00:00Z`).getTime()) /
        MILLISECONDS_PER_DAY,
    ) + 1;
  const previous = offsetDate(start, -days);
  const next = offsetDate(end, days);
  const first = `${month}-01`;
  const apply = () => {
    onApply(from, to);
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div ref={root} className="relative max-w-full">
      <div className="flex h-9 items-center border border-slate-200 bg-white">
        <button
          type="button"
          aria-label="이전 기간"
          disabled={start <= earliest}
          onClick={() =>
            onApply(
              previous < earliest ? earliest : previous,
              offsetDate(start, -1),
            )
          }
          className="flex h-full w-8 shrink-0 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          ref={trigger}
          type="button"
          aria-expanded={open}
          aria-controls="dashboard-date-picker"
          onClick={() => {
            if (!open) {
              setFrom(start);
              setTo(end);
              setMonth(start.slice(0, 7));
            }
            setOpen(!open);
          }}
          className="flex h-full min-w-0 items-center gap-2 px-2 text-xs font-medium text-slate-700 tabular-nums hover:bg-slate-50"
        >
          <CalendarDays size={14} className="shrink-0 text-slate-400" />
          <span>
            {start.replaceAll("-", ".")} — {end.replaceAll("-", ".")}
          </span>
          <ChevronDown size={13} className="shrink-0 text-slate-400" />
        </button>
        <button
          type="button"
          aria-label="다음 기간"
          disabled={end >= today}
          onClick={() =>
            onApply(offsetDate(end, 1), next > today ? today : next)
          }
          className="flex h-full w-8 shrink-0 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30"
        >
          <ChevronRight size={15} />
        </button>
      </div>
      {open && (
        <div
          id="dashboard-date-picker"
          className="absolute left-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] border border-slate-200 bg-white p-4 shadow-lg"
        >
          <DayPicker
            mode="range"
            locale={ko}
            timeZone="Asia/Seoul"
            month={calendarDate(first)}
            onMonthChange={(value) => setMonth(dateKey(value).slice(0, 7))}
            selected={
              from
                ? {
                    from: calendarDate(from),
                    to: to ? calendarDate(to) : undefined,
                  }
                : undefined
            }
            onSelect={(value) => {
              setFrom(value?.from ? dateKey(value.from) : "");
              setTo(value?.to ? dateKey(value.to) : "");
            }}
            startMonth={calendarDate(earliest)}
            endMonth={calendarDate(today)}
            disabled={[
              { before: calendarDate(earliest) },
              { after: calendarDate(today) },
            ]}
            captionLayout="dropdown"
            navLayout="around"
            resetOnSelect
            showOutsideDays
            fixedWeeks
            autoFocus
            className={styles.calendar}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-500">
              시작일
              <input
                type="date"
                required
                value={from}
                min={earliest}
                max={to}
                onChange={(event) => {
                  setFrom(event.target.value);
                }}
                className="mt-1 h-8 w-full min-w-0 border border-slate-200 px-1 text-xs text-slate-700"
              />
            </label>
            <label className="text-xs text-slate-500">
              종료일
              <input
                type="date"
                required
                value={to}
                min={from}
                max={today}
                onChange={(event) => {
                  setTo(event.target.value);
                }}
                className="mt-1 h-8 w-full min-w-0 border border-slate-200 px-1 text-xs text-slate-700"
              />
            </label>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setFrom(first < earliest ? earliest : first);
                setTo(endOfMonth(month) > today ? today : endOfMonth(month));
              }}
              className="text-xs text-slate-600 underline underline-offset-4"
            >
              월 전체
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus();
                }}
                className="px-2 py-2 text-xs text-slate-500"
              >
                취소
              </button>
              <Button
                size="none"
                disabled={
                  !from || !to || from > to || from < earliest || to > today
                }
                className="h-8 px-4 text-xs"
                onClick={apply}
              >
                적용
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
