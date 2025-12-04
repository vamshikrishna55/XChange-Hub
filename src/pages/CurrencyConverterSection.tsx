// src/pages/CurrencyConverterSection.tsx
import { useEffect, useMemo, useState } from "react";
import { CurrencyDropdown } from "./components/CurrencyDropdown";

type CurrencyConverterSectionProps = {
  fromCurrency: string;
  toCurrency: string;
  setFromCurrency: (code: string) => void;
  setToCurrency: (code: string) => void;
};

// simple fallback table for rate if API fails
const SAMPLE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  INR: 83.1,
  JPY: 151.2,
  AUD: 1.52,
  CAD: 1.37,
};

function computeFallbackCrossRate(from: string, to: string): number | null {
  const fromRate = SAMPLE_RATES[from];
  const toRate = SAMPLE_RATES[to];
  if (!fromRate || !toRate) return null;
  return (1 / fromRate) * toRate;
}

export default function CurrencyConverterSection({
  fromCurrency,
  toCurrency,
  setFromCurrency,
  setToCurrency,
}: CurrencyConverterSectionProps) {
  // 👉 initial amount is 1
  const [amount, setAmount] = useState(1);

  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // fetch live rate from Frankfurter on pair change
  useEffect(() => {
    if (fromCurrency === toCurrency) {
      setLiveRate(1);
      setRateLoading(false);
      setRateError(null);
      return;
    }

    let cancelled = false;

    async function fetchRate() {
      try {
        setRateLoading(true);
        setRateError(null);

        const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(
          fromCurrency
        )}&to=${encodeURIComponent(toCurrency)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        const rate = data?.rates?.[toCurrency];

        if (!cancelled) {
          if (typeof rate === "number") {
            setLiveRate(rate);
          } else {
            throw new Error("Missing rate field");
          }
        }
      } catch (err) {
        console.error("Frankfurter error:", err);
        if (!cancelled) {
          setRateError("Using sample rate (live feed unavailable).");
          setLiveRate(null);
        }
      } finally {
        if (!cancelled) setRateLoading(false);
      }
    }

    fetchRate();
    return () => {
      cancelled = true;
    };
  }, [fromCurrency, toCurrency]);

  const crossRate = useMemo(() => {
    if (liveRate != null) return liveRate;
    return computeFallbackCrossRate(fromCurrency, toCurrency);
  }, [fromCurrency, toCurrency, liveRate]);

  const converted = useMemo(() => {
    if (!crossRate) return null;
    return amount * crossRate;
  }, [amount, crossRate]);

  return (
    <div className="space-y-4 text-sm">
      {/* Amount */}
      <div>
        <label className="field-label block mb-1 text-[11px] tracking-[0.15em] uppercase">
          Amount
        </label>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) =>
            setAmount(
              e.target.value === "" ? 0 : Number(e.target.value) || 0
            )
          }
          className="input-pill w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/60"
          placeholder="1"
        />
      </div>

      {/* Pair selectors + swap */}
      <div className="converter-row grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
        <div className="converter-col">
          <span className="field-label block mb-1 text-[11px] tracking-[0.15em] uppercase">
            From
          </span>
          <CurrencyDropdown
            label=""
            value={fromCurrency}
            onChange={setFromCurrency}
          />
        </div>

        <div className="swap-col flex justify-center pt-4 sm:pt-6">
          <button
            type="button"
            onClick={() => {
              const prevFrom = fromCurrency;
              setFromCurrency(toCurrency);
              setToCurrency(prevFrom);
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-sky-400"
          >
            ⇄
          </button>
        </div>

        <div className="converter-col">
          <span className="field-label block mb-1 text-[11px] tracking-[0.15em] uppercase">
            To
          </span>
          <CurrencyDropdown
            label=""
            value={toCurrency}
            onChange={setToCurrency}
          />
        </div>
      </div>

      {/* Result */}
      <div className="space-y-1 mt-2">
        <p className="text-[11px] text-slate-500">You receive</p>
        <div className="flex items-center justify-between rounded-2xl bg-slate-950/90 border border-slate-800 px-4 py-2.5 text-slate-100">
          {rateLoading ? (
            <span className="text-[11px] text-slate-400">
              Fetching live rate…
            </span>
          ) : converted !== null ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold">
                  {converted.toFixed(2)}
                </span>
                <span className="text-xs text-slate-300">{toCurrency}</span>
              </div>
              <span className="text-[11px] text-slate-400">
                1 {fromCurrency} ≈ {crossRate?.toFixed(4)} {toCurrency}
              </span>
            </>
          ) : (
            <span className="text-slate-500 text-sm">—</span>
          )}
        </div>

        <p className="text-[10px] text-slate-500 flex items-center justify-between">
          <span>
            {liveRate != null
              ? "Mid-market rate from frankfurter.dev."
              : "Sample rate in use. Live feed temporarily unavailable."}
          </span>
          <span className="text-emerald-400/80">
            Demo · No fees or margins included
          </span>
        </p>

        {rateError && (
          <p className="text-[10px] text-amber-300 mt-1">{rateError}</p>
        )}
      </div>
    </div>
  );
}
