import { Link } from "wouter";
import { APP_NAME, B, H2, LegalPage, List, Mail, P } from "./LegalLayout";

export default function AxpoFitnessSupport() {
  return (
    <LegalPage
      title={`${APP_NAME} support`}
      intro={
        <>
          Need help with {APP_NAME}? Email <Mail /> with your device (iPhone or Android), app version and what
          happened, and we&apos;ll reply within 2 working days.
        </>
      }
    >
      <H2>Common questions</H2>
      <List>
        <li>
          <B>Sign in with Apple on iPhone and Google on Android:</B> use the same email address on both and
          you&apos;ll land in the same account with the same plans and logs.
        </li>
        <li>
          <B>Calorie targets look off:</B> they are estimated from the age, height, weight and usual activity in
          Profile &amp; settings. Update those and your targets and meal ideas adjust.
        </li>
        <li>
          <B>Apple Health or Health Connect shows nothing:</B> allow access in the Health app (iPhone) or Health
          Connect settings (Android), then reopen {APP_NAME}.
        </li>
        <li>
          <B>Manage or cancel a coaching subscription:</B> App Store account settings → Subscriptions on iPhone, or
          Google Play → Payments &amp; subscriptions on Android. Refunds are handled by Apple or Google.
        </li>
        <li>
          <B>Report a coach or user:</B> open the chat, tap the menu and choose Report, or email us.
        </li>
        <li>
          <B>Delete your account:</B> see{" "}
          <Link href="/axpo-fitness/account-deletion" className="text-indigo-500 dark:text-indigo-400 hover:underline">
            account deletion
          </Link>
          .
        </li>
      </List>

      <H2>Health and safety</H2>
      <P>
        {APP_NAME} gives general fitness and nutrition guidance, not medical advice. For pain, injury, pregnancy, a
        medical condition or eating-disorder concerns, please talk to a doctor. In an emergency, call your local
        emergency number.
      </P>
    </LegalPage>
  );
}
