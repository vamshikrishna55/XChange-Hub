// src/pages/CurrencyChartsFullPage.tsx
import { useEffect, useMemo, useState } from "react";
import { CurrencyDropdown } from "./components/CurrencyDropdown";

type Props = {
  fromCurrency: string;
  toCurrency: string;
  setFromCurrency: (code: string) => void;
  setToCurrency: (code: string) => void;
};

type RangeKey = "24H" | "7D" | "30D" | "3M";

type TableRow = {
  code: string;
  name: string;
  flag: string;
  rate: number;
  changePct: number;
  values: number[];
  isFocus: boolean;
};

type FrankfurterLatest = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

const FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  CAD: "🇨🇦",
  AUD: "🇦🇺",
  INR: "🇮🇳",
  SGD: "🇸🇬",
  CHF: "🇨🇭",
  ZAR: "🇿🇦",
};

function getName(code: string): string {
  switch (code) {
    case "USD":
      return "US Dollar";
    case "EUR":
      return "Euro";
    case "GBP":
      return "British Pound";
    case "JPY":
      return "Japanese Yen";
    case "CAD":
      return "Canadian Dollar";
    case "AUD":
      return "Australian Dollar";
    case "INR":
      return "Indian Rupee";
    case "SGD":
      return "Singapore Dollar";
    case "CHF":
      return "Swiss Franc";
    case "ZAR":
      return "South African Rand";
    default:
      return code;
  }
}

// tiny deterministic pseudo-random walk, just for the little sparkline shape
function makeTrend(range: RangeKey, seed: number): number[] {
  const length =
    range === "24H" ? 18 : range === "7D" ? 22 : range === "30D" ? 26 : 30;

  let spread = 0.004;
  if (range === "7D") spread = 0.008;
  if (range === "30D") spread = 0.012;
  if (range === "3M") spread = 0.018;

  const values: number[] = [];
  let v = 1;
  for (let i = 0; i < length; i++) {
    const s = (seed + 11) * (i + 17);
    const rand = (((s * 9301 + 49297) % 233280) / 233280) * 2 - 1; // -1..1
    const delta = rand * spread;
    v = v * (1 + delta);
    values.push(v);
  }
  return values;
}

function Sparkline({
  values,
  positive,
}: {
  values: number[];
  positive: boolean;
}) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 90;
  const height = 30;

  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-24">
      <polyline
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth={1.5}
        points={points}
      />
    </svg>
  );
}

export default function CurrencyChartsFullPage({
  fromCurrency,
  toCurrency,
  setFromCurrency,
  setToCurrency,
}: Props) {
  const [range, setRange] = useState<RangeKey>("24H");
  const [inverse, setInverse] = useState(false);

  // live rates from frankfurter for the current base
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseCurrency = inverse ? toCurrency : fromCurrency;
  const focusCurrency = inverse ? fromCurrency : toCurrency;

  // ===== fetch live rates whenever the base changes =====
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!baseCurrency) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `https://api.frankfurter.app/latest?from=${encodeURIComponent(
            baseCurrency
          )}`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data: FrankfurterLatest = await res.json();
        if (cancelled) return;
        setRates(data.rates);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching FX rates", err);
        setError("Could not load live FX rates. Please try again.");
        setRates(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [baseCurrency]);

  // ===== build table rows from live rates =====
  const rows: TableRow[] = useMemo(() => {
    if (!rates) return [];

    const codes = Object.keys(rates);

    // Make sure focus currency is visible even if the basket is small
    if (
      focusCurrency &&
      focusCurrency !== baseCurrency &&
      !codes.includes(focusCurrency)
    ) {
      codes.unshift(focusCurrency);
    }

    const result: TableRow[] = [];

    codes.forEach((code, index) => {
      if (code === baseCurrency) return;

      const baseToQuote = rates[code];
      if (!baseToQuote) return;

      const trend = makeTrend(range, index + (inverse ? 20 : 0));
      const changeRaw = (trend[trend.length - 1] / trend[0] - 1) * 100;
      const changePct = Number(changeRaw.toFixed(2));

      result.push({
        code,
        name: getName(code),
        flag: FLAGS[code] ?? "🌐",
        rate: baseToQuote,
        changePct,
        values: trend,
        isFocus: code === focusCurrency,
      });
    });

    result.sort((a, b) => {
      if (a.isFocus && !b.isFocus) return -1;
      if (!a.isFocus && b.isFocus) return 1;
      return a.code.localeCompare(b.code);
    });

    return result;
  }, [rates, baseCurrency, focusCurrency, range, inverse]);

  function handleSwapPair() {
    const prevFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(prevFrom);
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 shadow-[0_26px_70px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-[0_30px_80px_rgba(15,23,42,0.9)]">
      {/* Pair controls */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            FX board · live rates
          </p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Watch {baseCurrency || "…"} vs major currencies
          </h2>
          <p className="max-w-md text-[11px] text-slate-500 dark:text-slate-400">
            Rates are sourced from frankfurter.app (European Central Bank). The
            small sparklines and % moves are synthetic demo visuals for your
            portfolio project.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                From
              </label>
              <CurrencyDropdown
                label=""
                value={fromCurrency}
                onChange={setFromCurrency}
              />
            </div>

            <button
              type="button"
              onClick={handleSwapPair}
              className="mt-4 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-sky-500 hover:text-sky-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-400"
            >
              ⇄
            </button>

            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                To
              </label>
              <CurrencyDropdown
                label=""
                value={toCurrency}
                onChange={setToCurrency}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
              {(["24H", "7D", "30D", "3M"] as RangeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  className={`rounded-full px-2 py-0.5 ${
                    range === key
                      ? "bg-sky-500 text-white"
                      : "text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setInverse((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] text-slate-700 hover:border-sky-500 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-sky-300"
            >
              <span className="text-[11px]">⇅</span>
              <span>
                View as 1 {inverse ? fromCurrency : toCurrency} base
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-slate-200 text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="py-2 pr-4">Pair</th>
              <th className="py-2 px-4">Last price</th>
              <th className="hidden py-2 px-4 sm:table-cell">Change</th>
              <th className="hidden py-2 px-4 sm:table-cell">Trend</th>
              <th className="py-2 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-[0.8rem] text-slate-500 dark:text-slate-400"
                >
                  Loading live FX rates…
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-[0.8rem] text-rose-400"
                >
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-[0.8rem] text-slate-500 dark:text-slate-400"
                >
                  No rates available for {baseCurrency}.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              rows.map((row) => {
                const positive = row.changePct >= 0;
                return (
                  <tr
                    key={row.code}
                    className={`border-b border-slate-100 last:border-0 dark:border-slate-800 ${
                      row.isFocus ? "bg-sky-50/60 dark:bg-sky-900/20" : ""
                    }`}
                  >
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-[0.78rem] font-semibold text-slate-900 dark:text-slate-50">
                              {baseCurrency}/{row.code}
                            </span>
                            {row.isFocus && (
                              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[0.6rem] font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                                Focus
                              </span>
                            )}
                          </div>
                          <p className="text-[0.68rem] text-slate-500 dark:text-slate-400">
                            {getName(row.code)}
                          </p>
                        </div>
                      </div>
                    </td>


                    <td className="py-2 px-4 align-middle">
                      <div className="text-[0.8rem] font-semibold text-slate-900 dark:text-slate-50">
                        {row.rate.toFixed(4)}
                      </div>
                      <div className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                        1 {baseCurrency} → {row.code}
                      </div>
                    </td>

                    <td className="hidden py-2 px-4 align-middle sm:table-cell">
                      <div
                        className={`text-[0.78rem] font-semibold ${
                          positive ? "text-emerald-500" : "text-rose-400"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {row.changePct.toFixed(2)}%
                      </div>
                      <div className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                        {range} change (synthetic)
                      </div>
                    </td>

                    <td className="hidden py-2 px-4 align-middle sm:table-cell">
                      <Sparkline values={row.values} positive={positive} />
                    </td>

                    <td className="py-2 pl-4 align-middle">
                      <div className="flex justify-end gap-2 text-[0.68rem]">
                        <button
                          type="button"
                          className="rounded-full border border-slate-300 px-3 py-1 text-slate-700 hover:border-sky-500 hover:text-sky-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-sky-400"
                        >
                          Add to watchlist
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-sky-500 px-4 py-1 text-white shadow-[0_10px_24px_rgba(56,189,248,0.6)] transition hover:brightness-110"
                        >
                          Alert
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[10px] text-slate-500 dark:text-slate-400">
        Powered by frankfurter.app rates. Graph squiggles and % moves are
        intentionally simulated so you can drop in your own historical candles
        later.
      </p>
    </section>
  );
}
