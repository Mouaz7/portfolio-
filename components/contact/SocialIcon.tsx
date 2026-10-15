import Image from "next/image";
import { isSocialIconUrl, isSvgPath, type ContactSocialLink } from "@/lib/contact/social-links";

type SocialIconProps = {
  link: ContactSocialLink;
  className: string;
  size: number;
};

export default function SocialIcon({ link, className, size }: SocialIconProps) {
  const icon = link.svgPath.trim();
  if (isSocialIconUrl(icon)) {
    return <Image src={icon} alt="" width={size} height={size} className={className} unoptimized />;
  }
  if (isSvgPath(icon)) {
    return <svg viewBox={link.viewBox ?? "0 0 24 24"} className={className} aria-hidden="true"><path d={icon} fill="currentColor" /></svg>;
  }
  return <span className={className} aria-hidden="true" />;
}
