import { Link } from "wouter";
import { APP_NAME, B, BASE, H2, LegalPage, List, Mail, P } from "./CollageMagikLayout";

export default function CollageMagikAccountDeletion() {
  return (
    <LegalPage
      title={`Delete your ${APP_NAME} data`}
      path={`${BASE}/account-deletion`}
      intro={
        <>
          {APP_NAME} has <B>no accounts</B>, so there is no account to delete and nothing is stored on our servers.
          Everything the app keeps lives on your iPhone, and you can remove all of it yourself in a few taps.
        </>
      }
    >
      <H2>Delete everything in the app</H2>
      <List ordered>
        <li>Open {APP_NAME}.</li>
        <li>
          Tap the <B>•••</B> menu at the top left and choose <B>About &amp; Privacy</B>.
        </li>
        <li>
          Under <B>Data on this iPhone</B>, tap <B>Delete all my data</B> and confirm.
        </li>
      </List>
      <P>
        This permanently deletes every collage in My Library, clears the collage you are working on and removes the
        temporary working copies of the photos, videos and music you imported. It cannot be undone.
      </P>

      <H2>Delete a single collage</H2>
      <List ordered>
        <li>
          Tap <B>•••</B> and choose <B>My Library</B>.
        </li>
        <li>
          Touch and hold a collage and tap <B>Delete</B>, or open it and tap <B>Delete</B>.
        </li>
      </List>

      <H2>Delete the app</H2>
      <P>
        Deleting {APP_NAME} from your iPhone (touch and hold the app icon, then Remove App → Delete App) removes the app
        and all the data it stored, including My Library.
      </P>

      <H2>Pictures you saved to Photos</H2>
      <P>
        If you used <B>Save to Photos</B> or shared a collage to another app, those copies belong to your Photos library
        or to that app. Delete them in Photos (or in that app); {APP_NAME} cannot remove them. If you used iCloud Photos,
        deleting there removes them from your other devices.
      </P>

      <H2>What we hold</H2>
      <P>
        Nothing. We do not receive your photos, videos, music or collages, and we keep no account or personal profile
        about you. If you emailed us for support, we keep that email only as long as needed to help you; ask us at{" "}
        <Mail /> and we will delete it. For details, read the{" "}
        <Link href={`${BASE}/privacy-policy`} className="text-indigo-500 dark:text-indigo-400 hover:underline">
          Privacy Policy
        </Link>
        .
      </P>
    </LegalPage>
  );
}
