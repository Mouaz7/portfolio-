import CodeReviewPage from "./code-review-page";
import { localizedPageMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => localizedPageMetadata("codeReview", "/code-review-page");

export default function Page() {
  return <CodeReviewPage />;
}
