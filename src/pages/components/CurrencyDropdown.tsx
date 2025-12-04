// src/pages/components/CurrencyDropdown.tsx
import { useEffect, useMemo, useRef, useState } from "react";

export type CurrencyMeta = {
  code: string;
  name: string;
  flagClass?: string;
};

type CurrencyDropdownProps = {
  label?: string;
  value: string;
  onChange: (code: string) => void;
};

// Fallback list so the UI still works if API fails
export const FALLBACK_CURRENCIES: CurrencyMeta[] = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "INR", name: "Indian Rupee" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "SGD", name: "Singapore Dollar" },
];

// Map currency code -> ISO 3166-1 alpha-2 country / region code
// used by flag-icons: fi fi-us, fi fi-gb, fi fi-in, etc.
const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: "us",
  EUR: "eu", // EU flag
  GBP: "gb",
  INR: "in",
  JPY: "jp",
  AUD: "au",
  CAD: "ca",
  CHF: "ch",
  CNY: "cn",
  SGD: "sg",
  HKD: "hk",
  NZD: "nz",
  SEK: "se",
  NOK: "no",
  DKK: "dk",
  ZAR: "za",
  BRL: "br",
  MXN: "mx",
  RUB: "ru",
  KRW: "kr",
  TRY: "tr",
  SAR: "sa",
  AED: "ae",
};

function getFlagClass(code: string): string | undefined {
  const country = CURRENCY_TO_COUNTRY[code];
  return country ? `fi fi-${country}` : undefined;
}

export function CurrencyDropdown({
  label,
  value,
  onChange,
}: CurrencyDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currencies, setCurrencies] = useState<CurrencyMeta[]>(FALLBACK_CURRENCIES);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load full currency list from the API once
  useEffect(() => {
    let cancelled = false;

    async function fetchCurrencies() {
      try {
        setLoading(true);
        setApiError(null);

        const res = await fetch("https://api.frankfurter.app/currencies");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Record<string, string>;

        if (cancelled) return;

        const next: CurrencyMeta[] = Object.entries(data).map(
          ([code, name]) => ({
            code,
            name,
            flagClass: getFlagClass(code),
          })
        );

        next.sort((a, b) => a.code.localeCompare(b.code));
        setCurrencies(next);
      } catch (err) {
        console.error("Currency list API error:", err);
        if (!cancelled) {
          setApiError("Using fallback list (API unavailable).");
          setCurrencies(
            FALLBACK_CURRENCIES.map((c) => ({
              ...c,
              flagClass: getFlagClass(c.code),
            }))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCurrencies();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const selected = useMemo(
    () => currencies.find((c) => c.code === value) ?? null,
    [currencies, value]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return currencies;
    return currencies.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
  }, [currencies, search]);

  function handleSelect(code: string) {
    onChange(code);
    setOpen(false);
    setSearch("");
  }

  const renderFlag = (code: string, flagClass?: string) => {
    if (!flagClass) {
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[0.7rem] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
          {code.slice(0, 2)}
        </span>
      );
    }
    return (
      <span
        className={`${flagClass} fi-rounded`}
        style={{ width: 24, height: 18 }}
      />
    );
  };

  return (
    <div ref={containerRef} className="relative text-xs">
      {label && (
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-800 shadow-sm hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <span className="flex items-center gap-2">
          {renderFlag(selected?.code || value || "??", selected?.flagClass)}
          <span className="flex flex-col">
            <span className="font-semibold">
              {selected ? selected.code : value || "Select"}
            </span>
            <span className="text-[0.6rem] text-slate-500 dark:text-slate-400">
              {selected ? selected.name : "Pick a currency"}
            </span>
          </span>
        </span>
        <span className="ml-2 text-[0.6rem] text-slate-400 dark:text-slate-500">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-2xl border border-slate-200 bg-white text-xs shadow-xl dark:border-slate-700 dark:bg-slate-950">
          {/* Search */}
          <div className="border-b border-slate-200 px-3 pb-2 pt-2 dark:border-slate-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search currency or code..."
              className="w-full rounded-full bg-slate-100 px-3 py-1.5 text-[0.72rem] text-slate-800 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-sky-400 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
            />
            {loading && (
              <p className="mt-1 text-[0.6rem] text-slate-400">
                Loading currencies…
              </p>
            )}
            {apiError && !loading && (
              <p className="mt-1 text-[0.6rem] text-amber-500">{apiError}</p>
            )}
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelect(c.code)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[0.78rem] hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  c.code === value
                    ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                    : "text-slate-700 dark:text-slate-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  {renderFlag(c.code, c.flagClass)}
                  <span className="flex flex-col">
                    <span className="font-semibold">{c.code}</span>
                    <span className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                      {c.name}
                    </span>
                  </span>
                </span>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="px-3 py-3 text-[11px] text-slate-400">
                No currencies match your search.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
