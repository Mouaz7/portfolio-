import CodeReviewPage from "@/app/code-review-page/code-review-page";
import { localizedPageMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => localizedPageMetadata("codeReview", "/code-review");

export default function Page() {
  return <CodeReviewPage />;
}
