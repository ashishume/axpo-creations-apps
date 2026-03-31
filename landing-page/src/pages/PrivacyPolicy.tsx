import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Last updated: March 31, 2026
          </p>

          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            Axpo Tracker (&quot;we&quot;, &quot;our&quot;, or &quot;the app&quot;)
            is an expense-tracking and bill-splitting app. This Privacy Policy
            explains what data we collect, how we use it, and your choices.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            1. Data We Collect
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            We collect the following information:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 mb-4">
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Account information:
              </strong>{" "}
              When you sign in with Google (or other sign-in options we offer),
              we receive information such as your email address, display name,
              and profile photo as provided by the identity provider. We use
              this to identify you and display your profile in the app.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Expense and financial data:
              </strong>{" "}
              Amounts, categories, descriptions, dates, and notes you enter for
              expenses; fixed costs, investments, salary, and group/split data.
              This is stored to provide tracking, charts, and bill-splitting.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Payment method metadata (optional):
              </strong>{" "}
              You may attach optional{" "}
              <strong className="dark:text-slate-300 text-slate-700">
                payment method
              </strong>{" "}
              information to individual expenses and save{" "}
              <strong className="dark:text-slate-300 text-slate-700">
                saved payment methods
              </strong>{" "}
              on your account—for example method type (cash, UPI, bank transfer,
              credit or debit card), labels you provide (such as a card
              nickname, bank name, or UPI identifier), and for cards a{" "}
              <strong className="dark:text-slate-300 text-slate-700">
                display name and the last four digits
              </strong>{" "}
              plus an optional{" "}
              <strong className="dark:text-slate-300 text-slate-700">
                statement or billing day
              </strong>{" "}
              you choose. We do{" "}
              <strong className="dark:text-slate-300 text-slate-700">not</strong>{" "}
              collect or store full card or account numbers, CVV/CVC, PINs, or
              other data used to execute payments. The app is a personal finance
              organizer, not a payment processor.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Group and split data:
              </strong>{" "}
              Names and email addresses of members you add to groups, and expense
              splits, for the purpose of splitting bills.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                In-app purchases and subscriptions:
              </strong>{" "}
              We do not collect or store your payment card details for store
              purchases. Purchase and subscription status are processed by Apple
              (on iOS), Google Play (on Android), or the relevant platform; we
              may receive minimal information (for example, that your
              subscription is active) to enable premium features.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Device/local data:
              </strong>{" "}
              We use local storage (e.g. on your device) to keep you signed in and
              to cache data for offline use.
            </li>
          </ul>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            2. How We Collect Data
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 mb-4">
            <li>
              Directly from you when you sign in and when you add expenses,
              groups, members, or payment-method preferences.
            </li>
            <li>
              Optional CSV import: if you use the import feature, file contents
              are processed only on your device and then stored in your account
              as described above.
            </li>
          </ul>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            3. Purpose of Use
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            We use this data to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 mb-4">
            <li>Provide expense tracking, summaries, and visualizations.</li>
            <li>Enable bill splitting and group expense management.</li>
            <li>
              Let you filter and organize spending using optional payment-method
              labels, and to apply default payment methods when you add expenses,
              based on settings you choose.
            </li>
            <li>Keep your data in sync across devices when you are signed in.</li>
            <li>
              Keep you signed in and improve app performance (e.g. caching).
            </li>
          </ul>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            4. Storage and Processing
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Your data is stored and processed using:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 mb-4">
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Supabase
              </strong>{" "}
              – to store your account-linked data (expenses, groups, saved
              payment methods, etc.) in a secure cloud database.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Optional backend API
              </strong>{" "}
              – depending on app configuration, some operations may go through
              our servers; the same categories of data apply.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Google
              </strong>{" "}
              (and other providers you use) – only for sign-in (OAuth). We do
              not control those providers&apos; own privacy practices; please
              refer to their privacy policies.
            </li>
          </ul>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Data is transmitted over HTTPS. Supabase provides encryption in
            transit and at rest as part of their service.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            5. Sharing and Disclosure
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            We do not sell your personal data. We may share or disclose data
            only:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 mb-4">
            <li>
              With service providers (e.g. Supabase) that help us run the app,
              under strict confidentiality and data-processing terms.
            </li>
            <li>
              If required by law or to protect our rights, safety, or property.
            </li>
            <li>
              Within a group: other members in a bill-split group can see that
              group&apos;s expenses and splits, as intended by the feature.
            </li>
          </ul>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            6. Data Retention
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            We retain your data for as long as your account exists and you use
            the app—including saved payment methods and payment-method fields on
            expenses. If you want your data deleted, contact us (see below).
            After account/data deletion, we will remove or anonymize your data
            within a reasonable period, except where we must keep it for legal
            reasons.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            7. Your Rights and Choices
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 mb-4">
            <li>
              You can stop using the app and request account and data deletion by
              contacting us.
            </li>
            <li>
              You can revoke the app&apos;s access to your Google account from
              your Google account settings.
            </li>
            <li>
              If you are in the European Economic Area or other regions with
              similar laws, you may have additional rights (access, correction,
              deletion, portability, objection). Contact us to exercise them.
            </li>
          </ul>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            8. Children
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Axpo Tracker is not directed at children under 13. We do not knowingly
            collect data from children under 13. If you believe we have done so,
            please contact us so we can delete it.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            9. Changes to This Policy
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            We may update this Privacy Policy from time to time. We will post the
            updated version at this URL and update the &quot;Last updated&quot;
            date. Continued use of the app after changes means you accept the
            updated policy.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            10. Contact
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            For privacy-related requests, data deletion, or questions:
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-1">
            Email:{" "}
            <a
              href="mailto:ashishume@gmail.com"
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              ashishume@gmail.com
            </a>
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Subject line: Axpo Tracker – Privacy
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
