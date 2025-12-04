// src/pages/LoginPage.tsx
import React, { useState } from "react";
import {
  auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
} from "../firebase";

type LoginPageProps = {
  onLogin?: () => void;
  onGoToRegister?: () => void;
};

export default function LoginPage({
  onLogin,
  onGoToRegister,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setBusy(true);
      await signInWithEmailAndPassword(auth, email, password);
      if (onLogin) onLogin();
    } catch (err: any) {
      console.error("Email login error", err);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password, please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    try {
      setBusy(true);
      await signInWithPopup(auth, googleProvider);
      if (onLogin) onLogin();
    } catch (err) {
      console.error("Google login error", err);
      setError("Google sign-in was cancelled or failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Header strip */}
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400 via-emerald-300 to-sky-500 opacity-90" />
            <div className="absolute inset-[3px] rounded-full bg-slate-950" />
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-950">
              <svg
                viewBox="0 0 40 40"
                className="h-8 w-8 text-sky-400"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="candleUp" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                  <linearGradient id="candleDown" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>

                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="url(#candleUp)"
                  strokeWidth="1.8"
                  opacity="0.85"
                />

                <path
                  d="M 6 26 C 10 18 16 12 23 10 C 27 9 31 9.5 34 11"
                  fill="none"
                  stroke="url(#candleUp)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <g>
                  <line
                    x1="11"
                    y1="12"
                    x2="11"
                    y2="27"
                    stroke="#f97316"
                    strokeWidth="1.5"
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

                  <line
                    x1="20"
                    y1="9"
                    x2="20"
                    y2="26"
                    stroke="#22c55e"
                    strokeWidth="1.5"
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

                  <line
                    x1="29"
                    y1="14"
                    x2="29"
                    y2="29"
                    stroke="#22c55e"
                    strokeWidth="1.5"
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
          </div>

          <div className="flex flex-col">
            <span className="text-4xl font-semibold tracking-tight text-slate-900">
              <span className="text-sky-600">XChange</span>
              <span className="text-emerald-600">Hub</span>
            </span>
            <span className="text-[0.70rem] uppercase tracking-[0.26em] text-slate-500">
              Currency · Markets · Insights
            </span>
          </div>
        </div>

        <div className="hidden text-md font-medium text-slate-500 md:block">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onGoToRegister}
            className="text-sky-600 underline-offset-2 hover:underline"
          >
            Sign up
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 pb-16 pt-4 md:flex-row md:items-stretch md:justify-between md:pt-10">
        {/* Left hero copy */}
        <section className="flex-1 space-y-6">
          <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[0.7rem] font-medium text-slate-600 ring-1 ring-slate-200">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Sign in to continue to your FX workspace
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Stay on top of every{" "}
              <span className="bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                currency move
              </span>
            </h1>
            <p className="max-w-lg text-md leading-relaxed text-slate-600">
              Log in to monitor live FX rates, track your favorite pairs, and
              set personalized alerts so you never miss a move in the markets.
            </p>
          </div>

          <div className="grid max-w-md grid-cols-3 gap-3 text-[0.7rem] text-slate-600">
            <div className="rounded-xl bg-white p-3 shadow-md ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">Live FX overview</p>
              <p className="mt-1 text-[0.7rem]">
                Watch real-time rates update as markets move.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-3 shadow-md ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">Smart alerts</p>
              <p className="mt-1 text-[0.7rem]">
                Get notified when your target levels are hit.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-3 shadow-md ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">Clean insights</p>
              <p className="mt-1 text-[0.7rem]">
                Turn noisy markets into a clear dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* Right login card */}
        <section className="mt-4 w-full max-w-xl max-h-xl flex-1 md:mt-0">
          <div className="rounded-3xl bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.16)] ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in with your email or continue with Google.
            </p>

            {/* Error banner */}
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleEmailLogin}>
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-md text-slate-900 shadow-md outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  // placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-md text-slate-900 shadow-md outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  // placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-3.5 text-2xl font-medium text-white shadow-md transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[0.65rem] uppercase text-slate-400">
                or
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={busy}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-md font-medium text-slate-800 shadow-md transition hover:border-sky-500 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-2 3.1l3.3 2.6c1.9-1.8 3-4.4 3-7.5 0-.7-.1-1.4-.2-2.1H12z"
                  />
                  <path
                    fill="#34A853"
                    d="M6.6 14.3 5.9 14.8l-2.6 2C5.1 19.9 8.3 21.8 12 21.8c2.7 0 5-.9 6.6-2.5l-3.3-2.6c-.9.6-2 1-3.3 1-2.5 0-4.6-1.7-5.4-4z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M3.3 8.1C2.7 9.4 2.4 10.7 2.4 12s.3 2.6.9 3.9c.8-2.3 2.9-4 5.4-4.1V7.4H7.2c-1.8 0-3.3 1-3.9 2.4z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 5.5c1.5 0 2.8.5 3.8 1.4l2.8-2.8C16.9 2.4 14.7 1.5 12 1.5 8.3 1.5 5.1 3.4 3.3 6.1L6.3 8c.7-2.3 2.9-3.9 5.7-3.9z"
                  />
                </svg>
              </span>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              className="mt-4 block w-full text-center text-xs font-medium text-sky-600 hover:text-sky-500"
            >
              Forgot password?
            </button>

            <div className="mt-4 block text-center text-xs text-slate-500 md:hidden">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={onGoToRegister}
                className="font-medium text-sky-600 underline-offset-2 hover:underline"
              >
                Sign up
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">
            Currency · Markets · Insights
          </p>
        </section>
      </main>
    </div>
  );
}
