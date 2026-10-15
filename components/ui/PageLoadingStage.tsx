import LoadingAnimation from "./LoadingAnimation";

type PageLoadingStageProps = {
  text: string;
  noun?: string;
};

/** Shared viewport-centered stage for every initial page-data loader. */
export default function PageLoadingStage({ text, noun }: PageLoadingStageProps) {
  return (
    <div className="page-loading-stage page-fade-in">
      <LoadingAnimation text={text} noun={noun} />
    </div>
  );
}
