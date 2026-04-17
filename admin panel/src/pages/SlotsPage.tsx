import { FormEvent, useEffect, useMemo, useState } from "react";
import { rawApiGet } from "../api";
import { useAuth } from "../auth";
import { getResourceConfigByKey, withBarberOptions } from "../config/resources";
import { ResourcePage } from "./ResourcePage";

type BarberOption = { id: number; name: string };

type BulkFormState = {
  barberId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  interval: string;
  status: "available" | "booked" | "blocked";
};

type BulkReport = {
  created: number;
  skipped: number;
  requests: number;
  errors: string[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseTimeToMinute(value: string) {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function minuteToTime(value: number) {
  const hour = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minute = (value % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

function enumerateDates(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function buildTimes(startTime: string, endTime: string, interval: number) {
  const start = parseTimeToMinute(startTime);
  const end = parseTimeToMinute(endTime);
  if (start === null || end === null || end <= start) return [];

  const times: string[] = [];
  for (let current = start; current < end; current += interval) {
    times.push(minuteToTime(current));
  }
  return times;
}

export function SlotsPage() {
  const baseConfig = getResourceConfigByKey("slots");
  const { token } = useAuth();
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [lookupError, setLookupError] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkReport, setBulkReport] = useState<BulkReport | null>(null);
  const [form, setForm] = useState<BulkFormState>({
    barberId: "",
    startDate: todayIso(),
    endDate: todayIso(),
    startTime: "09:00",
    endTime: "21:00",
    interval: "30",
    status: "available",
  });

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const loadBarbers = async () => {
      try {
        const payload = await rawApiGet<Array<{ id: number; name: string }>>(
          "/api/admin/barbers?includeInactive=true",
          token,
        );
        if (!cancelled) {
          setBarbers(
            payload
              .filter((item) => Number.isFinite(item.id) && typeof item.name === "string")
              .map((item) => ({ id: Number(item.id), name: item.name })),
          );
          setLookupError("");
        }
      } catch (error) {
        if (!cancelled) {
          setLookupError(error instanceof Error ? error.message : "Не удалось загрузить список барберов");
        }
      }
    };

    void loadBarbers();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const config = useMemo(() => {
    if (!baseConfig) return null;
    return withBarberOptions(baseConfig, barbers);
  }, [baseConfig, barbers]);

  if (!config) {
    return <div className="panel-error">Конфиг ресурса slots не найден.</div>;
  }

  const beforeGrid = ({ reload }: { reload: () => Promise<void> }) => {
    const submit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!token) return;

      const barberId = Number(form.barberId);
      if (!Number.isInteger(barberId) || barberId <= 0) {
        setBulkError("Выберите барбера.");
        return;
      }

      if (form.endDate < form.startDate) {
        setBulkError("Дата окончания не может быть раньше даты начала.");
        return;
      }

      const interval = Number(form.interval);
      if (![15, 30, 60].includes(interval)) {
        setBulkError("Интервал должен быть 15, 30 или 60 минут.");
        return;
      }

      const dates = enumerateDates(form.startDate, form.endDate);
      if (dates.length > 31) {
        setBulkError("За один запуск можно создать максимум 31 день слотов.");
        return;
      }

      const times = buildTimes(form.startTime, form.endTime, interval);
      if (!times.length) {
        setBulkError("Проверьте временной диапазон: start < end.");
        return;
      }

      setBulkError("");
      setBulkLoading(true);
      setBulkReport(null);

      const nextReport: BulkReport = {
        created: 0,
        skipped: 0,
        requests: dates.length,
        errors: [],
      };

      for (const date of dates) {
        try {
          const result = await config.adapter.create(token, {
            barberId,
            date,
            times,
            status: form.status,
          });
          if (isObject(result)) {
            if (Array.isArray(result.created)) {
              nextReport.created += result.created.length;
            }
            if (typeof result.skipped === "number") {
              nextReport.skipped += result.skipped;
            }
          }
        } catch (error) {
          nextReport.errors.push(`${date}: ${error instanceof Error ? error.message : "request failed"}`);
        }
      }

      setBulkReport(nextReport);
      setBulkLoading(false);
      await reload();
    };

    return (
      <section className="bulk-panel">
        <div className="bulk-header">
          <h3>Bulk slot generator</h3>
          <p>Генерация слотов пачкой: barber + date range + interval.</p>
        </div>

        <form className="bulk-form" onSubmit={(event) => void submit(event)}>
          <label>
            Барбер
            <select
              value={form.barberId}
              onChange={(event) => setForm((prev) => ({ ...prev, barberId: event.target.value }))}
              required
            >
              <option value="">Выберите барбера</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={String(barber.id)}>
                  {barber.id} - {barber.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Дата начала
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
              required
            />
          </label>

          <label>
            Дата окончания
            <input
              type="date"
              value={form.endDate}
              onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
              required
            />
          </label>

          <label>
            Start time
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
              required
            />
          </label>

          <label>
            End time
            <input
              type="time"
              value={form.endTime}
              onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
              required
            />
          </label>

          <label>
            Interval
            <select
              value={form.interval}
              onChange={(event) => setForm((prev) => ({ ...prev, interval: event.target.value }))}
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">60 min</option>
            </select>
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: event.target.value as BulkFormState["status"],
                }))
              }
            >
              <option value="available">available</option>
              <option value="booked">booked</option>
              <option value="blocked">blocked</option>
            </select>
          </label>

          <button type="submit" disabled={bulkLoading}>
            {bulkLoading ? "Генерация..." : "Сгенерировать слоты"}
          </button>
        </form>

        {bulkError ? <div className="panel-error">{bulkError}</div> : null}

        {bulkReport ? (
          <div className="bulk-report">
            <div>Requests: {bulkReport.requests}</div>
            <div>Created: {bulkReport.created}</div>
            <div>Skipped: {bulkReport.skipped}</div>
            {bulkReport.errors.length ? (
              <details>
                <summary>Ошибки ({bulkReport.errors.length})</summary>
                <ul>
                  {bulkReport.errors.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  };

  return (
    <>
      {lookupError ? <div className="panel-error">Lookup error: {lookupError}</div> : null}
      <ResourcePage config={config} beforeGrid={beforeGrid} />
    </>
  );
}
