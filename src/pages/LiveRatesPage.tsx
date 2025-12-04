// src/pages/LiveRatesPage.tsx
import { useState } from "react";
import Navbar from "./components/Navbar";
import CurrencyChartsSection from "./CurrencyChartsSection";

type UserProfile = {
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

type ThemeMode = "light" | "dark";

type LiveRatesPageProps = {
  onLogout: () => void;
  onOpenProfile: () => void;
  user: UserProfile | null;
  // when user clicks "Currency converter" or "Get alerts" in navbar
  onBackToMain: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
};

export default function LiveRatesPage({
  onLogout,
  onOpenProfile,
  user,
  onBackToMain,
  theme,
  onToggleTheme,
}: LiveRatesPageProps) {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("INR");

  // In this page, navbar's active tab is always "charts"
  function handleTabChange(tab: "converter" | "charts" | "alerts") {
    if (tab === "charts") return; // already here
    // for converter/alerts, send them back to the main dashboard
    onBackToMain();
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <Navbar
        activeTab="charts"
        onTabChange={handleTabChange}
        user={user || undefined}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
        // already on full charts page, so no onOpenChartsFull handler
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className="flex-1 bg-slate-100 dark:bg-slate-950">
        <section className="hiw-section">
          <div className="hiw-inner">
            <h2 className="hiw-title">Live exchange rates</h2>
            <p className="hiw-subtitle">
              Full view of your demo rate table. Later, connect this to your
              live FX API and watchlist storage.
            </p>

            <div className="mt-4 chart-card">
              <CurrencyChartsSection
                fromCurrency={fromCurrency}
                toCurrency={toCurrency}
                setFromCurrency={setFromCurrency}
                setToCurrency={setToCurrency}
                mode="full" // full list, not preview
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
