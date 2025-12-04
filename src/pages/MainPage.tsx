// src/pages/MainPage.tsx
import { useEffect, useState } from "react";
import CurrencyConverterSection from "./CurrencyConverterSection";
import CurrencyChartsSection from "./CurrencyChartsSection";
import GetAlertsSection from "./GetAlertsSection";
import Navbar from "./components/Navbar";

type UserProfile = {
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

export type MainTab = "converter" | "charts" | "alerts";
export type ThemeMode = "light" | "dark";

type MainPageProps = {
  onLogout: () => void;
  onOpenProfile: () => void;
  user: UserProfile | null;
  onOpenChartsFull: () => void;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
};

export default function MainPage({
  onLogout,
  onOpenProfile,
  user,
  onOpenChartsFull,
  theme,
  setTheme,
}: MainPageProps) {
  const [activeTab, setActiveTab] = useState<MainTab>("converter");

  // Shared pair for converter + charts preview + alerts
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("INR");

  // Scroll to section when tab changes
  useEffect(() => {
    const sectionId =
      activeTab === "converter"
        ? "converter"
        : activeTab === "charts"
        ? "charts"
        : "alerts";

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  function handleTabChange(tab: MainTab) {
    setActiveTab(tab);
  }

  const isDark = theme === "dark";

  return (
    <div
      className={
        isDark
          ? "min-h-screen bg-slate-950 text-slate-50"
          : "min-h-screen bg-slate-50 text-slate-900"
      }
    >
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={user || undefined}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
        onOpenChartsFull={onOpenChartsFull}
        theme={theme}
        onToggleTheme={() =>
          setTheme(isDark ? "light" : ("dark" as ThemeMode))
        }
      />

      <main className="flex flex-col">
        {/* HERO */}
        <section className="hero">
          <div className="hero-inner px-4">
            <p className="mb-2 text-[0.7rem] uppercase tracking-[0.28em] text-sky-200/80">
              XChangeHub · Currency studio
            </p>

            <h1 className="hero-title">
              Convert, chart, and track{" "}
              <span className="text-sky-300">FX moves</span> in one place.
            </h1>

            <p className="hero-sub max-w-2xl mx-auto">
              A demo dashboard where you can play with live-style FX conversion,
              mini charts, and email-style alerts for your favorite currency
              pairs.
            </p>
          </div>
        </section>

        {/* QUICK CONVERTER */}
        <section className="converter-section" id="converter">
          <div className="section-inner">
            <h2 className="section-heading">Quick converter</h2>
            <p className="section-subheading">
              Enter an amount, pick your currencies, and get a live-style
              conversion using frankfurter.dev data (demo only).
            </p>

            <div className="converter-card">
              <CurrencyConverterSection
                fromCurrency={fromCurrency}
                toCurrency={toCurrency}
                setFromCurrency={setFromCurrency}
                setToCurrency={setToCurrency}
              />
            </div>
          </div>
        </section>

        {/* CHARTS PREVIEW */}
        <section className="hiw-section" id="charts">
          <div className="hiw-inner">
            <h2 className="hiw-title">Currency charts snapshot</h2>
            <p className="hiw-subtitle">
              See how your base currency moves against a small basket, then jump
              into the full board for deeper exploration.
            </p>

            <div className="chart-card">
              <CurrencyChartsSection
                fromCurrency={fromCurrency}
                toCurrency={toCurrency}
                setFromCurrency={setFromCurrency}
                setToCurrency={setToCurrency}
                mode="preview"
                onOpenFull={onOpenChartsFull}
              />
            </div>
          </div>
        </section>

        {/* ALERTS */}
        <section className="alerts-section" id="alerts">
          <div className="alerts-inner">
            <h2 className="section-heading">Get email-style alerts</h2>
            <p className="section-subheading">
              Save demo alerts for your favorite FX levels. We keep them in your
              browser&apos;s local storage—no real emails, just the logic for
              your portfolio project.
            </p>

            <div className="alert-card">
              <GetAlertsSection
                fromCurrency={fromCurrency}
                toCurrency={toCurrency}
                setFromCurrency={setFromCurrency}
                setToCurrency={setToCurrency}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
