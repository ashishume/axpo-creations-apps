import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const SUPPORT_EMAIL = "aaxpocreation@gmail.com";

export default function VioraAccountDeletion() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-[720px] mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-block mb-6 text-indigo-500 dark:text-indigo-400 hover:underline"
          >
            ← Back
          </Link>

          <h1 className="text-2xl font-semibold mb-2 dark:text-slate-200 text-slate-900">
            Delete Your Viora Account
          </h1>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-8">
            Viora users can request deletion directly inside the iOS app.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            Submit a deletion request
          </h2>
          <ol className="list-decimal pl-5 space-y-2 text-slate-600 dark:text-slate-400 mb-4">
            <li>Open Viora and sign in to the account you want to delete.</li>
            <li>
              Open <strong className="dark:text-slate-300 text-slate-700">Profile</strong>.
            </li>
            <li>
              In <strong className="dark:text-slate-300 text-slate-700">Account</strong>, tap{" "}
              <strong className="dark:text-slate-300 text-slate-700">
                Request account deletion
              </strong>
              .
            </li>
            <li>
              Review the explanation and tap{" "}
              <strong className="dark:text-slate-300 text-slate-700">
                Submit deletion request
              </strong>
              .
            </li>
          </ol>

          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            Viora records a verified request in its secure deletion queue and signs the
            device out. We aim to delete or anonymize the account and its associated
            profile, body metrics, synchronized Apple Health aggregates, workout plans
            and history, meal plans and logs, and AI-related app records within{" "}
            <strong className="dark:text-slate-300 text-slate-700">30 days</strong>.
          </p>

          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            Limited records may be retained when required for legal, security,
            fraud-prevention, or audit purposes. Residual backup copies may remain until
            the applicable backup is overwritten. Deleting the Viora app from a device
            does not delete the server account.
          </p>

          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            If you cannot access the app, or submitted a request by mistake, contact{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            from the email associated with your Sign in with Apple account. We may ask
            you to verify account ownership before acting on the request.
          </p>

          <p className="leading-relaxed text-slate-600 dark:text-slate-400">
            For more information, see the{" "}
            <Link
              href="/viora/privacy-policy"
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              Viora Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
