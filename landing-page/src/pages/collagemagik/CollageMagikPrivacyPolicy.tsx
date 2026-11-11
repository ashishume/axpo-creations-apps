import { Link } from "wouter";
import type { ReactNode } from "react";
import { A, APP_NAME, B, BASE, H2, LegalPage, List, Mail, P } from "./CollageMagikLayout";

const link = "text-indigo-500 dark:text-indigo-400 hover:underline";

function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-medium mt-6 mb-2 dark:text-slate-200 text-slate-900">{children}</h3>;
}

export default function CollageMagikPrivacyPolicy() {
  return (
    <LegalPage
      title={`${APP_NAME} Privacy Policy`}
      path={`${BASE}/privacy-policy`}
      intro={
        <>
          {APP_NAME} (&quot;we&quot;, &quot;us&quot;) is an iPhone app that turns your photos and videos into collages.
          It works on your iPhone and is free, with no account. <B>We do not collect, receive or store your photos,
          videos, music or collages, and we keep no profile about you.</B> The app shows ads from{" "}
          <B>Meta Audience Network</B>, and that ad service collects some data about your device and your use of ads, as
          explained in the <B>Advertising</B> section below. This page explains what the app does with your pictures
          on your own device, what the ad service collects, and the choices you have.
        </>
      }
    >
      <H2>The short version</H2>
      <List>
        <li>No account, no sign-in, no email address, no phone number.</li>
        <li>Your photos, videos and music are used only on your iPhone, to build and export your collage. They are never uploaded to us, to Meta, or to anyone else.</li>
        <li>The app shows an occasional full-screen ad from <B>Meta Audience Network</B>, only after you export and never while you edit. Meta collects some device and ad data to serve and measure those ads.</li>
        <li>On your iPhone, Apple&apos;s tracking prompt decides whether ads can be personalised. In the EU, UK and Switzerland we ask for your agreement first, and if you say no you see no ads.</li>
        <li>Collages you export are kept in <B>My Library</B> inside the app, on your iPhone only.</li>
        <li>You can delete everything the app has stored, and reset your ad choices, at any time, from inside the app.</li>
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
          <B>Tracking</B> (Apple&apos;s &quot;Allow App to Track&quot; prompt), asked once, after your first finished export. It
          lets Meta use your device&apos;s advertising identifier to show you more relevant ads. You can say no, and the app
          works the same; you may still see ads, just less relevant ones.
        </li>
        <li>
          The app does not use your camera, microphone, location, contacts, calendar or health data.
        </li>
      </List>

      <H2>Advertising</H2>
      <P>
        {APP_NAME} is free and is paid for by ads. It shows an occasional full-screen ad from{" "}
        <A href="https://www.facebook.com/audiencenetwork/">Meta Audience Network</A>, operated by Meta Platforms Ireland
        Limited (for people in the European Economic Area and the UK) and Meta Platforms, Inc. elsewhere. An ad can
        appear after you finish an export and close the export screen. It never appears while you edit, and not after your
        first export.
      </P>
      <P>When the ad service runs, it collects and uses data from your iPhone, which may include:</P>
      <List>
        <li>your device&apos;s <B>advertising identifier</B> (IDFA), only if you allowed tracking, and other device and app identifiers;</li>
        <li>your <B>IP address</B> and approximate location derived from it, device model, iOS version, language and similar technical information;</li>
        <li><B>advertising data</B>: which ads were requested, shown, clicked or closed, and ad performance;</li>
        <li><B>crash and diagnostic data</B> about the ad service, which is not linked to you.</li>
      </List>
      <P>
        Meta uses this to choose, show, measure and protect ads, and, where you allowed tracking, to personalise them. Meta
        handles this data under its own{" "}
        <A href="https://www.facebook.com/privacy/policy/">Privacy Policy</A>. We receive reports about ad
        performance and earnings that do not identify you. <B>Your photos, videos, music and collages are never given to
        Meta or to any advertiser.</B> We do not sell your personal information ourselves.
      </P>
      <P>If you tap an ad, you leave {APP_NAME} and the advertiser&apos;s app or website applies its own privacy practices.</P>

      <H3>Your choices about ads</H3>
      <List>
        <li>
          <B>Tracking.</B> Apple&apos;s prompt asks once. You can change your answer at any time in iPhone{" "}
          <B>Settings → Privacy &amp; Security → Tracking</B>. Without tracking, ads are not personalised using your advertising identifier.
        </li>
        <li>
          <B>EU, UK and Switzerland.</B> We ask for your agreement before the ad service starts. If you choose{" "}
          <B>No ads</B>, the ad service is never started and you see no ads. You can change this under <B>More ••• → About &amp; Privacy → Ads → Review ad choices</B>.
        </li>
        <li>
          <B>Reset.</B> <B>Delete all my data</B> (More ••• → About &amp; Privacy) also resets your ad choices, so you are asked again.
        </li>
        <li>
          <B>Meta controls.</B> You can manage how Meta uses your information for ads through your own Meta account&apos;s ad preferences and the{" "}
          <A href="https://www.facebook.com/help/568137493302217">Audience Network opt-out</A>.
        </li>
        <li>
          <B>Limit Ad Tracking.</B> A mobile advertising identifier can also be reset or turned off by Apple&apos;s privacy settings.
        </li>
      </List>
      <P>
        If you live in a place where the law treats sharing an advertising identifier for advertising as a &quot;sale&quot; or
        &quot;sharing&quot; of personal information (for example some US states), you can opt out by not allowing tracking, as above.
        Where the law requires a legal basis (for example the GDPR), our basis for the ad service is your <B>consent</B>, which you can
        withdraw at any time as described above.
      </P>

      <H2>Sharing is your choice</H2>
      <P>
        The <B>Share</B> button opens the standard iPhone share sheet. If you send a collage to Instagram, Messages,
        AirDrop, Mail or any other app, that app receives it under its own privacy policy. We never receive it.
      </P>

      <H2>Internet</H2>
      <P>
        The app works without an internet connection: building, editing and exporting collages happens on your iPhone. The only
        network use is the ad service (Meta Audience Network), which connects to Meta&apos;s servers to request and show ads, as
        described under <B>Advertising</B>. The privacy policy, terms and support links in the app open in your web browser.
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
        are working on, and it also resets your ad choices. Deleting the app removes all of it. Data that Meta has already received for ads is held by Meta, not by us; see <B>Your choices about ads</B>. Collages you saved to the Photos app belong to your photo
        library and are deleted from there. See{" "}
        <Link href={`${BASE}/account-deletion`} className={link}>
          how to delete your data
        </Link>
        .
      </P>

      <H2>Children</H2>
      <P>
        {APP_NAME} is not directed at children under 13 (or the age of digital consent where you live), and we do not knowingly
        collect personal information from children. The app has no accounts or chat. Ads are served by Meta Audience Network under
        its own rules; if you are a parent and want ads switched off, use <B>Ask App Not to Track</B> in Apple&apos;s prompt and, in the EU, UK
        and Switzerland, choose <B>No ads</B>.
      </P>

      <H2>Your rights</H2>
      <P>
        Laws such as the GDPR, the UK GDPR, the California Consumer Privacy Act and India&apos;s Digital Personal Data Protection Act
        give you rights to access, correct and delete personal data a company holds about you, and to object to or withdraw consent for
        advertising. <B>We</B> hold no personal data about you, so there is nothing for us to access, correct or delete. For data that
        Meta processes for ads, you can use Meta&apos;s own tools and contact routes (see Meta&apos;s Privacy Policy), and the controls in{" "}
        <B>Your choices about ads</B> above. You also have the right to complain to your data protection authority. If you have questions,
        write to <Mail />.
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
        If the app changes how it handles data (for example by changing the ad provider), we will update this page and its effective
        date, describe the change in the app&apos;s release notes before it takes effect, and ask for your choice again where the law or
        Apple requires it.
      </P>

      <H2>Contact</H2>
      <P>
        Ashish Debnath, AxpoCreation, Bengaluru, Karnataka, India. Email: <Mail />.
      </P>
    </LegalPage>
  );
}
