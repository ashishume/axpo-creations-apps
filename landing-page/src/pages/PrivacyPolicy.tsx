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
            Last updated: October 7, 2026
          </p>

          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            AXPO (&quot;we&quot;, &quot;our&quot;, or &quot;the app&quot;)
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
              We do not collect or store your card, UPI, or bank details for
              purchases. Premium subscriptions are processed by Apple (on iOS),
              Google Play (on Android), or{" "}
              <strong className="dark:text-slate-300 text-slate-700">Razorpay</strong>
              . When you subscribe through Razorpay, we share your name and
              email with Razorpay to prefill checkout, and Razorpay collects
              your payment details directly under its own privacy policy. We
              receive only the subscription and payment status and reference
              IDs needed to enable and manage premium features.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Device/local data:
              </strong>{" "}
              We use local storage (e.g. on your device) to keep you signed in and
              to cache data for offline use.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Receipt images (optional):
              </strong>{" "}
              When you scan a receipt, the photo or text you choose is sent to
              our server and to an AI service provider to read the amounts,
              items, and dates. We do not keep the images after processing. Only
              the expenses you review and save are stored in your account.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Gmail (optional, where available):
              </strong>{" "}
              If you connect your Gmail account, we request read-only access and
              look only for emails that appear to be purchase or payment
              receipts. Relevant parts of those emails are processed by our
              server and our AI service provider to suggest expenses for you to
              review. We do not send email, change your mailbox, or use your
              Gmail data for advertising. You can disconnect Gmail at any time.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Notification tokens:
              </strong>{" "}
              If you allow notifications, we store a push token for your device
              along with basic device details (platform, app version, and
              notification permission status) so we can send you account,
              family, split, loan, and reminder notifications.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Advertising and device data:
              </strong>{" "}
              Free versions of the app show ads from{" "}
              <strong className="dark:text-slate-300 text-slate-700">Google AdMob</strong>
              . AdMob may collect device identifiers (such as your advertising
              ID), IP address, approximate location, and app usage to show and
              measure ads. Where required (for example in the EEA and UK), we
              ask for your consent first. On iOS, we ask for permission before
              ads can track you across other apps. Premium subscribers do not
              see ads.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Bank and card SMS (Android app only, optional):
              </strong>{" "}
              If you allow SMS access, the Android app reads payment alerts from
              banks and card issuers on your phone to find payments you made—the
              amount, merchant or payee, date, payment type (such as card or
              UPI), and the last four digits of a card. This happens{" "}
              <strong className="dark:text-slate-300 text-slate-700">
                only on your device
              </strong>
              . We do{" "}
              <strong className="dark:text-slate-300 text-slate-700">not</strong>{" "}
              upload, store, or share your SMS messages, and we ignore personal
              messages, one-time passwords (OTPs), and other non-payment SMS.
              Only the payments you review and choose to add are saved to your
              account as expenses. The app also remembers on your device which
              detected payments you already added or dismissed. This feature is
              available only in the Android app; the iOS app never reads or
              accesses your SMS messages.
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
            <li>
              Optional receipt scanning and Gmail import, when you choose to use
              them, as described above.
            </li>
            <li>
              From your device when you allow notifications, and from Google
              AdMob when ads are shown.
            </li>
            <li>
              Optional SMS payment detection (Android app only): with your permission,
              bank and card SMS are read and processed on your device to suggest
              expenses. A suggested payment is saved to your account only after
              you review it and tap to add it.
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
            <li>
              On Android only, suggest expenses from bank and card SMS on your device,
              point out payments you may have already added, and show a
              notification when a new payment SMS arrives, so you can add it
              without typing it in.
            </li>
            <li>Keep your data in sync across devices when you are signed in.</li>
            <li>
              Keep you signed in and improve app performance (e.g. caching).
            </li>
            <li>Read receipts and payment emails you choose to import.</li>
            <li>Send notifications you have allowed.</li>
            <li>
              Show ads in the free version and manage premium subscriptions.
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
              (and other providers you use) – for sign-in (OAuth), and Gmail
              access only if you connect it. We do not control those
              providers&apos; own privacy practices; please refer to their
              privacy policies.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                AI service provider (OpenRouter and the model providers it routes to)
              </strong>{" "}
              – to read receipts and payment emails you choose to import.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Firebase Cloud Messaging (Google)
              </strong>{" "}
              – to deliver push notifications.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Google AdMob
              </strong>{" "}
              – to show and measure ads in the free version.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Razorpay
              </strong>{" "}
              – to process premium subscription payments made through Razorpay.
            </li>
          </ul>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Data is transmitted over HTTPS. Supabase provides encryption in
            transit and at rest as part of their service.
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            AXPO&apos;s use and transfer of information received from Google
            APIs, including Gmail, follows the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
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
              With service providers that help us run the app (such as
              Supabase, our AI service provider, Firebase, and Razorpay), only
              as needed to provide the features described above.
            </li>
            <li>
              With Google AdMob and its ad partners, as described above, to
              show and measure ads in the free version.
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
              You can turn off notifications in your device settings, disconnect
              Gmail from the app or from your Google account settings, and
              change your ad consent choices from the app&apos;s account screen
              where available. On Android you can reset or delete your
              advertising ID in device settings; on iOS you can turn off app
              tracking in Settings → Privacy &amp; Security → Tracking.
            </li>
            <li>
              SMS access applies only to the Android app and is optional. You
              can decline it, or turn it off at any
              time in Android Settings → Apps → AXPO → Permissions → SMS. You
              can turn off payment alerts separately in the app&apos;s
              &quot;Payments from SMS&quot; notification setting. Turning off
              SMS access stops all SMS reading; expenses you already added stay
              in your account until you delete them.
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
            AXPO is not directed at children under 13. We do not knowingly
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
              href="mailto:aaxpocreation@gmail.com"
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              aaxpocreation@gmail.com
            </a>
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Subject line: AXPO – Privacy
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
