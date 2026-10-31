import { Link } from "wouter";
import { A, APP_NAME, B, H2, LegalPage, List, Mail, P } from "./LegalLayout";

export default function AxpoFitnessPrivacyPolicy() {
  return (
    <LegalPage
      title={`${APP_NAME} Privacy Policy`}
      intro={
        <>
          This policy explains what {APP_NAME} (&quot;we&quot;, &quot;us&quot;) collects when you use the {APP_NAME}{" "}
          apps for iPhone and Android, why, who it is shared with, and how you can delete it. {APP_NAME} offers
          workout plans, meal ideas, a food log with photo scanning, an optional period and cycle tracker, an AI
          assistant, and paid coaching with independent fitness and nutrition experts. {APP_NAME} is not a medical
          device and does not diagnose or treat any condition.
        </>
      }
    >
      <H2>Information we collect</H2>
      <List>
        <li>
          <B>Account:</B> when you sign in with Apple or Google, your account identifier from that provider and, if
          shared, your name and verified email address. Signing in with Apple and Google using the same verified
          email links both to one account.
        </li>
        <li>
          <B>Profile and body metrics:</B> gender (including &quot;prefer not to say&quot;), goal, experience,
          training days and length, equipment, preferred workout time, eating style, food country, dietary notes,
          and the age, height, weight and usual activity you enter. From these we calculate BMI, a resting-energy
          estimate and daily calorie and protein estimates.
        </li>
        <li>
          <B>Workouts, meals and food log:</B> your plans, completed exercises and sessions, scheduled workouts,
          meal plans, meals you tick or replace, and the foods you log with their nutrition estimates. Food log
          entries are kept for 90 days.
        </li>
        <li>
          <B>Meal photos:</B> when you scan a meal, the photo is sent to our server and to our AI provider to
          estimate the food, portion and nutrients. We do not store meal photos; only the result you save to your
          food log is kept.
        </li>
        <li>
          <B>Cycle tracking (optional):</B> period dates, flow, pain, symptoms, mood, energy, notes and your usual
          cycle and period length. This is health information; we use it only to show your cycle, predictions and
          guidance, and to share it with a coach if you turn that on.
        </li>
        <li>
          <B>Apple Health and Health Connect (optional, read-only):</B> with your permission we read steps, active
          energy, exercise minutes, sleep, resting heart rate, height and weight. We store only the summary the app
          shows (for example today&apos;s steps), never raw samples, and we never write to Apple Health or Health
          Connect.
        </li>
        <li>
          <B>Axpo AI chat:</B> your messages, the assistant&apos;s replies, and any changes you confirm.
        </li>
        <li>
          <B>Coaching:</B> requests to experts, coaching chat messages, plans an expert sends you, what you choose to
          share with your coach, reports and blocks.
        </li>
        <li>
          <B>Expert applications:</B> if you apply to be an expert, your profile details, specialties, languages,
          rates, certificates, identity proof and photo.
        </li>
        <li>
          <B>Purchases:</B> for paid coaching, the product, price tier, transaction identifiers, purchase and expiry
          dates and the store (App Store or Google Play). Payments are handled by Apple or Google; we never receive
          your card or bank details.
        </li>
        <li>
          <B>Device and app information:</B> a push-notification token if you allow notifications, your time zone
          and region (to show the right day and local foods), and basic server logs (such as IP address and request
          times) used for security and troubleshooting.
        </li>
      </List>

      <H2>How we use it</H2>
      <P>
        To create your account and sign you in; to build and adjust your workout and meal plans; to calculate your
        progress, streaks and nutrition estimates; to run the food scanner and Axpo AI; to show your cycle and Health
        summaries; to connect you with experts, deliver coaching chat and plans, and process coaching purchases; to
        send notifications you allow; to keep the service safe (for example, our chat filter blocks phone numbers,
        emails, links and outside-payment requests); to provide support; and to meet legal obligations. Calorie,
        protein, BMI and energy figures are general estimates, not medical or dietary advice.
      </P>

      <H2>AI features</H2>
      <P>
        Workout plans, meal ideas, calorie estimates, the food scanner and Axpo AI chat use large language models
        through <B>OpenRouter</B>, which passes requests to the model provider we select (currently including
        OpenAI and Google). A request contains only what the feature needs: for example your profile, body metrics
        and current plan for a new plan, a meal photo for a scan, or the data the assistant looks up to answer your
        question (which can include your food log, plan or cycle if you ask about them). Your Apple Health or Health
        Connect summary is included only if you turn on &quot;Share Apple Health summary with AI&quot; (iPhone) or
        &quot;Share Health Connect summary with AI&quot; (Android) in Profile &amp; settings. These providers process the request to return an answer under their own terms. AI output can be
        wrong; check anything important with a qualified professional.
      </P>

      <H2>Coaching with experts</H2>
      <P>
        Experts are independent professionals, not our employees. Before an expert appears in the app we review
        their application and verify at least one certificate. Clients see an expert&apos;s first name and last
        initial, photo, verified certificates and profile. An expert sees your first name, your messages and only
        the items you choose to share (profile, plan, progress, food log, cycle), which you can change at any time.
        Coaching messages pass through an automatic filter, and reported conversations can be reviewed by our team
        to keep the service safe.
      </P>

      <H2>Who we share information with</H2>
      <List>
        <li>
          <B>Google Cloud</B> (Cloud Run, Cloud SQL and Cloud Storage in Mumbai, India), which hosts our servers,
          database and private files.
        </li>
        <li>
          <B>OpenRouter and the AI model providers</B> above, when you use an AI feature.
        </li>
        <li>
          <B>Apple and Google</B> for sign-in, App Store and Google Play purchases, and push notifications (Apple
          Push Notification service and Firebase Cloud Messaging).
        </li>
        <li>
          <B>Google AdMob and the User Messaging Platform</B>, which show ads in the free app and ask for consent
          where the law requires it. Google may process device identifiers, IP address and ad interactions under{" "}
          <A href="https://policies.google.com/technologies/partner-sites">Google&apos;s policies</A>. We never give
          advertisers your health, cycle, body, food or chat data.
        </li>
        <li>
          <B>Your coach</B>, limited to what you choose to share.
        </li>
        <li>
          Authorities or advisers when the law requires it or to protect the rights and safety of users, and a
          successor if the service is transferred, under this policy.
        </li>
      </List>
      <P>
        We do not sell your personal information. We do not use Apple Health, Health Connect or cycle data for
        advertising or marketing, and we do not track you across other companies&apos; apps or websites.
      </P>

      <H2>Storage, security and transfers</H2>
      <P>
        Your data is stored on Google Cloud in India and protected in transit with HTTPS. Sign-in tokens are kept in
        the iPhone Keychain or encrypted with the Android Keystore. Expert documents are kept in a private bucket and
        are only ever sent through our server to the expert and our review team. AI and advertising providers may
        process data in other countries. No system is perfectly secure, but we limit access to what each feature
        needs.
      </P>

      <H2>Retention and deleting your account</H2>
      <P>
        We keep your data while your account exists. Food log entries are kept for 90 days. You can delete your
        account at any time in the app: open the menu at the top right, tap <B>Profile &amp; settings</B>, then{" "}
        <B>Delete account</B>. This permanently deletes your account and everything linked to it (profile, plans,
        logs, cycle data, chats, expert documents) from our database and file storage straight away. Copies may
        remain in encrypted backups for a short period until they are overwritten. Purchase records held by Apple or
        Google are kept by them under their policies; cancel any subscription in your App Store or Google Play
        settings. See{" "}
        <Link href="/axpo-fitness/account-deletion" className="text-indigo-500 dark:text-indigo-400 hover:underline">
          account deletion
        </Link>{" "}
        for details.
      </P>

      <H2>Your choices and rights</H2>
      <P>
        You can use {APP_NAME} without Apple Health, Health Connect or the cycle tracker; leave Health sharing with
        AI off; change what your coach sees; turn notifications off; review advertising choices in Profile &amp;
        settings where offered; edit your profile; and delete your account. Depending on where you live (for example
        under India&apos;s Digital Personal Data Protection Act or the GDPR), you may have rights to access, correct,
        erase or port your data, withdraw consent, or complain to a regulator. Email <Mail /> and we will respond
        within 30 days.
      </P>

      <H2>Children</H2>
      <P>
        {APP_NAME} is for adults aged 18 and over. We do not knowingly collect data from children. If you believe a
        child has used the app, contact us and we will delete the account.
      </P>

      <H2>Changes</H2>
      <P>
        We will update this page and its effective date when our practices change, and tell you in the app about
        significant changes.
      </P>

      <H2>Contact</H2>
      <P>
        Ashish Debnath (grievance and privacy contact), <Mail />.
      </P>
    </LegalPage>
  );
}
