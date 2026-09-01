export const HOME_CAPABILITY_ICON_KEYS = [
  "backend",
  "ai",
  "secure-web",
  "cloud-devops",
  "quality",
] as const;

export type HomeCapabilityIconKey = (typeof HOME_CAPABILITY_ICON_KEYS)[number];

export type HomeCapability = {
  id: string;
  title: string;
  description: string;
  iconKey: HomeCapabilityIconKey;
};

export type HomeContent = {
  introPrefix: string;
  displayName: string;
  rolePrefix: string;
  roleWords: string[];
  capabilities: HomeCapability[];
};

const EN_HOME_CONTENT: HomeContent = {
  introPrefix: "I’m ",
  displayName: "Mouaz",
  rolePrefix: "",
  roleWords: [
    "Software Engineer",
    "Designer",
    "Developer",
    "AI Developer",
    "Web Developer",
    "Cybersecurity",
    "Software Engineer",
  ],
  capabilities: [
    {
      id: "backend",
      title: "Backend Systems",
      description: "APIs, databases and scalable architecture",
      iconKey: "backend",
    },
    {
      id: "ai",
      title: "AI Integrations",
      description: "LLMs, automation and intelligent workflows",
      iconKey: "ai",
    },
    {
      id: "secure-web",
      title: "Secure Web",
      description: "Authentication, validation and reliable systems",
      iconKey: "secure-web",
    },
    {
      id: "cloud-devops",
      title: "Cloud & DevOps",
      description: "CI/CD, containers and reliable deployments",
      iconKey: "cloud-devops",
    },
    {
      id: "quality",
      title: "Quality Engineering",
      description: "Testing, observability and system reliability",
      iconKey: "quality",
    },
  ],
};

const SV_HOME_CONTENT: HomeContent = {
  introPrefix: "Jag är ",
  displayName: "Mouaz",
  rolePrefix: "",
  roleWords: ["Mjukvaruingenjör", "Designer", "Utvecklare", "AI-utvecklare", "Webbutvecklare", "Cybersäkerhet", "Mjukvaruingenjör"],
  capabilities: [
    { id: "backend", title: "Backendsystem", description: "API:er, databaser och skalbar arkitektur", iconKey: "backend" },
    { id: "ai", title: "AI-integrationer", description: "LLM:er, automation och intelligenta arbetsflöden", iconKey: "ai" },
    { id: "secure-web", title: "Säker webb", description: "Autentisering, validering och tillförlitliga system", iconKey: "secure-web" },
    { id: "cloud-devops", title: "Moln och DevOps", description: "CI/CD, containrar och stabila driftsättningar", iconKey: "cloud-devops" },
    { id: "quality", title: "Kvalitetsteknik", description: "Testning, observerbarhet och systemtillförlitlighet", iconKey: "quality" },
  ],
};

const AR_HOME_CONTENT: HomeContent = {
  introPrefix: "أنا ",
  displayName: "معاذ",
  rolePrefix: "",
  roleWords: ["مهندس برمجيات", "مصمم", "مطوّر", "مطوّر ذكاء اصطناعي", "مطوّر ويب", "الأمن السيبراني", "مهندس برمجيات"],
  capabilities: [
    { id: "backend", title: "أنظمة الخلفية", description: "واجهات API وقواعد بيانات وبنية قابلة للتوسع", iconKey: "backend" },
    { id: "ai", title: "تكامل الذكاء الاصطناعي", description: "نماذج لغوية وأتمتة وتدفقات عمل ذكية", iconKey: "ai" },
    { id: "secure-web", title: "ويب آمن", description: "مصادقة وتحقق وأنظمة موثوقة", iconKey: "secure-web" },
    { id: "cloud-devops", title: "السحابة وDevOps", description: "CI/CD وحاويات ونشر موثوق", iconKey: "cloud-devops" },
    { id: "quality", title: "هندسة الجودة", description: "اختبارات ومراقبة وموثوقية الأنظمة", iconKey: "quality" },
  ],
};

export const FALLBACK_HOME_CONTENT = EN_HOME_CONTENT;

export function fallbackHomeContent(locale: "en" | "sv" | "ar"): HomeContent {
  if (locale === "sv") return SV_HOME_CONTENT;
  if (locale === "ar") return AR_HOME_CONTENT;
  return EN_HOME_CONTENT;
}
