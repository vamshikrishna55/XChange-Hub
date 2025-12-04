// src/pages/PrivacyPolicyPage.tsx

type PrivacyPolicyPageProps = {
  onBack?: () => void;
};

export default function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-sky-700">XChangeHub</span>
            <span className="text-sm text-slate-400">Help &amp; Legal</span>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-sky-600 hover:text-sky-700"
            >
              Close ✕
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl gap-8 px-4 py-8">
        {/* Sidebar nav */}
        <aside className="hidden w-64 text-sm text-slate-600 md:block">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Privacy notice
          </h2>
          <nav className="space-y-1">
            <a href="#intro" className="block py-1 hover:text-sky-700">
              1. Introduction
            </a>
            <a href="#data" className="block py-1 hover:text-sky-700">
              2. Data we collect
            </a>
            <a href="#use" className="block py-1 hover:text-sky-700">
              3. How we use your data
            </a>
            <a href="#sharing" className="block py-1 hover:text-sky-700">
              4. Sharing &amp; transfers
            </a>
            <a href="#rights" className="block py-1 hover:text-sky-700">
              5. Your rights &amp; choices
            </a>
            <a href="#security" className="block py-1 hover:text-sky-700">
              6. Security &amp; retention
            </a>
            <a href="#contact" className="block py-1 hover:text-sky-700">
              7. Contact us
            </a>
          </nav>
        </aside>

        {/* Article */}
        <article className="flex-1 max-w-2xl">
          <header className="mb-6 border-b border-slate-200 pb-4">
            <p className="mb-1 text-xs uppercase tracking-[0.16em] text-slate-500">
              XChangeHub Global Privacy Notice
            </p>
            <h1 className="mb-1 text-2xl font-semibold">
              How we handle your personal information
            </h1>
            <p className="text-xs text-slate-500">
              Last updated: 01 December 2025
            </p>
          </header>

          {/* 1. Introduction */}
          <section id="intro" className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">1. Introduction</h2>
            <p className="text-sm leading-relaxed text-slate-700">
              This notice explains how XChangeHub collects, uses, and protects
              personal information when you create an account, use our currency
              tools, or otherwise interact with our services. It is a template
              for your project only — please replace this content with your own
              legal wording before going live.
            </p>
          </section>

          {/* 2. Data we collect */}
          <section id="data" className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">2. Data we collect</h2>
            <p className="mb-2 text-sm leading-relaxed text-slate-700">
              Depending on how you use XChangeHub, we may process information
              such as:
            </p>
            <ul className="space-y-1 list-disc pl-5 text-sm leading-relaxed text-slate-700">
              <li>Account details (name, email, password, country).</li>
              <li>
                Profile details you choose to add (saved alerts, watchlists,
                preferences).
              </li>
              <li>
                Technical information such as IP address, browser type, and
                device identifiers.
              </li>
              <li>
                Usage information about how you interact with pages, charts, and
                features.
              </li>
              <li>
                Communication data when you contact us for support or feedback.
              </li>
            </ul>
          </section>

          {/* 3. How we use your data */}
          <section id="use" className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">
              3. How we use your data
            </h2>
            <p className="mb-2 text-sm leading-relaxed text-slate-700">
              In a real deployment, this section should clearly describe your
              purposes for processing personal data. Typical examples include:
            </p>
            <ul className="space-y-1 list-disc pl-5 text-sm leading-relaxed text-slate-700">
              <li>Creating and maintaining your account and login sessions.</li>
              <li>
                Providing currency tools, charts, alerts, and other features you
                request.
              </li>
              <li>
                Personalizing your experience, such as remembering currency
                pairs and settings.
              </li>
              <li>
                Monitoring performance, troubleshooting issues, and improving
                the service.
              </li>
              <li>
                Sending important account or security notices, and (if you opt
                in) product updates or newsletters.
              </li>
            </ul>
          </section>

          {/* 4. Sharing & transfers */}
          <section id="sharing" className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">
              4. Sharing &amp; international transfers
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              For a production system, you should describe which service
              providers you use (for example cloud hosting, analytics, or email
              delivery), when you share data with them, and how you protect
              information if it is processed outside the user&apos;s country.
              Include references to any standard contractual clauses or other
              safeguards you rely on.
            </p>
          </section>

          {/* 5. Rights & choices */}
          <section id="rights" className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">
              5. Your rights &amp; choices
            </h2>
            <p className="mb-2 text-sm leading-relaxed text-slate-700">
              Depending on your location and applicable law (for example GDPR or
              CCPA), users may have rights to:
            </p>
            <ul className="space-y-1 list-disc pl-5 text-sm leading-relaxed text-slate-700">
              <li>Access a copy of their personal data.</li>
              <li>Request corrections to inaccurate information.</li>
              <li>Request deletion of certain data.</li>
              <li>
                Object to or restrict certain types of processing, such as
                direct marketing.
              </li>
              <li>
                Withdraw consent where processing is based on consent, without
                affecting past processing.
              </li>
            </ul>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              In your final policy, explain clearly how users can exercise these
              rights and any limitations that may apply.
            </p>
          </section>

          {/* 6. Security & retention */}
          <section id="security" className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">
              6. Security &amp; data retention
            </h2>
            <p className="mb-2 text-sm leading-relaxed text-slate-700">
              Here you should describe the types of security measures you use to
              protect personal data (such as encryption, access controls, and
              monitoring), and how long you keep different categories of data.
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              As a guideline, you should retain data only for as long as
              necessary to provide your services, comply with legal obligations,
              resolve disputes, and enforce agreements.
            </p>
          </section>

          {/* 7. Contact */}
          <section id="contact" className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">7. Contact us</h2>
            <p className="mb-2 text-sm leading-relaxed text-slate-700">
              If you have questions about this notice or how we handle personal
              information, you should provide a clear way for users to contact
              you — for example:
            </p>
            <ul className="space-y-1 list-disc pl-5 text-sm leading-relaxed text-slate-700">
              <li>A dedicated privacy or support email address.</li>
              <li>
                A postal address for written requests, where required by law.
              </li>
            </ul>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Replace this section with your real contact details before using
              the page in production.
            </p>
          </section>

          <p className="text-[11px] text-slate-500">
            This page is a layout template inspired by typical FX help centers.
            Replace all placeholder wording with your own official privacy
            notice before launching publicly.
          </p>
        </article>
      </main>
    </div>
  );
}
