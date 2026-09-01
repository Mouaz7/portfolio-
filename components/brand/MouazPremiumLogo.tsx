import styles from "./MouazPremiumLogo.module.css";

type MouazPremiumLogoProps = {
  size?: "sm" | "md";
};

export default function MouazPremiumLogo({
  size = "md",
}: MouazPremiumLogoProps) {
  return (
    <span
      className={styles.logo}
      data-size={size}
      role="img"
      aria-label="Mouaz"
    >
      <svg
        className={styles.compact}
        viewBox="0 0 96 104"
        aria-hidden="true"
      >
        <path
          className={styles.inkFill}
          d="M4 74V8h24l20 17L68 8h24v29L68 58V38L48 59 28 38v36H4Z"
        />
        <path
          className={styles.accentFill}
          d="M37 74 92 30v44H68V52L43 74h-6Z"
        />
        <rect className={styles.inkFill} x="0" y="78" width="96" height="26" rx="2" />
        <g
          className={styles.cutoutStroke}
          transform="translate(4.5 82) scale(.36)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 45V4l17 21L38 4v41" />
          <rect x="51" y="4" width="43" height="41" rx="18" />
          <path d="M106 4v23c0 12 6 18 17 18s17-6 17-18V4" />
          <path d="m152 45 17-41 17 41" />
          <path d="M199 4h38l-38 41h38" />
        </g>
      </svg>
    </span>
  );
}
