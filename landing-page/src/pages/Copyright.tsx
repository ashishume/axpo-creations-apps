import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function Copyright() {
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
            Copyright Notice
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Last updated: March 2025
          </p>

          <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
            © {new Date().getFullYear()} AxpoCreation. All rights reserved. This
            Copyright Notice applies to the AxpoCreation website, the Axpo
            Tracker app (expense tracking and bill splitting), and all other
            products and services offered under the AxpoCreation brand.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            1. Ownership of Content
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            All content on this site and in our applications—including but not
            limited to text, graphics, logos, icons, images, audio, video,
            software, and the design, structure, and arrangement thereof—is the
            property of AxpoCreation or its content suppliers and is protected by
            copyright, trademark, and other intellectual property laws. You may
            not reproduce, distribute, modify, or create derivative works from
            any of this content without our prior written permission.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            2. Trademarks
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            AxpoCreation, Axpo Tracker, and any other product or service names,
            logos, and slogans used on this site or in our apps are trademarks
            of AxpoCreation. You may not use these marks without our prior
            written consent. All other names, logos, and marks mentioned are the
            trademarks of their respective owners.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            3. User-Generated Content
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            You retain ownership of the data and content you create or upload
            when using our services (e.g. expenses, groups, notes). By using our
            services, you grant us the limited rights necessary to operate,
            store, and display that content as described in our{" "}
            <Link
              to="/terms-of-service"
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              Terms of Service
            </Link>
            . We do not claim ownership of your user-generated content.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            4. Permitted Use
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            You may view, download, and print pages from this website for
            personal, non-commercial use only, provided you do not remove or
            alter any copyright or other proprietary notices. Any other use,
            including reproduction for commercial purposes, is prohibited without
            our written permission.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            5. Copyright Infringement
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            If you believe that content on our site or in our apps infringes
            your copyright, please contact us with:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 mb-4">
            <li>Identification of the copyrighted work claimed to be infringed.</li>
            <li>Identification of the material that is claimed to be infringing.</li>
            <li>Your contact information and a statement that you have a good-faith belief that use of the material is not authorized.</li>
            <li>A statement that the information in your notice is accurate and that you are authorized to act on behalf of the copyright owner.</li>
          </ul>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            We will respond to valid notices in accordance with applicable law
            and may remove or disable access to the allegedly infringing content.
          </p>

          <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">
            6. Contact
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            For copyright-related inquiries or permission requests:
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-1">
            Email:{" "}
            <a
              href="mailto:ashishume@gmail.com"
              className="text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              ashishume@gmail.com
            </a>
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Subject line: AxpoCreation – Copyright
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
