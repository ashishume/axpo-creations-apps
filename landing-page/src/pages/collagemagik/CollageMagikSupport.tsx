import { Link } from "wouter";
import { APP_NAME, B, BASE, H2, LegalPage, List, Mail, P } from "./CollageMagikLayout";

const link = "text-indigo-500 dark:text-indigo-400 hover:underline";

export default function CollageMagikSupport() {
  return (
    <LegalPage
      title={`${APP_NAME} support`}
      path={`${BASE}/support`}
      intro={
        <>
          Need help with {APP_NAME}? Email <Mail /> with your iPhone model, iOS version (Settings → General → About),
          the app version (More ••• → About &amp; Privacy) and what happened, and we&apos;ll reply within 2 working days.
        </>
      }
    >
      <H2>Common questions</H2>
      <List>
        <li>
          <B>Which iPhones does it work on?</B> {APP_NAME} needs iOS 26 or later. It is built for iPhone.
        </li>
        <li>
          <B>Where are my collages?</B> Every collage you export is kept in <B>My Library</B> (More ••• → My Library),
          on your iPhone. Open one to play it, share it, save it to Photos or delete it.
        </li>
        <li>
          <B>My video won&apos;t import.</B> iPhone can play MP4, MOV and M4V in H.264 or HEVC. AVI, MKV, WebM and
          MPEG-1/2 files can&apos;t be played by iOS: convert them to MP4 first. The app names the file it can&apos;t read.
        </li>
        <li>
          <B>How many photos and videos can I add?</B> Up to 9 pictures in a collage, and up to 2 of them can be videos.
          A collage lasts as long as its longest clip, up to 60 seconds.
        </li>
        <li>
          <B>Can I add music?</B> Yes: open the Audio tab and choose your own MP3, M4A or WAV file. The app has no
          built-in music. You need at least one video in the collage to use music.
        </li>
        <li>
          <B>The export stopped or failed.</B> Keep the screen on until it finishes and make sure your iPhone has free
          storage (a long video export can be over 100 MB, and the app keeps a copy in My Library). Try Standard quality
          instead of Ultra if the problem continues.
        </li>
        <li>
          <B>Save to Photos asks for permission.</B> The app only asks to add pictures to your library, never to read it.
          If you declined, turn it on in Settings → Apps → {APP_NAME} → Photos.
        </li>
        <li>
          <B>I lost a collage.</B> My Library lives on your iPhone only. If you deleted the app, or the collage, it can&apos;t
          be recovered by us, but it may be in a device backup or in Photos if you saved it there.
        </li>
        <li>
          <B>Delete my data.</B> See{" "}
          <Link href={`${BASE}/account-deletion`} className={link}>
            how to delete your data
          </Link>
          . There is no account to close.
        </li>
      </List>

      <H2>Ads</H2>
      <List>
        <li>
          <B>Why do I see ads?</B> {APP_NAME} is free and paid for by ads. You may see one full-screen ad after you export, never while
          editing and never after your very first export.
        </li>
        <li>
          <B>Can I turn ads off or stop tracking?</B> Say <B>Ask App Not to Track</B> in Apple&apos;s prompt, or change it later in Settings →
          Privacy &amp; Security → Tracking, and ads will not be personalised. In the EU, UK and Switzerland you can choose <B>No ads</B>
          (More ••• → About &amp; Privacy → Ads → Review ad choices).
        </li>
        <li>
          <B>An ad looks wrong or inappropriate.</B> Email <Mail /> with a screenshot and the time, and we will report it to the ad service.
        </li>
      </List>

      <H2>Privacy</H2>
      <P>
        {APP_NAME} has no account, and your pictures never leave your iPhone. The ad service collects some device and ad data, explained in the{" "}
        <Link href={`${BASE}/privacy-policy`} className={link}>
          Privacy Policy
        </Link>
        .
      </P>
    </LegalPage>
  );
}
