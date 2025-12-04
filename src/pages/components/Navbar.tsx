// src/pages/components/Navbar.tsx
import { useState } from "react";

export type MainTab = "converter" | "charts" | "alerts";

type ThemeMode = "light" | "dark";

type UserProfile = {
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

type NavbarProps = {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  user?: UserProfile;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenChartsFull?: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
};

const TABS: { id: MainTab; label: string }[] = [
  { id: "converter", label: "Currency converter" },
  { id: "charts", label: "Currency charts" },
  { id: "alerts", label: "Get alerts" },
];

export default function Navbar({
  activeTab,
  onTabChange,
  user,
  onOpenProfile,
  onLogout,
  theme,
  onToggleTheme,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isDark = theme === "dark";
  const isAuthenticated = !!user;

  const displayName = user?.displayName || "XChangeHub user";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const avatarUrl = user?.avatarUrl ?? null;

  function handleTabClick(tab: MainTab) {
    setMobileOpen(false);
    onTabChange(tab);
  }

  function handleProfileClick() {
    setUserMenuOpen(false);
    onOpenProfile();
  }

  function handleLogoutClick() {
    setUserMenuOpen(false);
    onLogout();
  }

  function handleThemeClick() {
    onToggleTheme();
  }

  // Single, flat background like the HTML version
  const headerClass =
    "sticky top-0 z-40 w-full border-b border-slate-700 bg-gradient-to-b from-[#071a3a] to-[#08224d] text-white";

  return (
    <header className={headerClass}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* LEFT: Logo */}
        <button
          type="button"
          className="flex items-center gap-2 sm:gap-3"
          onClick={() => handleTabClick("converter")}
        >
          {/* Circular logo mark */}
          <div className="relative flex h-9 w-9 items-center justify-center">
            <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
              <defs>
                <linearGradient id="logoCircle" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
                <linearGradient id="candleUp" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
                <linearGradient id="candleDown" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              {/* Outer ring */}
              <circle
                cx="20"
                cy="20"
                r="18"
                fill={isDark ? "#020617" : "#0b1120"}
                stroke="url(#logoCircle)"
                strokeWidth="1.8"
              />

              {/* Inner curve line */}
              <path
                d="M 6 26 C 10 18 16 12 23 10 C 27 9 31 9.5 34 11"
                fill="none"
                stroke="url(#logoCircle)"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Candles */}
              <g>
                {/* Red candle */}
                <line
                  x1="11"
                  y1="12"
                  x2="11"
                  y2="27"
                  stroke="#fb923c"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <rect
                  x="9.5"
                  y="16"
                  width="3"
                  height="7"
                  rx="1"
                  fill="url(#candleDown)"
                />

                {/* Main green candle */}
                <line
                  x1="20"
                  y1="9"
                  x2="20"
                  y2="26"
                  stroke="#22c55e"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <rect
                  x="18.5"
                  y="13"
                  width="3"
                  height="9"
                  rx="1"
                  fill="url(#candleUp)"
                />

                {/* Smaller green candle */}
                <line
                  x1="29"
                  y1="14"
                  x2="29"
                  y2="29"
                  stroke="#22c55e"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <rect
                  x="27.5"
                  y="18"
                  width="3"
                  height="8"
                  rx="1"
                  fill="url(#candleUp)"
                />
              </g>
            </svg>
          </div>

          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              <span className="text-sky-400">XChange</span>
              <span className="text-emerald-400">Hub</span>
            </span>
            <span className="hidden text-[0.6rem] uppercase tracking-[0.26em] text-slate-400 sm:block">
              Currency · Markets · Insights
            </span>
          </div>
        </button>

        {/* CENTER: Simple text tabs (desktop) */}
        <nav className="hidden items-center gap-6 text-xs sm:text-sm md:flex">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`transition-colors ${
                  active
                    ? "text-white font-semibold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* RIGHT: theme toggle + profile/login + mobile hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme toggle (minimal) */}
          <button
            type="button"
            onClick={handleThemeClick}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 bg-transparent text-[0.9rem] text-slate-200 hover:border-sky-500 hover:text-sky-400"
            aria-label="Toggle theme"
          >
            {isDark ? "☀" : "🌙"}
          </button>

          {/* Desktop: Profile dropdown OR Login button */}
          {isAuthenticated ? (
            <div className="relative hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-emerald-500 bg-slate-900 text-[0.7rem] font-semibold text-slate-100">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarInitial
                  )}
                </span>
                <span className="max-w-[180px] truncate text-slate-100">
                  {displayName}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-10 w-48 rounded-xl border border-slate-700 bg-[#020617] p-2 text-xs shadow-xl">
                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="w-full rounded-lg px-3 py-2 text-left text-slate-100 hover:bg-slate-800/80"
                  >
                    View profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenProfile} // will route to LoginPage when logged out
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(56,189,248,0.7)] hover:brightness-110"
            >
              Login
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 bg-transparent text-xs text-slate-100 hover:border-sky-500 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-800 bg-[#020617] px-4 pb-3 pt-2 text-sm shadow-sm md:hidden">
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full rounded-md px-3 py-2 text-left ${
                    active
                      ? "bg-sky-500 text-white"
                      : "text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile profile/login actions */}
          {isAuthenticated ? (
            <div className="mt-3 border-t border-slate-700 pt-2 text-xs">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-emerald-500 bg-slate-900 text-[0.75rem] font-semibold text-slate-100">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarInitial
                  )}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-slate-100">
                    {displayName}
                  </span>
                  {user && (
                    <span className="text-[0.65rem] text-slate-400">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleProfileClick();
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-slate-100 hover:bg-slate-800"
              >
                View profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleLogoutClick();
                }}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="mt-3 border-t border-slate-700 pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenProfile(); // opens LoginPage when logged out
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-slate-100 hover:bg-slate-800"
              >
                Login
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
