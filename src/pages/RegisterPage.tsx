// src/pages/RegisterPage.tsx
import { useState } from "react";
import { auth, createUserWithEmailAndPassword } from "../firebase";
import { updateProfile } from "firebase/auth";

type RegisterPageProps = {
  onRegister?: () => void;
  onBackToLogin?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
};

type Step = 1 | 2 | 3 | 4;

export default function RegisterPage({
  onRegister,
  onBackToLogin,
  onOpenPrivacy,
  onOpenTerms,
}: RegisterPageProps) {
  const [step, setStep] = useState<Step>(1);

  // Step 1 – account details
  const [accountType, setAccountType] = useState<"personal" | "business">(
    "personal"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 – demo verification code
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeInputs, setCodeInputs] = useState(["", "", "", "", "", ""]);

  // Step 3 – region + terms
  const [country, setCountry] = useState("United States");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Step 4 – profile info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [useCase, setUseCase] = useState(
    "I want to track my FX exposure and travel conversions."
  );
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);

  // Shared
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function nextStep() {
    setError(null);
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  }

  function prevStep() {
    setError(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  }

  function handleCodeChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...codeInputs];
    next[index] = value;
    setCodeInputs(next);
  }

  // ---------- VALIDATION ----------

  function validateStep1() {
    if (!email.trim()) {
      setError("Please enter your email.");
      return false;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password || password.length < 6) {
      setError("Password should be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  }

  function validateStep2() {
    const entered = codeInputs.join("");
    if (!generatedCode) {
      setError("We couldn’t generate a code. Please restart registration.");
      return false;
    }
    if (entered.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return false;
    }
    if (entered !== generatedCode) {
      setError("That code doesn’t match. Double-check the email and try again.");
      return false;
    }
    return true;
  }

  function validateStep3() {
    if (!country) {
      setError("Please pick your primary country.");
      return false;
    }
    if (!agreeTerms) {
      setError("You need to agree to the terms to continue.");
      return false;
    }
    return true;
  }

  function validateStep4() {
    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return false;
    }
    if (!lastName.trim()) {
      setError("Please enter your last name.");
      return false;
    }
    return true;
  }

  async function handleContinue() {
    setError(null);

    if (step === 1) {
      if (!validateStep1()) return;

      // demo: “send” a code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      console.log("Demo verification code:", code);
      nextStep();
      return;
    }

    if (step === 2) {
      if (!validateStep2()) return;
      nextStep();
      return;
    }

    if (step === 3) {
      if (!validateStep3()) return;
      nextStep();
      return;
    }

    if (step === 4) {
      await handleSubmitFinal();
    }
  }

  async function handleSubmitFinal() {
    if (!validateStep4()) return;

    try {
      setLoading(true);
      setError(null);

      const cred = await createUserWithEmailAndPassword(auth, email, password);

      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (cred.user && displayName) {
        await updateProfile(cred.user, { displayName });
      }

      console.log("User use-case:", useCase);
      console.log("Newsletter opt-in:", newsletterOptIn);
      console.log("Country:", country);
      console.log("Account type:", accountType);

      if (onRegister) onRegister();
    } catch (err: any) {
      console.error("Register error", err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("We couldn’t create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const stepLabel =
    step === 1
      ? "Account"
      : step === 2
      ? "Verify email"
      : step === 3
      ? "Region & terms"
      : "Profile";

  const stepSubtitle =
    step === 1
      ? "Create your FX workspace login."
      : step === 2
      ? "Enter the 6-digit code we sent (demo)."
      : step === 3
      ? "Tell us where you primarily trade or travel."
      : "Personalize your XChangeHub profile.";

  const primaryButtonLabel =
    step < 4 ? "Continue" : loading ? "Creating account..." : "Create account";

  // ---------- RENDER ----------

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400 via-emerald-300 to-sky-500 opacity-90" />
            <div className="absolute inset-[3px] rounded-full bg-slate-950" />
            <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-slate-950">
              <svg
                viewBox="0 0 40 40"
                className="h-8 w-8 text-sky-400"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="candleUpReg" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                  <linearGradient
                    id="candleDownReg"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>

                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="url(#candleUpReg)"
                  strokeWidth="1.8"
                  opacity="0.85"
                />

                <path
                  d="M 6 26 C 10 18 16 12 23 10 C 27 9 31 9.5 34 11"
                  fill="none"
                  stroke="url(#candleUpReg)"
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
                    fill="url(#candleDownReg)"
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
                    fill="url(#candleUpReg)"
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
                    fill="url(#candleUpReg)"
                  />
                </g>
              </svg>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              <span className="text-sky-600">XChange</span>
              <span className="text-emerald-600">Hub</span>
            </span>
            <span className="text-[0.65rem] uppercase tracking-[0.26em] text-slate-500">
              Currency · Markets · Insights
            </span>
          </div>
        </div>

        <div className="hidden text-xs font-medium text-slate-500 md:block">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-sky-600 underline-offset-2 hover:underline"
          >
            Log in
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 pb-16 pt-4 md:flex-row md:items-stretch md:justify-between md:pt-8">
        {/* Left copy */}
        <section className="flex-1 space-y-6">
          <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[0.7rem] font-medium text-slate-600 ring-1 ring-slate-200">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Create your free XChangeHub account
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Build a{" "}
              <span className="bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                smarter FX workspace
              </span>
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-slate-600">
              Create alerts, watch multiple currency pairs at once, and get a
              clean overview of your FX exposure in a single dashboard.
            </p>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• No card required</li>
            <li>• Real-time FX rates and charts</li>
            <li>• Email alerts when markets hit your levels</li>
          </ul>
        </section>

        {/* Right multi-step card */}
        <section className="mt-0 w-full max-w-md flex-1 md:mt-0">
          <div className="rounded-2xl bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.16)] ring-1 ring-slate-200">
            {/* Step indicator */}
            <div className="flex items-center justify-between text-[0.7rem] text-slate-500">
              <span className="font-semibold uppercase tracking-[0.18em] text-slate-700">
                Step {step} of 4
              </span>
              <span>{stepLabel}</span>
            </div>

            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-[width]"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>

            <div className="mt-4">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">
                {stepLabel}
              </h2>
              <p className="mt-1 text-xs text-slate-500">{stepSubtitle}</p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* STEP CONTENT */}
            <div className="mt-4 space-y-5 text-sm text-slate-800">
              {/* Step 1 – account */}
              {step === 1 && (
                <>
                  <div>
                    <span className="text-xs font-medium text-slate-700">
                      Account type
                    </span>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setAccountType("personal")}
                        className={`rounded-xl border px-3 py-2 text-left transition ${
                          accountType === "personal"
                            ? "border-sky-500 bg-sky-50 text-sky-700"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <span className="block font-semibold">Personal</span>
                        <span className="mt-0.5 block text-[0.68rem] text-slate-500">
                          Ideal for travel, remittance, and retail FX.
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType("business")}
                        className={`rounded-xl border px-3 py-2 text-left transition ${
                          accountType === "business"
                            ? "border-sky-500 bg-sky-50 text-sky-700"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <span className="block font-semibold">Business</span>
                        <span className="mt-0.5 block text-[0.68rem] text-slate-500">
                          For teams managing invoices and FX exposure.
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-email"
                      className="text-xs font-medium text-slate-700"
                    >
                      Work or personal email
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-password"
                      className="text-xs font-medium text-slate-700"
                    >
                      Password
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-confirm"
                      className="text-xs font-medium text-slate-700"
                    >
                      Confirm password
                    </label>
                    <input
                      id="reg-confirm"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      placeholder="Re-enter password"
                    />
                  </div>
                </>
              )}

              {/* Step 2 – verification */}
              {step === 2 && (
                <>
                  <p className="text-xs text-slate-500">
                    We&apos;ve sent a 6-digit verification code to{" "}
                    <span className="font-medium text-slate-800">{email}</span>{" "}
                    (demo only—check the console in dev tools to see it).
                  </p>
                  <div className="mt-4 flex justify-between gap-2">
                    {codeInputs.map((val, idx) => (
                      <input
                        key={idx}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={val}
                        onChange={(e) =>
                          handleCodeChange(idx, e.target.value.trim())
                        }
                        className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 text-center text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-[0.7rem] text-slate-500">
                    Didn&apos;t get a code? This is a front-end demo, so we
                    don&apos;t actually send emails—just restart sign-up or use
                    the code logged in your browser console.
                  </p>
                </>
              )}

              {/* Step 3 – region & terms */}
              {step === 3 && (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-country"
                      className="text-xs font-medium text-slate-700"
                    >
                      Primary country
                    </label>
                    <select
                      id="reg-country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    >
                      <option>United States</option>
                      <option>Canada</option>
                      <option>United Kingdom</option>
                      <option>Eurozone</option>
                      <option>India</option>
                      <option>Australia</option>
                      <option>Singapore</option>
                      <option>United Arab Emirates</option>
                    </select>
                  </div>

                  <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-[0.7rem] text-slate-600">
                    <p>
                      We use your country to show relevant currency pairs and
                      market sessions (e.g., NY, London, or Asia hours).
                    </p>
                    <p>
                      FXFlow is not a broker and does not execute trades—we help
                      you monitor FX rates and plan your decisions.
                    </p>
                  </div>

                  <label className="mt-2 flex items-start gap-2 text-[0.7rem] text-slate-600">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={onOpenTerms}
                        className="text-sky-600 underline-offset-2 hover:underline"
                      >
                        Terms of Use
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onClick={onOpenPrivacy}
                        className="text-sky-600 underline-offset-2 hover:underline"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                </>
              )}

              {/* Step 4 – profile */}
              {step === 4 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="reg-first"
                        className="text-xs font-medium text-slate-700"
                      >
                        First name
                      </label>
                      <input
                        id="reg-first"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        placeholder="Rohit"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="reg-last"
                        className="text-xs font-medium text-slate-700"
                      >
                        Last name
                      </label>
                      <input
                        id="reg-last"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        placeholder="Kanala"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="reg-use"
                      className="text-xs font-medium text-slate-700"
                    >
                      How will you use XChangeHub?
                    </label>
                    <textarea
                      id="reg-use"
                      rows={3}
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <label className="mt-1 flex items-start gap-2 text-[0.7rem] text-slate-600">
                    <input
                      type="checkbox"
                      checked={newsletterOptIn}
                      onChange={(e) => setNewsletterOptIn(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>
                      I agree to receive market insights and occasional product
                      updates from FXFlow. You can unsubscribe at any time.
                    </span>
                  </label>
                </>
              )}
            </div>

            {/* BUTTONS */}
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleContinue}
                disabled={loading}
                className="w-full rounded-xl bg-sky-500 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {primaryButtonLabel}
              </button>

              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
              )}

              <button
                type="button"
                onClick={onBackToLogin}
                className="mt-1 block w-full text-center text-xs font-medium text-sky-600 hover:text-sky-500 md:hidden"
              >
                Already have an account? Log in
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
