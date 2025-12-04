// src/pages/GetAlertsSection.tsx
import { useEffect, useState } from "react";
import { CurrencyDropdown } from "./components/CurrencyDropdown";

type GetAlertsSectionProps = {
  fromCurrency: string;
  toCurrency: string;
  setFromCurrency: (code: string) => void;
  setToCurrency: (code: string) => void;
};

type SavedAlert = {
  id: string;
  from: string;
  to: string;
  threshold: number;
  email: string;
  createdAt: string;
  schedule: string[]; // ["06:00", "19:00"]
};

const ALERTS_KEY = "fxflow-demo-alerts";

function loadAlerts(): SavedAlert[] {
  try {
    const raw = localStorage.getItem(ALERTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: SavedAlert[]) {
  try {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  } catch {
    // ignore
  }
}

export default function GetAlertsSection({
  fromCurrency,
  toCurrency,
  setFromCurrency,
  setToCurrency,
}: GetAlertsSectionProps) {
  const [targetRate, setTargetRate] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingAlerts, setExistingAlerts] = useState<SavedAlert[]>([]);

  useEffect(() => {
    setExistingAlerts(loadAlerts());
  }, []);

  function handleQuickPreset(preset: number) {
    setTargetRate(preset.toFixed(4));
  }

  function handleSwap() {
    const oldFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(oldFrom);
  }

  function validateForm(): boolean {
    setError(null);

    if (!fromCurrency || !toCurrency) {
      setError("Please select both currencies.");
      return false;
    }
    if (fromCurrency === toCurrency) {
      setError("From and To currencies should be different.");
      return false;
    }
    if (!targetRate.trim()) {
      setError("Please enter a target rate.");
      return false;
    }
    const t = Number(targetRate);
    if (!Number.isFinite(t) || t <= 0) {
      setError("Target rate must be a positive number.");
      return false;
    }
    if (!email.trim()) {
      setError("Please enter an email for the alert.");
      return false;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setBusy(true);
    setSaved(false);

    try {
      const t = Number(targetRate);
      const alert: SavedAlert = {
        id: `${Date.now()}`,
        from: fromCurrency,
        to: toCurrency,
        threshold: t,
        email: email.trim(),
        createdAt: new Date().toISOString(),
        schedule: ["06:00", "19:00"],
      };

      const updated = [alert, ...existingAlerts];
      setExistingAlerts(updated);
      saveAlerts(updated);
      setSaved(true);
    } catch {
      setError("Could not save alert. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-label="Get currency alerts"
      className="
        rounded-3xl border border-sky-500/20 bg-slate-950/80
        px-5 py-5 sm:px-6 sm:py-6
        shadow-[0_26px_60px_rgba(8,47,73,0.75)]
      "
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-50">
            Get email alerts
          </h2>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            Save a target rate and get a demo alert whenever{" "}
            <span className="font-semibold text-sky-300">
              1 {fromCurrency} → {toCurrency}
            </span>{" "}
            crosses your level.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-sky-950/50 px-3 py-1.5 text-[0.65rem] text-sky-100 border border-sky-500/40 shadow-[0_0_0_1px_rgba(8,47,73,0.7)]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span>Demo only — alerts are stored locally in your browser.</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-100">
        {/* Currency selectors */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="field-label block mb-1">From</label>
            <CurrencyDropdown value={fromCurrency} onChange={setFromCurrency} />
          </div>

          <div className="flex justify-center sm:items-center">
            <button
              type="button"
              onClick={handleSwap}
              className="mt-1 flex items-center justify-center rounded-full bg-slate-900 px-3 py-2 text-[0.7rem] text-slate-100 hover:bg-slate-800 border border-slate-700"
            >
              ⇄
            </button>
          </div>

          <div>
            <label className="field-label block mb-1">To</label>
            <CurrencyDropdown value={toCurrency} onChange={setToCurrency} />
          </div>
        </div>

        {/* Target rate */}
        <div>
          <label className="field-label block mb-1">
            Target rate (1 {fromCurrency} → {toCurrency})
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="number"
              step="0.0001"
              value={targetRate}
              onChange={(e) => setTargetRate(e.target.value)}
              placeholder="Enter your target rate"
              className="flex-1 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400"
            />
            <div className="flex flex-wrap gap-2 text-[0.65rem]">
              <button
                type="button"
                onClick={() => handleQuickPreset(82.5)}
                className="rounded-full bg-slate-900 px-3 py-1 text-slate-200 hover:bg-slate-800 border border-slate-700"
              >
                82.50
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(83.0)}
                className="rounded-full bg-slate-900 px-3 py-1 text-slate-200 hover:bg-slate-800 border border-slate-700"
              >
                83.00
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(83.5)}
                className="rounded-full bg-slate-900 px-3 py-1 text-slate-200 hover:bg-slate-800 border border-slate-700"
              >
                83.50
              </button>
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="field-label block mb-1">Email for alerts</label>
          <input
            type="email"
            value={email}
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400"
          />
        </div>

        {/* Error / success */}
        {(error || saved) && (
          <div className="text-[0.7rem]">
            {error && <p className="text-rose-400">{error}</p>}
            {saved && !error && (
              <p className="text-emerald-400">
                Alert saved. In a real app, we&apos;d send you an email when the
                rate crosses {targetRate || "your level"}.
              </p>
            )}
          </div>
        )}

        {/* Submit + existing alerts */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 px-5 py-2 text-[0.8rem] font-semibold text-slate-950 shadow-[0_18px_40px_rgba(34,197,94,0.55)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Saving alert..." : "Save alert"}
          </button>

          {existingAlerts.length > 0 && (
            <div className="text-[0.65rem] text-slate-400">
              <span className="font-semibold text-slate-200">
                {existingAlerts.length}
              </span>{" "}
              saved alerts in this browser.
            </div>
          )}
        </div>

        {/* Existing alerts list */}
        {existingAlerts.length > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-[0.7rem] text-slate-300">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-slate-100">
                Your local alert log
              </span>
              <span className="text-[0.6rem] text-slate-500">
                Stored in localStorage only
              </span>
            </div>
            <ul className="space-y-1.5">
              {existingAlerts.slice(0, 3).map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span>
                    <span className="font-semibold">
                      {a.from} → {a.to}
                    </span>{" "}
                    @ {a.threshold.toFixed(4)} for {a.email}
                  </span>
                  <span className="text-[0.6rem] text-slate-500">
                    {new Date(a.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {a.schedule.join(", ")}
                  </span>
                </li>
              ))}
              {existingAlerts.length > 3 && (
                <li className="text-slate-500 dark:text-slate-400">
                  (+{existingAlerts.length - 3} more not shown)
                </li>
              )}
            </ul>
          </div>
        )}
      </form>
    </section>
  );
}
