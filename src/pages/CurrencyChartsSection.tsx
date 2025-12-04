// src/pages/CurrencyChartsSection.tsx
import { useEffect, useMemo, useState } from "react";

type CurrencyChartsSectionProps = {
  fromCurrency: string;
  toCurrency: string;
  setFromCurrency: (code: string) => void;
  setToCurrency: (code: string) => void;
  /**
   * preview  – compact card on the main page with CTA to open full view
   * full     – wider card used on the live-rates page
   */
  mode?: "preview" | "full";
  onOpenFull?: () => void;
};

type RangeKey = "24H" | "7D" | "30D" | "3M";

type RowMeta = {
  code: string;
  name: string;
  flag: string;
};

// A small curated list just for UI; the full page table uses its own config.
const ROWS: RowMeta[] = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳" },
];

// Simple sample rates: 1 USD → X currency units (demo only).
const SAMPLE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 151.2,
  CAD: 1.37,
  AUD: 1.52,
  INR: 83.1,
};

// Fallback cross-rate using SAMPLE_RATES (all vs USD)
function crossRate(base: string, quote: string): number | null {
  const baseUsd = SAMPLE_RATES[base];
  const quoteUsd = SAMPLE_RATES[quote];
  if (!baseUsd || !quoteUsd) return null;
  // 1 base = ? quote
  return quoteUsd / baseUsd;
}

// deterministic tiny pseudo-random for “movement”
function makeTrend(range: RangeKey, seed: number): number[] {
  const length =
    range === "24H" ? 16 : range === "7D" ? 20 : range === "30D" ? 24 : 28;
  let spread = 0.004;
  if (range === "7D") spread = 0.008;
  if (range === "30D") spread = 0.012;
  if (range === "3M") spread = 0.018;

  const values: number[] = [];
  let v = 1;
  for (let i = 0; i < length; i++) {
    const s = (seed + 7) * (i + 11);
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
  const width = 80;
  const height = 26;

  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-20">
      <polyline
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth={1.4}
        points={points}
      />
    </svg>
  );
}

export default function CurrencyChartsSection({
  fromCurrency,
  toCurrency,
  setFromCurrency,
  setToCurrency,
  mode = "preview",
  onOpenFull,
}: CurrencyChartsSectionProps) {
  const [range, setRange] = useState<RangeKey>("24H");
  const [inverse, setInverse] = useState(false);

  // Live rates from API (1 baseCurrency → quote)
  const [rates, setRates] = useState<Record<string, number>>({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const isPreview = mode === "preview";

  const baseCurrency = inverse ? toCurrency : fromCurrency;
  const focusCurrency = inverse ? fromCurrency : toCurrency;

  // Fetch rates for baseCurrency from Frankfurter
  useEffect(() => {
    let cancelled = false;

    async function fetchRates() {
      try {
        setRatesLoading(true);
        setRatesError(null);

        // build list of all targets except base
        const targets = Array.from(
          new Set(
            ROWS.map((r) => r.code).filter((code) => code !== baseCurrency)
          )
        );

        if (!targets.length) {
          setRates({});
          return;
        }

        const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(
          baseCurrency
        )}&to=${targets.join(",")}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          rates?: Record<string, number>;
        };

        if (cancelled) return;

        setRates(data.rates || {});
      } catch (err) {
        console.error("Error fetching FX board rates:", err);
        if (!cancelled) {
          setRatesError("Using sample rates (FX API unavailable).");
          // fallback: derive from SAMPLE_RATES
          const fallback: Record<string, number> = {};
          ROWS.forEach(({ code }) => {
            if (code === baseCurrency) return;
            const r = crossRate(baseCurrency, code);
            if (r != null) fallback[code] = r;
          });
          setRates(fallback);
        }
      } finally {
        if (!cancelled) setRatesLoading(false);
      }
    }

    fetchRates();
    return () => {
      cancelled = true;
    };
  }, [baseCurrency]);

  const baseMeta: RowMeta = (() => {
    const found = ROWS.find((r) => r.code === baseCurrency);
    if (found) return found;
    return {
      code: baseCurrency,
      name: baseCurrency,
      flag: "🌐",
    };
  })();

  const rows = useMemo(() => {
    // ensure base + focus currencies are present in the grid
    const list: RowMeta[] = [...ROWS];
    if (!list.find((r) => r.code === baseCurrency)) {
      list.unshift({ code: baseCurrency, name: baseCurrency, flag: "🌐" });
    }
    if (!list.find((r) => r.code === focusCurrency)) {
      list.unshift({ code: focusCurrency, name: focusCurrency, flag: "🌐" });
    }

    const mapped = list
      .filter((row) => row.code !== baseCurrency)
      .map((row, index) => {
        // Prefer API rate, fallback to static crossRate
        const apiRate = rates[row.code];
        const fallbackRate = crossRate(baseCurrency, row.code);
        const rate = apiRate ?? fallbackRate;
        if (rate == null) return null;

        const trend = makeTrend(range, index + (inverse ? 10 : 0));
        const changeRaw = (trend[trend.length - 1] / trend[0] - 1) * 100;
        const changePct = Number(changeRaw.toFixed(2));

        return {
          ...row,
          rate,
          changePct,
          values: trend,
          isFocus: row.code === focusCurrency,
        };
      })
      .filter(Boolean) as {
      code: string;
      name: string;
      flag: string;
      rate: number;
      changePct: number;
      values: number[];
      isFocus: boolean;
    }[];

    // put the focus pair at the top
    mapped.sort((a, b) => {
      if (a.isFocus && !b.isFocus) return -1;
      if (!a.isFocus && b.isFocus) return 1;
      return a.code.localeCompare(b.code);
    });

    return mapped;
  }, [baseCurrency, focusCurrency, range, inverse, rates]);

  const visibleRows = isPreview ? rows.slice(0, 4) : rows;

  function handleSwapPair() {
    const prevFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(prevFrom);
  }

  return (
    <div className="rounded-3xl border border-sky-500/20 bg-slate-950/90 px-4 py-4 sm:px-5 sm:py-5 shadow-[0_30px_70px_rgba(15,23,42,0.9)] text-xs text-slate-100">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="mt-1 text-sm font-semibold text-slate-50">
            1 {baseMeta.code}{" "}
            <span className="text-slate-400">vs major currencies</span>
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Rates pulled from frankfurter.app for your selected base. Synthetic
            trends for portfolio visuals.
          </p>
          {ratesError && (
            <p className="mt-0.5 text-[10px] text-amber-400">{ratesError}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 text-[11px]">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-1.5 py-1">
            {(["24H", "7D", "30D", "3M"] as RangeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                className={`px-2 py-0.5 rounded-full ${
                  range === key
                    ? "bg-sky-500 text-slate-950"
                    : "text-slate-300 hover:text-sky-300"
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSwapPair}
              className="hidden rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1 text-[10px] text-slate-200 hover:border-sky-400 sm:inline-flex"
            >
              Swap {fromCurrency}/{toCurrency}
            </button>

            <button
              type="button"
              onClick={() => setInverse((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1 text-[10px] text-slate-200 hover:border-sky-400"
            >
              <span className="text-[11px]">⇅</span>
              <span>
                View as 1 {inverse ? fromCurrency : toCurrency} base
              </span>
            </button>
          </div>

          {ratesLoading && (
            <p className="text-[10px] text-slate-400">Refreshing rates…</p>
          )}
        </div>
      </div>

      {/* Rows */}
      <div className="mt-2 divide-y divide-slate-800/70 border-y border-slate-800/70">
        {visibleRows.map((row) => {
          const positive = row.changePct >= 0;
          return (
            <div
              key={row.code}
              className={`flex items-center justify-between gap-3 py-2.5 ${
                row.isFocus ? "bg-slate-900/70" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-base">
                  <span>{row.flag}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[0.78rem] font-semibold text-slate-50">
                      {row.code}
                    </span>
                    {row.isFocus && (
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[0.6rem] font-semibold text-emerald-300">
                        Focus
                      </span>
                    )}
                  </div>
                  <p className="text-[0.68rem] text-slate-400">{row.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[0.8rem] font-semibold text-slate-50">
                    {row.rate.toFixed(4)}
                  </p>
                  <p className="text-[0.65rem] text-slate-400">
                    1 {baseMeta.code} → {row.code}
                  </p>
                </div>

                <div className="hidden items-center gap-3 sm:flex">
                  <Sparkline values={row.values} positive={positive} />
                  <div className="text-right">
                    <p
                      className={`text-[0.75rem] font-semibold ${
                        positive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {row.changePct.toFixed(2)}%
                    </p>
                    <p className="text-[0.6rem] text-slate-500">{range}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA for preview mode */}
      {isPreview && onOpenFull && (
        <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
          <p className="text-slate-400">
            Want the full board? See all pairs and alerts on the live-rates
            view.
          </p>
          <button
            type="button"
            onClick={onOpenFull}
            className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-3 py-1.5 text-[0.72rem] font-semibold text-slate-950 shadow-[0_14px_35px_rgba(56,189,248,0.7)] hover:brightness-110"
          >
            View all live rates →
          </button>
        </div>
      )}

      {!isPreview && (
        <p className="mt-2 text-[10px] text-slate-500">
          Rates are fetched from frankfurter.app. Trend lines are synthetic for
          demo purposes only.
        </p>
      )}
    </div>
  );
}
