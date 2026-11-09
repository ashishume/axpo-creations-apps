import { Link } from "wouter";
import { APP_NAME, B, BASE, H2, LegalPage, List, Mail, P } from "./CollageMagikLayout";

const link = "text-indigo-500 dark:text-indigo-400 hover:underline";

export default function CollageMagikPrivacyPolicy() {
  return (
    <LegalPage
      title={`${APP_NAME} Privacy Policy`}
      path={`${BASE}/privacy-policy`}
      intro={
        <>
          {APP_NAME} (&quot;we&quot;, &quot;us&quot;) is an iPhone app that turns your photos and videos into collages.
          It works entirely on your iPhone. <B>We do not collect, receive, store on a server, sell or share any
          personal data about you</B>, there is no account to create, and the app currently uses no analytics and no
          tracking. This page explains what the app does with your pictures on your own device and how to remove them.
        </>
      }
    >
      <H2>The short version</H2>
      <List>
        <li>No account, no sign-in, no email address, no phone number.</li>
        <li>Your photos, videos and music are used only on your iPhone, to build and export your collage. They are never uploaded to us or to anyone else.</li>
        <li>Currently no analytics, no crash-reporting service and no third-party code that collects data in the app.</li>
        <li>Collages you export are kept in <B>My Library</B> inside the app, on your iPhone only.</li>
        <li>You can delete everything the app has stored, at any time, from inside the app.</li>
      </List>

      <H2>What the app works with, on your device</H2>
      <List>
        <li>
          <B>Photos and videos you choose.</B> You pick them with Apple&apos;s photo picker or the Files app. The app can
          only see the items you choose, never the rest of your photo library. While you work, the app keeps
          temporary working copies in its own private storage so it can preview and export them. These copies are
          cleared the next time the app starts, and when you delete your data.
        </li>
        <li>
          <B>Music you choose.</B> If you add background music, you pick an audio file from the Files app. It is used
          only to build your collage and is handled like your photos and videos.
        </li>
        <li>
          <B>Your collage while you edit it.</B> Layout, crop, timeline and style choices live in memory while the app
          is open. They are not saved between sessions and never leave your iPhone.
        </li>
        <li>
          <B>My Library.</B> When you export a collage, a copy of the finished video or picture, and a small preview
          image, are saved in the app&apos;s private storage on your iPhone so you can find it again. Nothing is
          synced to a server. You can delete any collage from My Library whenever you like.
        </li>
      </List>

      <H2>Permissions the app asks for</H2>
      <List>
        <li>
          <B>Add to your photo library</B> (add-only), when you tap <B>Save to Photos</B>. This lets the app save a
          finished collage into Photos. It does not let the app read, list or change the pictures already there.
        </li>
        <li>
          <B>Files access</B> only for the specific files you choose in the Files picker.
        </li>
        <li>
          The app does not use your camera, microphone, location, contacts, calendar or health data. At the moment it
          does not track you across other companies&apos; apps or websites.
        </li>
      </List>

      <H2>Advertising</H2>
      <P>
        We may show ads in the app in the future. If we do, we will update this policy before the change reaches you,
        describe what the advertising provider collects and why, and ask for your permission through the iPhone&apos;s
        standard prompt before any tracking, as Apple requires. Your photos, videos, music and collages will not be
        sent to advertisers.
      </P>

      <H2>Sharing is your choice</H2>
      <P>
        The <B>Share</B> button opens the standard iPhone share sheet. If you send a collage to Instagram, Messages,
        AirDrop, Mail or any other app, that app receives it under its own privacy policy. We never receive it.
      </P>

      <H2>Internet</H2>
      <P>
        The app does not need an internet connection and does not send any data over the network. The privacy policy,
        terms and support links in the app open in your web browser.
      </P>

      <H2>Information from Apple</H2>
      <P>
        If you have chosen to share analytics with app developers in your iPhone&apos;s settings, Apple may give us
        aggregated, anonymous crash and usage statistics through App Store Connect. We cannot identify you from them.
        Apple handles that data under its own privacy policy.
      </P>

      <H2>Backups</H2>
      <P>
        Like other apps&apos; files, the contents of My Library may be included in your iPhone backup (iCloud Backup or
        a backup on your computer). That backup is created and controlled by you and Apple, not by us.
      </P>

      <H2>Keeping your data and deleting it</H2>
      <P>
        Data stays on your iPhone until you remove it. You can delete a single collage from My Library, or choose
        <B> More ••• → About &amp; Privacy → Delete all my data</B> to remove every collage and clear the collage you
        are working on. Deleting the app removes all of it. Collages you saved to the Photos app belong to your photo
        library and are deleted from there. See{" "}
        <Link href={`${BASE}/account-deletion`} className={link}>
          how to delete your data
        </Link>
        .
      </P>

      <H2>Children</H2>
      <P>
        Because the app collects no personal information from anyone, it collects none from children either. The app
        has no accounts or chat, and is not aimed at children. If we add advertising, we will not show children
        personalised ads.
      </P>

      <H2>Your rights</H2>
      <P>
        Laws such as the GDPR, the UK GDPR, the California Consumer Privacy Act and India&apos;s Digital Personal Data
        Protection Act give you rights to access, correct and delete personal data a company holds about you. We hold no
        personal data about you, so there is nothing for us to access, correct or delete. Everything the app keeps is
        on your iPhone, under your control. If you have questions, write to <Mail />.
      </P>

      <H2>This website</H2>
      <P>
        This policy covers the {APP_NAME} app. The axpocreation.com website, including these pages, is covered by our{" "}
        <Link href="/privacy-policy" className={link}>
          website Privacy Policy
        </Link>
        , which explains how the site handles cookies and advertising.
      </P>

      <H2>Changes to this policy</H2>
      <P>
        If the app ever changes how it handles data, we will update this page and its effective date, and describe the
        change in the app&apos;s release notes before it takes effect.
      </P>

      <H2>Contact</H2>
      <P>
        Ashish Debnath, AxpoCreation, Bengaluru, Karnataka, India. Email: <Mail />.
      </P>
    </LegalPage>
  );
}
