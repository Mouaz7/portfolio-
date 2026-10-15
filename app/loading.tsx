import PageLoadingStage from "@/components/ui/PageLoadingStage";

/**
 * Give App Router a real Suspense boundary so the URL commits immediately
 * while a dynamic server route is resolving. The completed page still owns
 * the existing approved presentation.
 */
export default function Loading() {
  return <PageLoadingStage text="Loading" noun="page" />;
}
