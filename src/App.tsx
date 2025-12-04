// src/App.tsx
import { useEffect, useRef, useState } from "react";
import "flag-icons/css/flag-icons.min.css";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MainPage from "./pages/MainPage";
import ProfilePage from "./pages/ProfilePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import CurrencyChartsFullPage from "./pages/CurrencyChartsFullPage";

import { auth } from "./firebase";
import {
  signOut,
  updateEmail,
  updatePassword,
  onAuthStateChanged,
} from "firebase/auth";

type View =
  | "login"
  | "register"
  | "privacy"
  | "main"
  | "profile"
  | "chartsFull";

export interface UserProfile {
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

interface LoginEntry {
  id: number;
  timestamp: string; // ISO
}

export default function App() {
  // Start on MAIN so the landing dashboard is visible first
  const [view, setView] = useState<View>("main");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  const [initializing, setInitializing] = useState(true);

  // theme for “inside app” pages (main + profile + charts full)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("fx-theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });

  // currencies used on the full charts page
  const [chartsFromCurrency, setChartsFromCurrency] = useState("USD");
  const [chartsToCurrency, setChartsToCurrency] = useState("INR");

  // So we only add one "login" entry per uid per session
  const lastUserIdRef = useRef<string | null>(null);

  // ===== THEME PERSIST =====
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("fx-theme", theme);
    }
  }, [theme]);

  // ===== BODY THEME CLASS (login/register always light) =====
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (view === "login" || view === "register") {
      // Auth screens: force light mode
      document.body.classList.remove("dark");
    } else {
      // Inside app: follow theme
      if (theme === "dark") {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
    }
  }, [view, theme]);

  // ========== AUTH STATE LISTENER ==========
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const { uid, email, displayName, photoURL } = firebaseUser;

        const safeEmail = email ?? "unknown@example.com";
        const fallbackName =
          safeEmail.split("@")[0] || displayName || "FX User";
        const safeDisplayName = (displayName || fallbackName).trim();

        setUser({
          email: safeEmail,
          displayName: safeDisplayName,
          avatarUrl: photoURL ?? null,
        });

        if (lastUserIdRef.current !== uid) {
          lastUserIdRef.current = uid;
          setLoginHistory((prev) => [
            { id: Date.now(), timestamp: new Date().toISOString() },
            ...prev,
          ]);
        }

        // Keep user on profile/privacy/chartsFull if they’re already there, else go to main
        setView((prev) =>
          prev === "profile" || prev === "privacy" || prev === "chartsFull"
            ? prev
            : "main"
        );
      } else {
        // Signed out / no session
        setUser(null);
        lastUserIdRef.current = null;

        // If the user is on a protected view, send them back to main;
        // otherwise keep whatever they were already seeing (e.g. login/register/main).
        setView((prev) =>
          prev === "profile" || prev === "chartsFull" || prev === "privacy"
            ? "main"
            : prev
        );
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  function handleAuthCompleted() {
    // After login/register success, go to landing dashboard
    setView("main");
  }

  function handleUpdateProfile(updates: Partial<UserProfile>) {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  async function handleUpdateEmail(newEmail: string) {
    const current = auth.currentUser;
    if (!current) throw new Error("No authenticated user.");

    await updateEmail(current, newEmail);
    setUser((prev) => (prev ? { ...prev, email: newEmail } : prev));
  }

  async function handleUpdatePassword(newPassword: string) {
    const current = auth.currentUser;
    if (!current) throw new Error("No authenticated user.");

    await updatePassword(current, newPassword);
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      setUser(null);
      // After logout, show the main landing page (with Login instead of profile)
      setView("main");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  }

  // ========== INITIAL LOADING ==========
  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="rounded-3xl border border-slate-800 bg-[#06101f] px-8 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.75)]">
          <p className="text-sm text-slate-300">Checking your session…</p>
        </div>
      </div>
    );
  }

  const loginHistoryTimestamps = loginHistory.map((entry) => entry.timestamp);

  // ========== VIEW ROUTING ==========

  if (view === "login") {
    return (
      <LoginPage
        onLogin={handleAuthCompleted}
        onGoToRegister={() => setView("register")}
      />
    );
  }

  if (view === "register") {
    return (
      <RegisterPage
        onRegister={handleAuthCompleted}
        onBackToLogin={() => setView("login")}
        onOpenPrivacy={() => setView("privacy")}
        onOpenTerms={() =>
          window.open("https://example.com/terms", "_blank", "noopener")
        }
      />
    );
  }

  if (view === "privacy") {
    return <PrivacyPolicyPage onBack={() => setView("register")} />;
  }

  if (view === "profile" && user) {
    return (
      <ProfilePage
        user={user}
        onBack={() => setView("main")}
        onUpdateProfile={handleUpdateProfile}
        onUpdateEmail={handleUpdateEmail}
        onUpdatePassword={handleUpdatePassword}
        loginHistory={loginHistoryTimestamps}
      />
    );
  }

  // full-page charts view
  if (view === "chartsFull") {
    return (
      <div
        className={`min-h-screen ${
          theme === "dark"
            ? "bg-slate-950 text-slate-50"
            : "bg-white text-slate-900"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-10">
          <CurrencyChartsFullPage
            fromCurrency={chartsFromCurrency}
            toCurrency={chartsToCurrency}
            setFromCurrency={setChartsFromCurrency}
            setToCurrency={setChartsToCurrency}
          />

          <div className="mt-10 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setView("main")}
              className={`rounded-full px-5 py-2 border text-sm font-medium transition ${
                theme === "dark"
                  ? "border-slate-600 text-slate-200 hover:bg-slate-800"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              ← Back to dashboard
            </button>

            {/* simple theme toggle here too */}
            <button
              type="button"
              onClick={() =>
                setTheme((prev) => (prev === "dark" ? "light" : "dark"))
              }
              className="rounded-full px-4 py-2 text-xs font-semibold border border-slate-500/60"
            >
              {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // view === "main"
  return (
    <MainPage
      onLogout={handleLogout}
      // When logged in: open profile page
      // When logged out: open login page (used by "Login" button in Navbar)
      onOpenProfile={() => {
        if (user) {
          setView("profile");
        } else {
          setView("login");
        }
      }}
      user={user}
      // opens the full charts page
      onOpenChartsFull={() => setView("chartsFull")}
      // theme props so Navbar/logo can toggle
      theme={theme}
      setTheme={setTheme}
    />
  );
}
