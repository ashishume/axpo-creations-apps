import { A, APP_NAME, B, BASE, H2, LegalPage, List, Mail, P } from "./CollageMagikLayout";
import { Link } from "wouter";

export default function CollageMagikTerms() {
  return (
    <LegalPage
      title={`${APP_NAME} Terms of Use`}
      path={`${BASE}/terms-of-service`}
      intro={
        <>
          These terms apply when you download and use the {APP_NAME} iPhone app from AxpoCreation (&quot;we&quot;,
          &quot;us&quot;). By using the app you agree to them. They sit alongside Apple&apos;s standard{" "}
          <A href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Licensed Application End User License Agreement</A>
          ; if the two conflict, Apple&apos;s agreement prevails on the points it covers.
        </>
      }
    >
      <H2>1. What the app does</H2>
      <P>
        {APP_NAME} lets you arrange up to nine photos and up to two videos into a collage, edit and trim them, add your own
        music, and export the result as an MP4 video or a PNG picture. It runs on your iPhone and needs no account.
      </P>

      <H2>2. Licence</H2>
      <P>
        We give you a personal, non-exclusive, non-transferable, revocable licence to install and use the app on
        Apple devices you own or control, for your own personal or business use, under Apple&apos;s usage rules. You may
        not copy, modify, reverse engineer, resell or redistribute the app, except where the law says you may.
      </P>

      <H2>3. Your content</H2>
      <List>
        <li>
          <B>You own your content.</B> Your photos, videos, music and the collages you make stay yours. We do not
          receive them and claim no rights over them.
        </li>
        <li>
          <B>You are responsible for it.</B> Only use pictures, videos and music that you made or have the right to
          use. This matters most for music: the app has no built-in music, so any soundtrack is a file you choose. If
          you share a collage publicly, check the rights and the rules of the service you share it on.
        </li>
        <li>
          Do not use the app to create or share content that is illegal, that infringes someone&apos;s rights, or that
          harms, harasses or exploits others.
        </li>
      </List>

      <H2>4. Your data stays on your iPhone</H2>
      <P>
        Your work and My Library are stored on your device only. We cannot recover a collage you delete or lose by
        deleting the app or the device, so keep a copy in Photos or elsewhere if it matters to you. See our{" "}
        <Link href={`${BASE}/privacy-policy`} className="text-indigo-500 dark:text-indigo-400 hover:underline">
          Privacy Policy
        </Link>
        .
      </P>

      <H2>5. Third-party services and trademarks</H2>
      <P>
        {APP_NAME} is an independent app. It is not made, sponsored or endorsed by Instagram, Meta, Apple or any other
        company. Names such as &quot;Instagram Story&quot; are used only to describe common picture sizes. Apps you
        share to are governed by their own terms.
      </P>

      <H2>6. Free to use</H2>
      <P>
        The app is free to download and use. We may add advertising or optional paid features in the future; if we do,
        we will update these terms and the Privacy Policy, and tell you in the app, before the change takes effect.
      </P>

      <H2>7. No warranty</H2>
      <P>
        We work to make the app reliable, but it is provided &quot;as is&quot; and &quot;as available&quot;, without
        warranties of any kind to the extent the law allows. Video encoding depends on your device, its free storage and
        the files you import, so we cannot promise that every file will import or export, or that exports will be free
        of errors.
      </P>

      <H2>8. Limit of liability</H2>
      <P>
        To the extent the law allows, we are not liable for indirect or consequential loss, or for loss of files or
        data, arising from your use of the app. Nothing in these terms limits liability that cannot be limited by law,
        or any consumer rights you have where you live.
      </P>

      <H2>9. Ending these terms</H2>
      <P>
        You can stop using the app at any time by deleting it. We may update or discontinue the app. If you breach these
        terms, your licence to use the app ends.
      </P>

      <H2>10. Changes and governing law</H2>
      <P>
        We may update these terms; we will change the effective date and describe significant changes in the app&apos;s
        release notes. Continuing to use the app after a change means you accept it. These terms are governed by the
        laws of India, and the courts of India have jurisdiction, subject to any mandatory rights where you live.
      </P>

      <H2>11. Contact</H2>
      <P>
        Questions or complaints: <Mail />.
      </P>
    </LegalPage>
  );
}
