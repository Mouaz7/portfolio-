import ContactPage from "./contact-page";
import { localizedPageMetadata } from "@/lib/page-metadata";
import { getContactLinks } from "@/lib/contact/data.server";

export const generateMetadata = () => localizedPageMetadata("contact", "/contact-page");

export default async function Page() {
  const initialLinks = await getContactLinks().catch((error) => {
    console.error("[contact-page] initial links failed:", error);
    return undefined;
  });

  return <ContactPage initialLinks={initialLinks} />;
}
