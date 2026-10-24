import ContactPage from "@/app/contact/contact-page";
import { localizedPageMetadata } from "@/lib/page-metadata";
import { getContactLinks } from "@/lib/contact/data.server";
import { contactAttachmentsAvailable } from "@/lib/contact/malware-scanner.server";
import { logServerError } from "@/lib/security/safe-logger.server";

export const generateMetadata = () => localizedPageMetadata("contact", "/contact");

export default async function Page() {
  const initialLinks = await getContactLinks().catch((error) => {
    logServerError("page.contact.initial_links_failed", error, {
      route: "/contact",
    });
    return undefined;
  });

  return (
    <ContactPage
      attachmentsEnabled={contactAttachmentsAvailable()}
      initialLinks={initialLinks}
    />
  );
}
