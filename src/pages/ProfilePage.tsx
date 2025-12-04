// src/pages/ProfilePage.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Activity,
  Bell,
  ShieldCheck,
  Smartphone,
  LogOut,
} from "lucide-react";
import type { UserProfile } from "../App";

type ProfilePageProps = {
  user: UserProfile;
  onBack: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onUpdateEmail: (newEmail: string) => Promise<void> | void;
  onUpdatePassword: (newPassword: string) => Promise<void> | void;
  // ISO timestamps of recent logins (newest first)
  loginHistory: string[];
};

type RateAlertCondition = "above" | "below";

type RateAlert = {
  id: number;
  pair: string;
  condition: RateAlertCondition;
  value: number;
  active: boolean;
};

const mockAlerts: RateAlert[] = [
  { id: 1, pair: "USD → INR", condition: "above", value: 83.0, active: true },
  { id: 2, pair: "EUR → USD", condition: "below", value: 1.05, active: false },
];

const MAX_AVATAR_SIZE_MB = 2;

// ===== FX STATE & FALLBACK (24h day rates) =====
type FxRatesState = {
  usdInr: number | null;
  eurUsd: number | null;
  usdAed: number | null;
  asOfDate: string | null; // date string from API
};

// Safe sample values if the API is down.
// These will be replaced as soon as a real daily rate arrives.
const FX_FALLBACK: FxRatesState = {
  usdInr: 83.1,
  eurUsd: 1.09,
  usdAed: 3.67,
  asOfDate: null,
};

export default function ProfilePage({
  user,
  onBack,
  onUpdateProfile,
  onUpdateEmail,
  onUpdatePassword,
  loginHistory,
}: ProfilePageProps) {
  // --- main profile state shown on card ---
  const [displayName, setDisplayName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email);
  const [about, setAbout] = useState<string>("");

  const [socials, setSocials] = useState<{
    twitter: string;
    linkedin: string;
    instagram: string;
  }>({
    twitter: "",
    linkedin: "",
    instagram: "",
  });

  // Alerts (simple toggle demo)
  const [alerts, setAlerts] = useState<RateAlert[]>(mockAlerts);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatarUrl ?? null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // 🔹 Current device location (for "This device" session)
  const [currentLocation, setCurrentLocation] = useState<string>(
    "Detecting location…"
  );

  // 🔹 FX rates: start from fallback so UI always has numbers
  const [fxRates, setFxRates] = useState<FxRatesState>(FX_FALLBACK);
  const [fxError, setFxError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user.displayName);
    setEmail(user.email);
    setAvatarPreview(user.avatarUrl ?? null);
  }, [user.displayName, user.email, user.avatarUrl]);

  // ===== GEOLOCATION + REVERSE GEOCODING =====
  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setCurrentLocation("Location not available");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        (async () => {
          try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
            const res = await fetch(url, {
              headers: {
                Accept: "application/json",
              },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            const addr = data.address || {};
            const city =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.hamlet ||
              addr.suburb;
            const state = addr.state || addr.region;
            const countryCode = addr.country_code
              ? String(addr.country_code).toUpperCase()
              : null;

            const parts = [city, state, countryCode].filter(Boolean);
            if (parts.length > 0) {
              setCurrentLocation(parts.join(", "));
            } else {
              setCurrentLocation("Location detected");
            }
          } catch (err) {
            console.error("Reverse geocoding failed", err);
            setCurrentLocation(
              `Lat ${latitude.toFixed(2)}, Lon ${longitude.toFixed(2)}`
            );
          }
        })();
      },
      (err) => {
        console.error("Geolocation error", err);
        if (err.code === err.PERMISSION_DENIED) {
          setCurrentLocation("Location access denied");
        } else {
          setCurrentLocation("Could not detect location");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
      }
    );
  }, []);

  // ===== DAILY FX RATES – same style as quick converter =====
  useEffect(() => {
    let cancelled = false;

    async function fetchRates() {
      try {
        setFxError(null);

        const [usdInrRes, eurUsdRes, usdAedRes] = await Promise.all([
          fetch("https://api.frankfurter.app/latest?from=USD&to=INR"),
          fetch("https://api.frankfurter.app/latest?from=EUR&to=USD"),
          fetch("https://api.frankfurter.app/latest?from=USD&to=AED"),
        ]);

        if (!usdInrRes.ok || !eurUsdRes.ok || !usdAedRes.ok) {
          throw new Error("Rate API error");
        }

        const usdInrData = await usdInrRes.json();
        const eurUsdData = await eurUsdRes.json();
        const usdAedData = await usdAedRes.json();

        if (cancelled) return;

        setFxRates({
          usdInr:
            typeof usdInrData.rates?.INR === "number"
              ? usdInrData.rates.INR
              : FX_FALLBACK.usdInr,
          eurUsd:
            typeof eurUsdData.rates?.USD === "number"
              ? eurUsdData.rates.USD
              : FX_FALLBACK.eurUsd,
          usdAed:
            typeof usdAedData.rates?.AED === "number"
              ? usdAedData.rates.AED
              : FX_FALLBACK.usdAed,
          asOfDate: usdInrData.date ?? null,
        });
      } catch (err) {
        console.error("FX rate fetch failed:", err);
        if (!cancelled) {
          // Keep fallback values; just show an info message
          setFxError("using last 24h sample rate.");
        }
      }
    }

    fetchRates();
    return () => {
      cancelled = true;
    };
  }, []);

  // Messages
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [editTwitter, setEditTwitter] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [socialError, setSocialError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login history formatting
  const formattedHistory = useMemo(() => {
    if (!loginHistory || loginHistory.length === 0) return [];
    return loginHistory.slice(0, 5).map((ts) => {
      try {
        return new Date(ts).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return ts;
      }
    });
  }, [loginHistory]);

  const lastLoginDisplay = formattedHistory[0] ?? "No login activity yet.";

  // -------- Avatar upload ----------
  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function processAvatarFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file (PNG, JPG, etc.).");
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_AVATAR_SIZE_MB) {
      setAvatarError(`File is too large. Max size is ${MAX_AVATAR_SIZE_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarError(null);
      setAvatarPreview(result);
      onUpdateProfile({ avatarUrl: result });
      setMessage("Profile picture updated.");
    };
    reader.onerror = () => {
      setAvatarError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  }

  function handleAvatarInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processAvatarFile(file);
  }

  // -------- Alerts toggle ----------
  function handleToggleAlert(id: number) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  }

  // -------- Edit modal ----------
  function openEditModal() {
    setEditName(displayName);
    setEditEmail(email);
    setEditAbout(about.replace(/^"|"$/g, ""));
    setEditTwitter(socials.twitter);
    setEditLinkedin(socials.linkedin);
    setEditInstagram(socials.instagram);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSocialError(null);
    setPasswordError(null);
    setMessage(null);
    setError(null);
    setIsEditOpen(true);
  }

  function closeEditModal() {
    if (!savingProfile) {
      setIsEditOpen(false);
    }
  }

  function cleanLinkText(url: string) {
    let s = url.trim();
    s = s.replace(/^https?:\/\//i, "");
    s = s.replace(/^www\./i, "");
    if (s.endsWith("/")) s = s.slice(0, -1);
    return s;
  }

  async function handleSaveProfile() {
    setSocialError(null);
    setPasswordError(null);
    setMessage(null);
    setError(null);

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();
    const twitterVal = editTwitter.trim();
    const linkedinVal = editLinkedin.trim();
    const instagramVal = editInstagram.trim();

    const socialValues = [twitterVal, linkedinVal, instagramVal].filter(
      (v) => v !== ""
    );
    if (socialValues.length > 2) {
      setSocialError("You can only save up to two social links.");
      return;
    }

    const isPasswordChanging = oldPassword || newPassword || confirmPassword;
    if (isPasswordChanging) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        setPasswordError(
          "Please fill old, new, and confirm password to change it."
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError("New password and confirmation do not match.");
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError("New password should be at least 6 characters.");
        return;
      }
    }

    setSavingProfile(true);
    try {
      if (trimmedName && trimmedName !== displayName) {
        onUpdateProfile({ displayName: trimmedName });
        setDisplayName(trimmedName);
      }

      setAbout(editAbout ? `"${editAbout}"` : about);
      setSocials({
        twitter: twitterVal,
        linkedin: linkedinVal,
        instagram: instagramVal,
      });

      if (trimmedEmail && trimmedEmail !== email) {
        await onUpdateEmail(trimmedEmail);
        setEmail(trimmedEmail);
      }

      if (isPasswordChanging) {
        await onUpdatePassword(newPassword);
      }

      setMessage("Profile updated.");
      setIsEditOpen(false);
    } catch {
      setError("Could not update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  // -------- Render helpers ----------
  const activeSocials = [
    socials.twitter && { type: "twitter", url: socials.twitter },
    socials.linkedin && { type: "linkedin", url: socials.linkedin },
    socials.instagram && { type: "instagram", url: socials.instagram },
  ].filter(Boolean) as {
    type: "twitter" | "linkedin" | "instagram";
    url: string;
  }[];

  const usdInrDisplay =
    fxRates.usdInr != null ? fxRates.usdInr.toFixed(2) : "--";
  const eurUsdDisplay =
    fxRates.eurUsd != null ? fxRates.eurUsd.toFixed(4) : "--";
  const usdAedDisplay =
    fxRates.usdAed != null ? fxRates.usdAed.toFixed(2) : "--";

  const rateSubtitle =
    fxRates.asOfDate && !fxError
      ? `As of ${fxRates.asOfDate}`
      : fxError
      ? "Using last 24h sample rate."
      : "Latest available rate";

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-xs font-medium text-slate-500 hover:text-slate-700"
      >
        ← Back to dashboard
      </button>

      <div className="max-w-5xl mx-auto space-y-5">
        {/* MAIN GRID: left profile card + right dashboard */}
        <div className="grid gap-5 lg:grid-cols-[320px,minmax(0,1fr)]">
          {/* LEFT: profile card */}
          <aside className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 flex flex-col items-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div
                className="w-28 h-28 rounded-full bg-slate-700 text-white flex items-center justify-center text-4xl font-semibold border border-slate-900 overflow-hidden bg-cover bg-center"
                style={
                  avatarPreview
                    ? { backgroundImage: `url(${avatarPreview})` }
                    : undefined
                }
              >
                {!avatarPreview && displayName.charAt(0).toUpperCase()}
              </div>
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute -right-1 -bottom-1 w-9 h-9 rounded-full bg-white border border-slate-900 shadow flex items-center justify-center"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  stroke="currentColor"
                  strokeWidth={2}
                  fill="none"
                >
                  <path d="M4 7h3l1-2h8l1 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarInputChange}
              />
            </div>

            <h1 className="text-lg font-semibold">{displayName}</h1>
            <p className="text-xs text-slate-500 mb-1">
              @{displayName.toLowerCase().replace(/\s+/g, "")}
            </p>
            <p className="text-xs text-slate-600 mb-3">{email}</p>

            <p className="text-xs text-center text-slate-600 mb-4 px-2">
              {about}
            </p>

            <button
              type="button"
              onClick={openEditModal}
              className="mb-4 inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-4 py-1.5 text-xs font-medium hover:bg-slate-100"
            >
              Edit profile
            </button>

            {/* Social links */}
            <div className="mt-1 w-full space-y-2">
              {activeSocials.slice(0, 2).map((s) => (
                <div
                  key={s.type}
                  className="flex items-center gap-2 text-xs text-slate-700"
                >
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-semibold"
                    style={
                      s.type === "twitter"
                        ? { backgroundColor: "#000000" }
                        : s.type === "linkedin"
                        ? { backgroundColor: "#0a66c2" }
                        : {
                            background:
                              "radial-gradient(circle at 30% 30%, #fdf497 0, #fd5949 40%, #d6249f 60%, #285aeb 100%)",
                          }
                    }
                  >
                    {s.type === "twitter"
                      ? "X"
                      : s.type === "linkedin"
                      ? "in"
                      : "IG"}
                  </a>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-700 hover:underline break-all"
                  >
                    {cleanLinkText(s.url)}
                  </a>
                </div>
              ))}
            </div>

            {avatarError && (
              <p className="mt-3 text-[11px] text-red-500">{avatarError}</p>
            )}
          </aside>

          {/* RIGHT: dashboard-style cards */}
          <main className="space-y-4">
            {/* top row */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                  <span>Default pair</span>
                  <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px]">
                    USD → INR
                  </span>
                </div>
                <h2 className="text-base font-semibold mb-1">
                  Used for quick conversions
                </h2>
                <p className="text-xs text-slate-500">
                  Set your most used pair for faster checks and your personalized
                  home dashboard.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                  <span>Today&apos;s USD → INR</span>
                  <span>FX • Spot</span>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{usdInrDisplay}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {rateSubtitle}
                  </p>
                  {fxError && (
                    <p className="mt-1 text-[10px] text-amber-500">{fxError}</p>
                  )}
                  <div className="mt-2 h-10 rounded-lg bg-slate-100 relative overflow-hidden">
                    <svg
                      viewBox="0 0 100 40"
                      className="absolute inset-0 text-emerald-500"
                      preserveAspectRatio="none"
                    >
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        points="0,30 15,24 30,28 45,16 60,20 75,10 90,14 100,6"
                      />
                    </svg>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onBack}
                  className="mt-3 inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Back to dashboard
                </button>
              </div>
            </div>

            {/* middle row: alerts + security */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Rate alerts */}
              <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                  <span className="inline-flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    Rate alerts
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px]">
                    {alerts.filter((a) => a.active).length} Active
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{alert.pair}</span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border ${
                              alert.active
                                ? "border-emerald-500 text-emerald-600 bg-emerald-50"
                                : "border-slate-300 text-slate-500 bg-white"
                            }`}
                          >
                            {alert.active ? "Active" : "Paused"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-slate-500">
                          Alert me when{" "}
                          <span className="font-semibold">
                            {alert.condition === "above" ? "above" : "below"}
                          </span>{" "}
                          <span className="font-mono">{alert.value}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleAlert(alert.id)}
                        className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold hover:border-emerald-500 hover:text-emerald-600"
                      >
                        {alert.active ? "Pause" : "Enable"}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-1 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-[11px] text-slate-500 hover:border-emerald-500 hover:text-emerald-600"
                  >
                    + Add new alert
                  </button>
                </div>
              </div>

              {/* Security & activity */}
              <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow space-y-3 text-xs">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Security & activity
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      Two-factor authentication
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Add an extra login step to keep your FX account secure.
                    </p>
                  </div>
                  <button className="rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-600">
                    Enable
                  </button>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-600 mb-1">
                    Recent sessions
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          <Smartphone className="w-3 h-3 text-slate-500" />
                          Windows PC • Chrome
                          <span className="rounded-full bg-emerald-50 border border-emerald-400 px-2 py-0.5 text-[10px] text-emerald-700">
                            This device
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {currentLocation} • {lastLoginDisplay}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          <Smartphone className="w-3 h-3 text-slate-500" />
                          MacBook Pro • Safari
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Tampa, USA • Yesterday • 9:12 PM
                        </p>
                      </div>
                      <button className="rounded-full border border-slate-300 px-3 py-1 text-[10px] font-semibold hover:border-red-400 hover:text-red-500">
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-600 mb-1">
                    Recent login activity
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {formattedHistory.length === 0 ? (
                      <p className="text-[11px] text-slate-500">
                        No login activity yet.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-[11px] text-slate-600">
                        {formattedHistory.map((entry, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{entry}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-600 mb-1">
                    Recent FX activity
                  </p>
                  <ul className="space-y-1 text-[11px] text-slate-600">
                    <li>
                      • USD → INR • 250.00 • {usdInrDisplay} • Today, 11:30 AM
                    </li>
                    <li>
                      • EUR → USD • 120.00 • {eurUsdDisplay} • Yesterday, 5:42 PM
                    </li>
                    <li>
                      • USD → AED • 500.00 • {usdAedDisplay} • 2 days ago
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* bottom row: favourites + (spacer) */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                  <span>Favorite currencies</span>
                  <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px]">
                    Up to 6 pairs
                  </span>
                </div>
                <p className="text-sm font-semibold mb-2">
                  Pinned for quick access
                </p>
                <div className="flex flex-wrap gap-2">
                  {["USD", "INR", "EUR", "GBP"].map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hidden md:block" />
            </div>

            {/* live bar */}
            <footer className="mt-2 bg-white rounded-full border border-slate-200 px-4 py-3 flex flex-wrap gap-4 items-center shadow">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                <Activity className="w-3 h-3" />
                Live market snapshot
              </div>
              <div className="flex flex-wrap gap-4 font-mono text-xs">
                <Ticker
                  label="USD → INR"
                  value={usdInrDisplay}
                  change="+0.00%"
                  positive
                />
                <Ticker
                  label="EUR → USD"
                  value={eurUsdDisplay}
                  change="+0.00%"
                />
                <Ticker
                  label="USD → AED"
                  value={usdAedDisplay}
                  change="0.00%"
                  neutral
                />
              </div>
            </footer>
          </main>
        </div>

        {/* global message area */}
        {(message || error) && (
          <div className="text-xs">
            {message && <p className="text-emerald-600">{message}</p>}
            {error && <p className="text-red-500">{error}</p>}
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 text-sm">
            <h2 className="text-base font-semibold mb-3">Edit profile</h2>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  About
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none resize-vertical focus:border-sky-500"
                  value={editAbout}
                  onChange={(e) => setEditAbout(e.target.value)}
                  placeholder="Tell people about yourself…"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                You can add up to <strong>2</strong> social links. Leave fields
                empty if you don&apos;t want that link.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Twitter / X
                </label>
                <input
                  type="url"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={editTwitter}
                  onChange={(e) => setEditTwitter(e.target.value)}
                  placeholder="https://x.com/username"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LinkedIn
                </label>
                <input
                  type="url"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={editLinkedin}
                  onChange={(e) => setEditLinkedin(e.target.value)}
                  placeholder="https://www.linkedin.com/in/username"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instagram
                </label>
                <input
                  type="url"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={editInstagram}
                  onChange={(e) => setEditInstagram(e.target.value)}
                  placeholder="https://www.instagram.com/username"
                />
              </div>

              {socialError && (
                <p className="text-[11px] text-red-500">{socialError}</p>
              )}

              <p className="text-[11px] text-slate-500">
                To change your password, fill in all three fields. Leave them
                empty to keep your current password.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Old password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm new password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-[11px] text-sky-600 hover:underline"
              >
                {showPassword ? "Hide passwords" : "Show passwords"}
              </button>

              {passwordError && (
                <p className="text-[11px] text-red-500">{passwordError}</p>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingProfile}
                className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700 border border-slate-300 hover:bg-slate-200 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="rounded-full bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {savingProfile ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Small ticker component for footer */
const Ticker: React.FC<{
  label: string;
  value: string;
  change: string;
  positive?: boolean;
  neutral?: boolean;
}> = ({ label, value, change, positive, neutral }) => {
  const color = neutral
    ? "text-slate-500"
    : positive
    ? "text-emerald-600"
    : "text-red-500";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span>{value}</span>
      <span className={`text-[11px] ${color}`}>{change}</span>
    </div>
  );
};
