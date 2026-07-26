import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const SUPPORT_EMAIL = "aaxpocreation@gmail.com";
const WEBSITE_URL = "axpocreation.com";

export default function VioraPrivacyPolicy() {
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
            Viora Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            Effective date: July 26, 2026
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            Developer: Ashish Debnath
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            Contact:{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Website:{" "}
            <a
              href={`https://${WEBSITE_URL}`}
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              {WEBSITE_URL}
            </a>
          </p>

          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            This Privacy Policy explains how Viora (&quot;Viora,&quot; &quot;we,&quot;
            &quot;us,&quot; or &quot;our&quot;) collects, uses, shares, stores, and
            deletes information when you use the Viora iOS application. Viora provides
            general fitness, workout-planning, meal-idea, activity-tracking, and
            AI-assisted wellness features. Viora is not a medical device and does not
            provide medical diagnosis or treatment.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            Information we collect
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Depending on the features you choose, Viora may process:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 mb-4">
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Account information:
              </strong>{" "}
              your Sign in with Apple user identifier and, when Apple provides them and
              you choose to share them, your name and email address.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Profile and fitness preferences:
              </strong>{" "}
              name or display name, fitness goal, experience level, preferred training
              days and session length, equipment, movement considerations, food
              country, eating style, preferred workout time, and dietary preferences or
              avoidances.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Body metrics you enter or import:
              </strong>{" "}
              age, height, weight, activity level, calculated BMI category, and
              formula-based resting-energy estimate.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Apple Health data you authorize:
              </strong>{" "}
              displayed aggregate activity and wellness information such as steps,
              active energy, exercise minutes, sleep duration, resting heart rate,
              height, and weight. Viora requests read-only access and does not write to
              HealthKit.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Workout and meal activity:
              </strong>{" "}
              plans, schedules, exercise and session completions, workout history, meal
              plans, meal completions, alternate meals, and optional calorie estimates.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                AI content:
              </strong>{" "}
              questions, profile context, meal descriptions, and other information you
              deliberately submit to AI features. Apple Health aggregates are included
              in AI requests only when the relevant in-app sharing option is enabled.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Advertising and consent information:
              </strong>{" "}
              Google Mobile Ads and Google&apos;s User Messaging Platform may process
              device, app, advertising-consent, IP-address, diagnostic, and
              ad-interaction information as described in Google&apos;s policies. Viora
              does not provide your HealthKit data, body metrics, profile, workouts,
              meals, or AI conversations to Google for advertising.
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Country or region:
              </strong>{" "}
              Viora may use the region configured on your device to suggest locally
              familiar foods. Viora does not need precise GPS location for this
              feature.
            </li>
          </ul>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            How we use information
          </h2>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            We use information to authenticate users; synchronize user-selected data
            across sessions; create, display, and adapt workouts and meal ideas;
            calculate progress, consistency, BMI, and estimated energy values; import
            and display authorized Apple Health summaries; answer AI coaching requests;
            provide customer support; prevent misuse; maintain security; comply with
            law; and show and manage contextual or non-personalized advertising where
            enabled.
          </p>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            BMI, calorie, and resting-energy values are estimates for general
            educational use. They are not diagnoses or individualized medical or
            nutritional advice.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            Apple Health and health information
          </h2>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            Access to Apple Health is optional and controlled through Apple
            authorization settings. Viora reads only the categories you approve. Raw
            HealthKit samples remain managed by Apple Health. Viora may store the
            aggregate values displayed by the app in your authenticated Viora account
            so they can be associated with you and synchronized.
          </p>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            We do not sell HealthKit information, use it for advertising, data
            brokerage, or marketing, or share it with advertising platforms. We do not
            use HealthKit information to determine advertising eligibility or
            targeting. Health information is used only to provide health and fitness
            functionality requested by you. You can revoke Health access at any time in
            the iOS Settings or Health app. Revoking access prevents future reads but
            does not automatically delete information previously synchronized; use the
            account-deletion option described below to request deletion.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            AI processing and OpenRouter
          </h2>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            AI features are optional. Viora sends AI requests through an authenticated
            Supabase Edge Function, which forwards the minimum prompt content needed to
            OpenRouter. The OpenRouter API key is stored server-side and is not
            included in the app. Depending on the feature, a prompt may include profile
            preferences, body metrics, meal descriptions, workout information, and
            Apple Health aggregates only when you enabled sharing for that AI use.
          </p>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            OpenRouter and the selected model provider process this content to produce
            a response. Their processing is governed by their own terms and privacy
            practices. Do not enter information you do not want processed by these
            providers. AI output may be inaccurate and should not replace a qualified
            health, fitness, or nutrition professional.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            Service providers and sharing
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            We may share information only as needed with:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 mb-4">
            <li>
              <strong className="dark:text-slate-300 text-slate-700">Supabase</strong>,
              for authentication, database synchronization, and server-side functions;
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                OpenRouter and the selected AI model provider
              </strong>
              , when you use an AI feature;
            </li>
            <li>
              <strong className="dark:text-slate-300 text-slate-700">
                Google AdMob and User Messaging Platform
              </strong>
              , for advertising, consent management, fraud prevention, and ad
              measurement when ads are enabled;
            </li>
            <li>
              authorities or professional advisers when reasonably necessary to comply
              with law, protect rights and safety, investigate abuse, or enforce
              agreements; and
            </li>
            <li>
              a successor organization in a merger, acquisition, financing,
              reorganization, or sale, subject to applicable privacy requirements.
            </li>
          </ul>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            We do not sell your personal information. We do not share HealthKit data
            for advertising or marketing.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            Advertising and tracking
          </h2>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            Viora is configured to request contextual or non-personalized ads and uses
            Google&apos;s consent tools where required. Viora does not request App
            Tracking Transparency permission because the app is not intended to track
            you across other companies&apos; apps or websites. If Viora later
            introduces cross-app or cross-site tracking, we will update this policy and
            request Apple&apos;s App Tracking Transparency permission before tracking.
          </p>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            You may be able to review advertising privacy choices from the Viora
            profile screen when Google requires those choices in your region. Ad
            providers may still process limited device, network, diagnostic,
            fraud-prevention, and ad-interaction data to deliver and measure ads.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            Storage, security, and international transfers
          </h2>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            Viora stores app preferences locally on your device. Account-linked
            information is stored using Supabase infrastructure. AI requests and
            advertising data may be processed in countries other than your own. We use
            reasonable administrative and technical measures designed to protect
            information, but no storage or transmission method is completely secure.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            Retention and account deletion
          </h2>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            We retain account-linked information while your account is active and as
            needed to provide the service, meet legal obligations, resolve disputes,
            prevent fraud, and enforce agreements. You can submit an account-deletion
            request from{" "}
            <strong className="dark:text-slate-300 text-slate-700">
              Profile &gt; Account &gt; Request account deletion
            </strong>
            . The request is recorded in our deletion queue, you are signed out, and we
            aim to delete or anonymize account data within 30 days, except information
            we must retain for legal, security, fraud-prevention, or audit purposes.
            Backups may retain residual copies for a limited period until they are
            overwritten.
          </p>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            Submitting a request does not by itself delete data instantly; it creates a
            verified request for server-side processing. Contact{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            if you submitted a request by mistake or need assistance. Deleting the app
            does not delete your server account.
          </p>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            See the{" "}
            <Link
              href="/viora/account-deletion"
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              account deletion instructions
            </Link>{" "}
            for step-by-step guidance.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            Your choices and rights
          </h2>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            You can decline Apple Health access, keep Health-to-AI sharing disabled,
            avoid optional profile fields, use advertising privacy controls when
            presented, revoke Health access in Apple settings, sign out, or request
            account deletion in the app. Depending on where you live, you may have
            rights to access, correct, export, restrict, object to, or delete personal
            information, or withdraw consent. Contact us to exercise these rights. We
            may need to verify your request.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            Children
          </h2>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            Viora is intended for adults aged 18 and older. We do not knowingly collect
            personal information from children. If you believe a child has provided
            information, contact us so we can investigate and delete it as appropriate.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            Changes to this policy
          </h2>
          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            We may update this Privacy Policy as Viora changes or legal requirements
            evolve. We will update the effective date and provide additional notice
            when required.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            Contact us
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            For privacy questions, rights requests, or account-deletion support,
            contact:
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-1">Ashish Debnath</p>
          <p className="text-slate-600 dark:text-slate-400 mb-1">
            Email:{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Website:{" "}
            <a
              href={`https://${WEBSITE_URL}`}
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              {WEBSITE_URL}
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
