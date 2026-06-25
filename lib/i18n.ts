export type Language = "en" | "sv" | "ar";
export type Direction = "ltr" | "rtl";

type TranslationValue = string | string[] | TranslationTree;
type TranslationTree = { [key: string]: TranslationValue };

export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_STORAGE_KEY = "portfolio-language";

export const LANGUAGES: Array<{
  code: Language;
  label: string;
  shortLabel: string;
  locale: string;
  dir: Direction;
}> = [
  { code: "en", label: "English", shortLabel: "EN", locale: "en-US", dir: "ltr" },
  { code: "sv", label: "Svenska", shortLabel: "SV", locale: "sv-SE", dir: "ltr" },
  { code: "ar", label: "العربية", shortLabel: "AR", locale: "ar", dir: "rtl" },
];

export const translations = {
  en: {
    language: {
      label: "Language",
      selectLabel: "Choose language",
    },
    nav: {
      home: "Home",
      skills: "Skills",
      roadmap: "Roadmap",
      projects: "Projects",
      contact: "Contact",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      siteNavigation: "Site navigation",
    },
    common: {
      retry: "Retry",
      present: "present",
      remove: "Remove",
    },
    home: {
      rolePrefix: "Software",
      roles: ["Engineer", "Developer"],
      tagline:
        "I craft fast, accessible web and systems software, turning ideas into clean interfaces backed by reliable, well-tested code.",
      focusAreas: ["AI Engineering", "Security", "Full-Stack", "Systems", "DevOps"],
      viewProjects: "View Projects",
      downloadCv: "Download CV",
    },
    skills: {
      toolbox: "Toolbox",
      title: "Skills & Technologies",
      loading: "Loading skills...",
      fetchError: "Could not fetch skills from the database.",
      empty: "No skills were found in the database.",
      configHint: "Configure SUPABASE_ANON_KEY in .env.local and run setup.sql in the Supabase SQL Editor.",
      categories: {
        frontend: {
          title: "Frontend & Mobile",
          blurb: "Interfaces, frameworks, and app experiences for the browser and mobile.",
        },
        mobile: {
          title: "Mobile",
          blurb: "Native and cross-platform apps for phones and tablets.",
        },
        backend: {
          title: "Backend & Systems",
          blurb: "Services, system logic, and the code that powers everything behind the scenes.",
        },
        storage: {
          title: "APIs & Storage",
          blurb: "APIs, databases, and the data layer that keeps apps reliable.",
        },
        devops: {
          title: "Cloud, DevOps & Testing",
          blurb: "Deployment, automation, testing, and calm release workflows.",
        },
        ai: {
          title: "AI/ML & Data",
          blurb: "LLMs, prompts, intelligent workflows, and data-driven features.",
        },
        design: {
          title: "IDEs & Design",
          blurb: "Editors and design tools that shape the development loop.",
        },
        workflow: {
          title: "Tools & Workflow",
          blurb: "Testing, tracking, and the glue for calm collaboration.",
        },
        webdata: {
          title: "Web & Data",
          blurb: "Web fundamentals, servers, and database tooling.",
        },
        languages: {
          title: "Languages",
          blurb: "Core programming languages that power the rest of the stack.",
        },
      },
    },
    roadmap: {
      loading: "Loading roadmap...",
      career: "career",
      commits: "commits",
      branches: "branches",
      main: "main",
      verified: "Verified",
      present: "present",
    },
    projects: {
      loading: "Loading projects...",
      retry: "Retry",
      noRepos: "No repositories available right now.",
      repositories: "repositories",
      repos: "repos",
      searchPlaceholder: "Find a repository...",
      sortRecent: "Sort: Recently pushed",
      sortName: "Sort: Name",
      resultOne: "result",
      resultMany: "results",
      lastSixMonths: "last 6 months",
      repositoryOne: "repository",
      repositoryMany: "repositories",
      noMatchStart: "No repositories matched",
      viewAllGithub: "View all repositories on GitHub",
      noDescription: "No description provided.",
      categories: {
        "Full-Stack": "Full-Stack",
        Mobile: "Mobile",
        Systems: "Systems",
        Build: "Build",
      },
    },
    projectRow: {
      public: "Public",
      star: "Star",
      updated: "Updated",
    },
    contact: {
      title: "Get in touch",
      intro:
        "Whether it is a collaboration, an opportunity, or just a friendly hello, I would love to hear from you. I will get back to you soon.",
      openIssue: "Open an issue",
      sentTitle: "Message sent, thank you!",
      sentBody: "I will get back to you as soon as I can.",
      openAnother: "Open another",
      yourName: "Your name",
      yourEmail: "Your email",
      addComment: "Add a comment",
      commentPlaceholder: "Tell me about the opportunity, collaboration, or just say hi...",
      dropFiles: "Drop files to attach",
      attachFiles: "Attach files, or drag and drop them here",
      max: "max",
      formatHint: "Select any text, then click a button to format it, just like a document.",
      submitIssue: "Submit new issue",
      submitting: "Submitting...",
      assignees: "Assignees",
      labels: "Labels",
      connect: "Connect",
      nameCount: "Name",
      emailCount: "Email",
      linkUrlPrompt: "Link URL",
      selectedAdded: "selected and added to your message.",
      tapLabels: "Tap any that fit your message.",
      errors: {
        required: "Please fill in your name, email and message.",
        invalidEmail: "That email address does not look right.",
        tooLong: "Message is too long",
        attachments: "Attachments exceed",
        send: "Something went wrong sending your message. Please try again.",
      },
      tools: {
        bold: "Bold",
        italic: "Italic",
        code: "Inline code",
        link: "Link",
        quote: "Quote",
        list: "Bulleted list",
      },
    },
    footer: {
      rights: "All Rights Reserved",
    },
    chat: {
      open: "Open AI chat",
      close: "Close chat",
      title: "AI Chat",
      subtitle: "Portfolio assistant",
      initial: "Hi, I am Mouaz's AI assistant. Ask me about projects, skills, experience, or how to get in touch.",
      placeholder: "Ask about Mouaz...",
      send: "Send message",
      sending: "Thinking...",
      error: "I could not answer right now. Please try again.",
      projectsQuick: "Projects",
      skillsQuick: "Skills",
      contactQuick: "Contact",
    },
  },
  sv: {
    language: {
      label: "Språk",
      selectLabel: "Välj språk",
    },
    nav: {
      home: "Hem",
      skills: "Kompetenser",
      roadmap: "Resa",
      projects: "Projekt",
      contact: "Kontakt",
      openMenu: "Öppna meny",
      closeMenu: "Stäng meny",
      siteNavigation: "Sidnavigation",
    },
    common: {
      retry: "Försök igen",
      present: "nu",
      remove: "Ta bort",
    },
    home: {
      rolePrefix: "",
      roles: ["Mjukvaruutvecklare", "Systemutvecklare"],
      tagline:
        "Jag bygger moderna webbappar, AI-funktioner och systemlösningar med tydliga gränssnitt, stabil arkitektur och ren kod.",
      focusAreas: ["AI", "Säkerhet", "Fullstack", "System", "DevOps"],
      viewProjects: "Visa projekt",
      downloadCv: "Ladda ner CV",
    },
    skills: {
      toolbox: "Verktygslåda",
      title: "Kompetenser & tekniker",
      loading: "Laddar kompetenser...",
      fetchError: "Kunde inte hämta kompetenser från databasen.",
      empty: "Inga kompetenser hittades i databasen.",
      configHint: "Konfigurera SUPABASE_ANON_KEY i .env.local och kör setup.sql i Supabase SQL Editor.",
      categories: {
        frontend: {
          title: "Frontend & mobil",
          blurb: "Gränssnitt, ramverk och appupplevelser för webben och mobilen.",
        },
        mobile: {
          title: "Mobil",
          blurb: "Native och cross-platform appar för telefoner och surfplattor.",
        },
        backend: {
          title: "Backend & system",
          blurb: "Tjänster, systemlogik och kod som driver allt bakom kulisserna.",
        },
        storage: {
          title: "API:er & lagring",
          blurb: "API:er, databaser och datalager som håller appar pålitliga.",
        },
        devops: {
          title: "Cloud, DevOps & test",
          blurb: "Driftsättning, automation, testning och lugna releaseflöden.",
        },
        ai: {
          title: "AI/ML & data",
          blurb: "LLM:er, prompts, smarta arbetsflöden och datadrivna funktioner.",
        },
        design: {
          title: "IDE:er & design",
          blurb: "Editorer och designverktyg som formar utvecklingsloopen.",
        },
        workflow: {
          title: "Verktyg & workflow",
          blurb: "Testning, planering och verktygen som håller samarbetet lugnt.",
        },
        webdata: {
          title: "Webb & data",
          blurb: "Webbgrunder, servrar och databasverktyg.",
        },
        languages: {
          title: "Språk",
          blurb: "Kärnspråk som resten av stacken bygger på.",
        },
      },
    },
    roadmap: {
      loading: "Laddar resa...",
      career: "karriär",
      commits: "commits",
      branches: "grenar",
      main: "main",
      verified: "Verifierad",
      present: "nu",
    },
    projects: {
      loading: "Laddar projekt...",
      retry: "Försök igen",
      noRepos: "Inga repositories är tillgängliga just nu.",
      repositories: "repositories",
      repos: "repos",
      searchPlaceholder: "Sök repository...",
      sortRecent: "Sortera: senast uppdaterade",
      sortName: "Sortera: namn",
      resultOne: "resultat",
      resultMany: "resultat",
      lastSixMonths: "senaste 6 månaderna",
      repositoryOne: "repository",
      repositoryMany: "repositories",
      noMatchStart: "Inga repositories matchade",
      viewAllGithub: "Visa alla repositories på GitHub",
      noDescription: "Ingen beskrivning finns.",
      categories: {
        "Full-Stack": "Fullstack",
        Mobile: "Mobil",
        Systems: "System",
        Build: "Bygge",
      },
    },
    projectRow: {
      public: "Publik",
      star: "Stjärna",
      updated: "Uppdaterad",
    },
    contact: {
      title: "Hör av dig",
      intro:
        "Oavsett om det gäller samarbete, en möjlighet eller bara ett hej vill jag gärna höra från dig. Jag återkommer snart.",
      openIssue: "Öppna ärende",
      sentTitle: "Meddelandet skickades, tack!",
      sentBody: "Jag återkommer så snart jag kan.",
      openAnother: "Öppna ett till",
      yourName: "Ditt namn",
      yourEmail: "Din e-post",
      addComment: "Lägg till kommentar",
      commentPlaceholder: "Berätta om möjligheten, samarbetet eller säg bara hej...",
      dropFiles: "Släpp filer här",
      attachFiles: "Bifoga filer, eller dra och släpp dem här",
      max: "max",
      formatHint: "Markera text och klicka på en knapp för att formatera den, precis som i ett dokument.",
      submitIssue: "Skicka ärende",
      submitting: "Skickar...",
      assignees: "Tilldelade",
      labels: "Etiketter",
      connect: "Kontaktvägar",
      nameCount: "Namn",
      emailCount: "E-post",
      linkUrlPrompt: "Länk-URL",
      selectedAdded: "valda och tillagda i ditt meddelande.",
      tapLabels: "Tryck på de som passar ditt meddelande.",
      errors: {
        required: "Fyll i namn, e-post och meddelande.",
        invalidEmail: "Den e-postadressen ser inte rätt ut.",
        tooLong: "Meddelandet är för långt",
        attachments: "Bilagor överstiger",
        send: "Något gick fel när meddelandet skulle skickas. Försök igen.",
      },
      tools: {
        bold: "Fetstil",
        italic: "Kursiv",
        code: "Inline-kod",
        link: "Länk",
        quote: "Citat",
        list: "Punktlista",
      },
    },
    footer: {
      rights: "Alla rättigheter förbehållna",
    },
    chat: {
      open: "Öppna AI-chatt",
      close: "Stäng chatt",
      title: "AI-chatt",
      subtitle: "Portfolioassistent",
      initial: "Hej, jag är Mouaz AI-assistent. Fråga mig om projekt, kompetenser, erfarenhet eller kontakt.",
      placeholder: "Fråga om Mouaz...",
      send: "Skicka meddelande",
      sending: "Tänker...",
      error: "Jag kunde inte svara just nu. Försök igen.",
      projectsQuick: "Projekt",
      skillsQuick: "Kompetenser",
      contactQuick: "Kontakt",
    },
  },
  ar: {
    language: {
      label: "اللغة",
      selectLabel: "اختر اللغة",
    },
    nav: {
      home: "الرئيسية",
      skills: "المهارات",
      roadmap: "المسار",
      projects: "المشاريع",
      contact: "تواصل",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      siteNavigation: "تنقل الموقع",
    },
    common: {
      retry: "حاول مرة أخرى",
      present: "حتى الآن",
      remove: "إزالة",
    },
    home: {
      rolePrefix: "مهندس",
      roles: ["برمجيات", "تطبيقات ويب"],
      tagline:
        "أبني برمجيات ويب وأنظمة سريعة وسهلة الوصول، وأحول الأفكار إلى واجهات واضحة مدعومة بكود موثوق ومختبر.",
      focusAreas: ["هندسة الذكاء الاصطناعي", "الأمن", "تطوير متكامل", "الأنظمة", "DevOps"],
      viewProjects: "عرض المشاريع",
      downloadCv: "تحميل السيرة الذاتية",
    },
    skills: {
      toolbox: "الأدوات",
      title: "المهارات والتقنيات",
      loading: "جاري تحميل المهارات...",
      fetchError: "تعذر جلب المهارات من قاعدة البيانات.",
      empty: "لم يتم العثور على مهارات في قاعدة البيانات.",
      configHint: "اضبط SUPABASE_ANON_KEY في .env.local وشغل setup.sql في Supabase SQL Editor.",
      categories: {
        frontend: {
          title: "الواجهات والموبايل",
          blurb: "واجهات وتجارب تطبيقات للويب والموبايل.",
        },
        mobile: {
          title: "الموبايل",
          blurb: "تطبيقات أصلية ومتعددة المنصات للهواتف والأجهزة اللوحية.",
        },
        backend: {
          title: "الخلفية والأنظمة",
          blurb: "خدمات ومنطق أنظمة والكود الذي يعمل خلف الواجهة.",
        },
        storage: {
          title: "API والتخزين",
          blurb: "واجهات API وقواعد بيانات وطبقة بيانات تجعل التطبيقات موثوقة.",
        },
        devops: {
          title: "السحابة و DevOps والاختبار",
          blurb: "نشر وأتمتة واختبار وسير عمل هادئ للإصدارات.",
        },
        ai: {
          title: "AI/ML والبيانات",
          blurb: "نماذج لغوية و prompts وسير عمل ذكي وميزات مبنية على البيانات.",
        },
        design: {
          title: "بيئات التطوير والتصميم",
          blurb: "محررات وأدوات تصميم تشكل دورة التطوير.",
        },
        workflow: {
          title: "الأدوات وسير العمل",
          blurb: "اختبار وتتبع وأدوات تساعد على تعاون منظم.",
        },
        webdata: {
          title: "الويب والبيانات",
          blurb: "أساسيات الويب والخوادم وأدوات قواعد البيانات.",
        },
        languages: {
          title: "اللغات",
          blurb: "لغات برمجة أساسية تبنى عليها بقية المنظومة.",
        },
      },
    },
    roadmap: {
      loading: "جاري تحميل المسار...",
      career: "المسيرة",
      commits: "تحديثات",
      branches: "فروع",
      main: "main",
      verified: "موثق",
      present: "حتى الآن",
    },
    projects: {
      loading: "جاري تحميل المشاريع...",
      retry: "حاول مرة أخرى",
      noRepos: "لا توجد مستودعات متاحة الآن.",
      repositories: "المستودعات",
      repos: "مستودعات",
      searchPlaceholder: "ابحث عن مستودع...",
      sortRecent: "ترتيب: الأحدث تحديثا",
      sortName: "ترتيب: الاسم",
      resultOne: "نتيجة",
      resultMany: "نتائج",
      lastSixMonths: "آخر 6 أشهر",
      repositoryOne: "مستودع",
      repositoryMany: "مستودعات",
      noMatchStart: "لم تطابق أي مستودعات",
      viewAllGithub: "عرض كل المستودعات على GitHub",
      noDescription: "لا يوجد وصف.",
      categories: {
        "Full-Stack": "تطوير متكامل",
        Mobile: "موبايل",
        Systems: "أنظمة",
        Build: "بناء",
      },
    },
    projectRow: {
      public: "عام",
      star: "نجمة",
      updated: "تم التحديث",
    },
    contact: {
      title: "تواصل معي",
      intro:
        "سواء كان الأمر تعاونا أو فرصة أو مجرد تحية، يسعدني أن أسمع منك. سأرد عليك قريبا.",
      openIssue: "فتح طلب",
      sentTitle: "تم إرسال الرسالة، شكرا لك!",
      sentBody: "سأعود إليك في أقرب وقت ممكن.",
      openAnother: "فتح طلب آخر",
      yourName: "اسمك",
      yourEmail: "بريدك الإلكتروني",
      addComment: "أضف تعليقا",
      commentPlaceholder: "أخبرني عن الفرصة أو التعاون أو قل مرحبا...",
      dropFiles: "أفلت الملفات للإرفاق",
      attachFiles: "أرفق ملفات، أو اسحبها وأفلتها هنا",
      max: "الحد",
      formatHint: "حدد أي نص ثم اضغط زرا لتنسيقه مثل المستند.",
      submitIssue: "إرسال الطلب",
      submitting: "جار الإرسال...",
      assignees: "المسؤولون",
      labels: "التصنيفات",
      connect: "روابط التواصل",
      nameCount: "الاسم",
      emailCount: "البريد",
      linkUrlPrompt: "رابط URL",
      selectedAdded: "تم اختيارها وإضافتها إلى رسالتك.",
      tapLabels: "اضغط على ما يناسب رسالتك.",
      errors: {
        required: "يرجى ملء الاسم والبريد والرسالة.",
        invalidEmail: "عنوان البريد الإلكتروني غير صحيح.",
        tooLong: "الرسالة طويلة جدا",
        attachments: "المرفقات تتجاوز",
        send: "حدث خطأ أثناء إرسال رسالتك. حاول مرة أخرى.",
      },
      tools: {
        bold: "غامق",
        italic: "مائل",
        code: "كود داخل السطر",
        link: "رابط",
        quote: "اقتباس",
        list: "قائمة نقطية",
      },
    },
    footer: {
      rights: "جميع الحقوق محفوظة",
    },
    chat: {
      open: "فتح محادثة AI",
      close: "إغلاق المحادثة",
      title: "محادثة AI",
      subtitle: "مساعد البورتفوليو",
      initial: "مرحبا، أنا مساعد Mouaz بالذكاء الاصطناعي. اسألني عن المشاريع أو المهارات أو الخبرة أو التواصل.",
      placeholder: "اسأل عن Mouaz...",
      send: "إرسال رسالة",
      sending: "أفكر...",
      error: "لم أتمكن من الإجابة الآن. حاول مرة أخرى.",
      projectsQuick: "المشاريع",
      skillsQuick: "المهارات",
      contactQuick: "تواصل",
    },
  },
} satisfies Record<Language, TranslationTree>;

function readPath(tree: TranslationTree, path: string): TranslationValue | undefined {
  return path.split(".").reduce<TranslationValue | undefined>((current, segment) => {
    if (!current || typeof current === "string" || Array.isArray(current)) return undefined;
    return current[segment];
  }, tree);
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && LANGUAGES.some((language) => language.code === value);
}

export function getLanguageMeta(language: Language) {
  return LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[0];
}

export function translate(language: Language, key: string): string {
  const value = readPath(translations[language], key) ?? readPath(translations.en, key);
  return typeof value === "string" ? value : key;
}

export function translateOr(language: Language, key: string, fallback: string): string {
  const value = readPath(translations[language], key) ?? readPath(translations.en, key);
  return typeof value === "string" ? value : fallback;
}

export function translateList(language: Language, key: string): string[] {
  const value = readPath(translations[language], key) ?? readPath(translations.en, key);
  return Array.isArray(value) ? [...value] : [];
}
