import { APP_NAME, B, H2, LegalPage, List, Mail, P } from "./LegalLayout";

export default function AxpoFitnessAccountDeletion() {
  return (
    <LegalPage
      title={`Delete your ${APP_NAME} account`}
      intro={`You can delete your ${APP_NAME} account and all of its data yourself, inside the iPhone or Android app.`}
    >
      <H2>Delete in the app</H2>
      <List ordered>
        <li>Open {APP_NAME} and sign in to the account you want to delete.</li>
        <li>
          Tap the menu at the top right and choose <B>Profile &amp; settings</B>.
        </li>
        <li>
          In <B>Account</B>, tap <B>Delete account</B> and confirm.
        </li>
      </List>
      <P>
        Your account is deleted straight away and you are signed out. Signing in again later creates a new, empty
        account.
      </P>

      <H2>What is deleted</H2>
      <P>
        Everything linked to your account: sign-in details, profile and body metrics, workout and meal plans and
        history, food log, cycle data, Apple Health or Health Connect summaries, Axpo AI chat, coaching requests,
        chats and shared plans, push tokens, purchase records we hold, and, for experts, your application, profile
        and uploaded documents. Copies may remain in encrypted backups for a short period until they are overwritten.
      </P>

      <H2>Subscriptions</H2>
      <P>
        Deleting your account does not cancel an App Store or Google Play subscription. Cancel it first in your App
        Store account settings or in Google Play → Payments &amp; subscriptions. Apple and Google keep their own
        purchase records under their policies.
      </P>

      <H2>Can&apos;t open the app?</H2>
      <P>
        Email <Mail /> from the email address you sign in with, with the subject &quot;Delete my {APP_NAME}{" "}
        account&quot;. We will confirm the request and delete the account within 30 days.
      </P>
    </LegalPage>
  );
}
