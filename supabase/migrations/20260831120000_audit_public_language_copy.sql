-- Keep public copy grammatically correct across the source language and every
-- localized override. These updates are intentionally idempotent so the same
-- copy can be applied safely to existing and newly seeded environments.

begin;

update public.site_profile
set role_prefix = '',
    updated_at = timezone('utc', now());

with role_copy(sort_order, label) as (
  values
    (10, 'Software Engineer'),
    (20, 'Designer'),
    (30, 'Developer'),
    (40, 'AI Developer'),
    (50, 'Web Developer'),
    (60, 'Cybersecurity'),
    (70, 'Software Engineer')
)
update public.home_role as role
set label = role_copy.label,
    updated_at = timezone('utc', now())
from role_copy
where role.sort_order = role_copy.sort_order;

with localized_role(locale, sort_order, label) as (
  values
    ('sv', 10, 'Mjukvaruingenjör'),
    ('sv', 20, 'Designer'),
    ('sv', 30, 'Utvecklare'),
    ('sv', 40, 'AI-utvecklare'),
    ('sv', 50, 'Webbutvecklare'),
    ('sv', 60, 'Cybersäkerhet'),
    ('sv', 70, 'Mjukvaruingenjör'),
    ('ar', 10, 'مهندس برمجيات'),
    ('ar', 20, 'مصمم'),
    ('ar', 30, 'مطوّر'),
    ('ar', 40, 'مطوّر ذكاء اصطناعي'),
    ('ar', 50, 'مطوّر ويب'),
    ('ar', 60, 'الأمن السيبراني'),
    ('ar', 70, 'مهندس برمجيات')
)
insert into public.content_translation (
  entity_type,
  entity_id,
  locale,
  fields,
  updated_at
)
select
  'home_role',
  role.id::text,
  localized_role.locale,
  jsonb_build_object('label', localized_role.label),
  timezone('utc', now())
from localized_role
join public.home_role as role
  on role.sort_order = localized_role.sort_order
on conflict (entity_type, entity_id, locale) do update
set fields = content_translation.fields || excluded.fields,
    updated_at = excluded.updated_at;

with localized_project(locale, github_url, title, description) as (
  values
    ('ar', 'https://github.com/Mouaz7/portfolio-', 'معرض أعمال المطوّر', 'معرض أعمال متعدد اللغات، مبني باستخدام Next.js وTypeScript وTailwind CSS وSupabase.'),
    ('ar', 'https://github.com/Mouaz7/team-temp-app', 'عرض تطبيق Team Temp', 'توثيق مرئي ومقاطع فيديو لتطبيق Team Temp، وهو منصة مدعومة بالذكاء الاصطناعي لاستطلاعات الموظفين طُوّرت لصالح Softhouse.'),
    ('ar', 'https://github.com/Mouaz7/Move-Out', 'Move-Out: نظام صناديق النقل', 'نظام احترافي لإدارة صناديق النقل، مبني باستخدام Node.js وExpress وEJS، مع SQLite في بيئة التطوير وPostgreSQL/Supabase في الإنتاج وضوابط أمنية قوية.'),
    ('ar', 'https://github.com/Mouaz7/PongPal-Showcase', 'عرض PongPal', 'عرض مرئي لمشروع PongPal الذي طُوّر في Softhouse، ويعرض مسارات الحجز والإحصاءات وملفات المستخدمين. يحتوي المستودع على صور ومقاطع فيديو، وليس على الكود المصدري.'),
    ('ar', 'https://github.com/Mouaz7/Eshop-management-system', 'نظام إدارة متجر إلكتروني', 'نظام متكامل لإدارة التجارة الإلكترونية باستخدام Node.js وExpress وEJS وMariaDB، ويشمل إدارة المنتجات والفئات والطلبات والمخزون والإجراءات المخزنة والمشغلات وواجهة إدارية.'),
    ('ar', 'https://github.com/Mouaz7/BurgerProject', 'مشروع البرغر', 'تطبيق متكامل لطلبات البرغر مبني باستخدام Node.js وMySQL وEJS، ويشمل تخصيص الطلبات وعرض المطبخ وتكامل قاعدة البيانات.'),
    ('ar', 'https://github.com/Mouaz7/auto-healing-devops-platform', 'منصة DevOps ذاتية الإصلاح', 'مسار CI/CD ذاتي الإصلاح ومدعوم بالذكاء الاصطناعي، يضم ستة وكلاء متخصصين وخدمات MCP مصغّرة ونظام أمان يعتمد إشارات المرور ومقاييس Prometheus. طُوّر كمشروع تخرّج لدرجة البكالوريوس في BTH.'),
    ('ar', 'https://github.com/Mouaz7/Campus360', 'Campus360', 'تطبيق Android للملاحة داخل الحرم الجامعي، يضم خرائط داخلية وخارجية وتحديدًا للمسارات ومصادقة Firebase، ومبني باستخدام Kotlin وClean Architecture وMVVM.'),
    ('ar', 'https://github.com/Mouaz7/Asm-Buffered-IO', 'إدخال وإخراج مخزّن مؤقتًا بلغة التجميع', 'مكتبة إدخال وإخراج بلغة التجميع وC، تتضمن روتينات x86-64 للنصوص والأعداد وتطبيقات اختبار باللغتين.'),
    ('ar', 'https://github.com/Mouaz7/Concurrency-Systems', 'أنظمة التزامن', 'برمجة أنظمة منخفضة المستوى بلغة C تشمل تعدد الخيوط ومزامنة العمليات وآليات IPC وخوارزميات إدارة الذاكرة.'),
    ('ar', 'https://github.com/Mouaz7/Os_filesystem', 'نظام ملفات لنظام تشغيل', 'تنفيذ بلغة C++ لنظام ملفات قائم على FAT مع واجهة سطر أوامر.'),
    ('ar', 'https://github.com/Mouaz7/chess-game', 'لعبة شطرنج', 'لعبة شطرنج خفيفة مبنية باستخدام C++ وSFML 3.0، وتتضمن اقتراحات للحركات ونقاط القطع وأسماء اللاعبين ومؤقتات مدتها عشر دقائق ونتائج محفوظة تلقائيًا.'),
    ('ar', 'https://github.com/Mouaz7/Python-Linked-List', 'قائمة مترابطة ببايثون', 'تنفيذ بلغة Python لصنف TwoCell الخاص بالقوائم المترابطة المزدوجة.'),
    ('ar', 'https://github.com/Mouaz7/Python-Table-Implementations', 'تنفيذات الجداول ببايثون', 'تنفيذات واختبارات أداء لنوع بيانات الجدول في Python، تشمل TableAsArray وTableAsList وTableAsMTF.'),
    ('ar', 'https://github.com/Mouaz7/ARM-Interrupt-UART-Display', 'مقاطعات ARM وشاشة UART', 'مشروع بلغة التجميع لمعالج ARM Cortex-A9 يتعامل مع مقاطعات الأزرار ويقرأ أوامر UART ويحدّث شاشة سباعية المقاطع.'),
    ('ar', 'https://github.com/Mouaz7/ARM-UART-Factorial', 'حساب المضروب باستخدام ARM وUART', 'مشروع مدمج بلغة التجميع لمعمارية ARM يحسب المضروب بالاستدعاء الذاتي ويطبع النتائج عبر UART.'),
    ('ar', 'https://github.com/Mouaz7/Practical-Communication', 'اتصالات شبكية عملية', 'مشروع عملي للاتصالات الشبكية يستخدم TCP وUDP ومتصفح ويب بسيطًا.'),
    ('ar', 'https://github.com/Mouaz7/network-udp-tcp-analysis', 'تحليل UDP وTCP', 'تحليل وتنفيذ اختبارات الإرسال والاستقبال عبر UDP وTCP، بما يشمل ملاحظات الأداء والتحسينات.'),
    ('ar', 'https://github.com/Mouaz7/Python-directed-graph-bfs', 'رسم بياني موجّه وBFS ببايثون', 'برنامج بلغة Python يفحص ترابط الرسوم البيانية الموجّهة باستخدام البحث بالعرض أولًا (BFS).'),
    ('ar', 'https://github.com/Mouaz7/typing-speed-tracker', 'متتبع سرعة الكتابة', 'برنامج بلغة Python يقيس سرعة الكتابة ويتابعها باستخدام قوائم كلمات بدرجات صعوبة مختلفة.'),
    ('ar', 'https://github.com/Mouaz7/Cpp-TransportSystem', 'نظام نقل بلغة C++', 'مشروع بلغة C++ لإدارة جداول النقل والحافلات المكوكية وحجوزات الركاب.'),
    ('ar', 'https://github.com/Mouaz7/bsv-duplicate', 'BSV Duplicate', 'مشروع دراسي يكتشف الإدخالات المكررة في ملفات BibTeX.'),
    ('ar', 'https://github.com/Mouaz7/bsv-edutask', 'BSV Edutask', 'مشروع تعليمي لمقرر PA1417 يطبّق تقنيات اختبار البرمجيات.'),
    ('ar', 'https://github.com/Mouaz7/quiz-game', 'لعبة أسئلة', 'نظام أسئلة كائني التوجّه بلغة C++ لإنشاء الاختبارات وإدارتها وتشغيلها، مع عدة أنواع من الأسئلة واللاعبين ولوحات الصدارة وإدارة الملفات وتوثيق UML.')
)
insert into public.content_translation (
  entity_type,
  entity_id,
  locale,
  fields,
  updated_at
)
select
  'project',
  project.id::text,
  localized_project.locale,
  jsonb_build_object(
    'title', localized_project.title,
    'description', localized_project.description
  ),
  timezone('utc', now())
from localized_project
join public.project as project
  on lower(rtrim(project.github_url, '/')) = lower(localized_project.github_url)
on conflict (entity_type, entity_id, locale) do update
set fields = content_translation.fields || excluded.fields,
    updated_at = excluded.updated_at;

with project_copy(github_url, title, description) as (
  values
    ('https://github.com/Mouaz7/portfolio-', 'Developer Portfolio', 'A multilingual developer portfolio built with Next.js, TypeScript, Tailwind CSS, and Supabase.'),
    ('https://github.com/Mouaz7/team-temp-app', 'Team Temp App Showcase', 'Visual and video documentation for Team Temp App, an AI-driven employee survey platform developed for Softhouse.'),
    ('https://github.com/Mouaz7/Move-Out', 'Move-Out: Moving Box System', 'A professional moving box management system built with Node.js, Express, and EJS, using SQLite for development and PostgreSQL/Supabase in production with robust security controls.'),
    ('https://github.com/Mouaz7/PongPal-Showcase', 'PongPal Showcase', 'A visual showcase of the PongPal project developed at Softhouse, featuring booking, statistics, and user profile flows. The repository contains images and videos, not source code.'),
    ('https://github.com/Mouaz7/Eshop-management-system', 'E-Shop Management System', 'A full-stack e-commerce management system built with Node.js, Express, EJS, and MariaDB, including product, category, order, and inventory management, stored procedures, triggers, and an admin interface.'),
    ('https://github.com/Mouaz7/BurgerProject', 'Burger Project', 'A full-stack burger ordering app built with Node.js, MySQL, and EJS, including order customization, a kitchen view, and database integration.'),
    ('https://github.com/Mouaz7/auto-healing-devops-platform', 'Auto-Healing DevOps Platform', 'An AI-powered, self-healing CI/CD pipeline with six specialized agents, MCP microservices, a traffic-light safety system, and Prometheus metrics. Developed as a bachelor’s thesis at BTH.'),
    ('https://github.com/Mouaz7/Campus360', 'Campus360', 'An Android campus navigation app with indoor and outdoor maps, pathfinding, and Firebase authentication, built with Kotlin, Clean Architecture, and MVVM.'),
    ('https://github.com/Mouaz7/Asm-Buffered-IO', 'Buffered I/O in Assembly', 'An Assembly and C I/O library with x86-64 routines for text and integer input/output, plus test applications in both languages.'),
    ('https://github.com/Mouaz7/Concurrency-Systems', 'Concurrency Systems', 'Low-level systems programming in C covering multithreading, process synchronization, IPC mechanisms, and memory-management algorithms.'),
    ('https://github.com/Mouaz7/Os_filesystem', 'OS Filesystem', 'A C++ implementation of a FAT-based file system with a command-line shell.'),
    ('https://github.com/Mouaz7/chess-game', 'Chess Game', 'A lightweight chess game built with C++ and SFML 3.0, featuring move hints, material scores, player names, 10-minute timers, and automatically saved results.'),
    ('https://github.com/Mouaz7/Python-Linked-List', 'Linked List in Python', 'A Python implementation of the TwoCell class for doubly linked lists.'),
    ('https://github.com/Mouaz7/Python-Table-Implementations', 'Python Table Implementations', 'Implementations and performance tests for a table ADT in Python, including TableAsArray, TableAsList, and TableAsMTF.'),
    ('https://github.com/Mouaz7/ARM-Interrupt-UART-Display', 'ARM Interrupt and UART Display', 'An ARM Cortex-A9 Assembly project that handles button interrupts, reads UART commands, and updates a seven-segment display.'),
    ('https://github.com/Mouaz7/ARM-UART-Factorial', 'ARM UART Factorial', 'A compact ARM Assembly project that computes factorials recursively and prints the results over UART.'),
    ('https://github.com/Mouaz7/Practical-Communication', 'Practical Network Communication', 'A practical network communication project using TCP, UDP, and a simple web browser.'),
    ('https://github.com/Mouaz7/network-udp-tcp-analysis', 'UDP and TCP Analysis', 'Analysis and implementation of UDP and TCP send-and-receive tests, including performance observations and improvements.'),
    ('https://github.com/Mouaz7/Python-directed-graph-bfs', 'Directed Graph and BFS in Python', 'A Python program that checks connectivity in directed graphs using breadth-first search (BFS).'),
    ('https://github.com/Mouaz7/typing-speed-tracker', 'Typing Speed Tracker', 'A Python program that measures and tracks typing speed with word lists at different difficulty levels.'),
    ('https://github.com/Mouaz7/Cpp-TransportSystem', 'C++ Transport System', 'A C++ project for managing transport schedules, shuttle services, and passenger bookings.'),
    ('https://github.com/Mouaz7/bsv-duplicate', 'BSV Duplicate', 'A course project that detects duplicate entries in BibTeX files.'),
    ('https://github.com/Mouaz7/bsv-edutask', 'BSV Edutask', 'An educational project for the PA1417 course that applies software-testing techniques.'),
    ('https://github.com/Mouaz7/quiz-game', 'Quiz Game', 'An object-oriented C++ quiz system for creating, managing, and playing quizzes, with multiple question types, players, leaderboards, file handling, and UML documentation.')
)
update public.project as project
set title = project_copy.title,
    description = project_copy.description,
    updated_at = timezone('utc', now())
from project_copy
where lower(rtrim(project.github_url, '/')) = lower(project_copy.github_url);

with localized_project(locale, github_url, title, description) as (
  values
    ('sv', 'https://github.com/Mouaz7/portfolio-', 'Utvecklarportfolio', 'En flerspråkig utvecklarportfolio byggd med Next.js, TypeScript, Tailwind CSS och Supabase.'),
    ('sv', 'https://github.com/Mouaz7/team-temp-app', 'Presentation av Team Temp-appen', 'Visuell dokumentation och videomaterial för Team Temp-appen, en AI-driven plattform för medarbetarundersökningar som utvecklades för Softhouse.'),
    ('sv', 'https://github.com/Mouaz7/Move-Out', 'Move-Out: system för flyttkartonger', 'Ett professionellt system för hantering av flyttkartonger, byggt med Node.js, Express och EJS, med SQLite under utveckling och PostgreSQL/Supabase i produktion samt robusta säkerhetsskydd.'),
    ('sv', 'https://github.com/Mouaz7/PongPal-Showcase', 'Presentation av PongPal', 'En visuell presentation av PongPal-projektet som utvecklades på Softhouse, med flöden för bokning, statistik och användarprofiler. Kodarkivet innehåller bilder och videor, inte källkod.'),
    ('sv', 'https://github.com/Mouaz7/Eshop-management-system', 'Administrationssystem för e-handel', 'Ett fullstacksystem för administration av e-handel, byggt med Node.js, Express, EJS och MariaDB. Det omfattar hantering av produkter, kategorier, beställningar och lager samt lagrade procedurer, triggers och ett administratörsgränssnitt.'),
    ('sv', 'https://github.com/Mouaz7/BurgerProject', 'Burgerprojekt', 'En fullstackapp för hamburgerbeställningar, byggd med Node.js, MySQL och EJS, med orderanpassning, köksvy och databasintegration.'),
    ('sv', 'https://github.com/Mouaz7/auto-healing-devops-platform', 'Självläkande DevOps-plattform', 'En AI-baserad, självläkande CI/CD-pipeline med sex specialiserade agenter, MCP-mikrotjänster, ett trafikljusbaserat säkerhetssystem och Prometheus-mätvärden. Utvecklad som kandidatarbete vid BTH.'),
    ('sv', 'https://github.com/Mouaz7/Campus360', 'Campus360', 'En Android-app för campusnavigering med inom- och utomhuskartor, ruttplanering och Firebase-autentisering, byggd med Kotlin, Clean Architecture och MVVM.'),
    ('sv', 'https://github.com/Mouaz7/Asm-Buffered-IO', 'Buffrad I/O i assembler', 'Ett I/O-bibliotek i assembler och C med x86-64-rutiner för in- och utmatning av text och heltal samt testapplikationer i båda språken.'),
    ('sv', 'https://github.com/Mouaz7/Concurrency-Systems', 'System för samtidighet', 'Lågnivåprogrammering i C som omfattar flertrådning, processynkronisering, IPC-mekanismer och algoritmer för minneshantering.'),
    ('sv', 'https://github.com/Mouaz7/Os_filesystem', 'Filsystem för operativsystem', 'En C++-implementering av ett FAT-baserat filsystem med ett kommandotolksgränssnitt.'),
    ('sv', 'https://github.com/Mouaz7/chess-game', 'Schackspel', 'Ett lättviktigt schackspel byggt med C++ och SFML 3.0, med dragförslag, materialpoäng, spelarnamn, timrar på tio minuter och automatiskt sparade resultat.'),
    ('sv', 'https://github.com/Mouaz7/Python-Linked-List', 'Länkad lista i Python', 'En Python-implementering av klassen TwoCell för dubbellänkade listor.'),
    ('sv', 'https://github.com/Mouaz7/Python-Table-Implementations', 'Tabellimplementeringar i Python', 'Implementeringar och prestandatester för tabeller i Python, inklusive TableAsArray, TableAsList och TableAsMTF.'),
    ('sv', 'https://github.com/Mouaz7/ARM-Interrupt-UART-Display', 'ARM-avbrott och UART-display', 'Ett assemblerprojekt för ARM Cortex-A9 som hanterar knappavbrott, läser UART-kommandon och uppdaterar en sjusegmentsdisplay.'),
    ('sv', 'https://github.com/Mouaz7/ARM-UART-Factorial', 'Fakultetsberäkning med ARM och UART', 'Ett kompakt ARM-assemblerprojekt som beräknar fakulteter rekursivt och skriver ut resultaten via UART.'),
    ('sv', 'https://github.com/Mouaz7/Practical-Communication', 'Praktisk nätverkskommunikation', 'Ett praktiskt projekt för nätverkskommunikation med TCP, UDP och en enkel webbläsare.'),
    ('sv', 'https://github.com/Mouaz7/network-udp-tcp-analysis', 'Analys av UDP och TCP', 'Analys och implementering av sändnings- och mottagningstester med UDP och TCP, inklusive prestandaobservationer och förbättringar.'),
    ('sv', 'https://github.com/Mouaz7/Python-directed-graph-bfs', 'Riktad graf och BFS i Python', 'Ett Python-program som kontrollerar konnektiviteten i riktade grafer med BFS.'),
    ('sv', 'https://github.com/Mouaz7/typing-speed-tracker', 'Mätning av skrivhastighet', 'Ett Python-program som mäter och följer skrivhastigheten med ordlistor på olika svårighetsnivåer.'),
    ('sv', 'https://github.com/Mouaz7/Cpp-TransportSystem', 'Transportsystem i C++', 'Ett C++-projekt för hantering av tidtabeller, skytteltrafik och passagerarbokningar.'),
    ('sv', 'https://github.com/Mouaz7/bsv-duplicate', 'BSV Duplicate', 'Ett kursprojekt som hittar dubbletter bland poster i BibTeX-filer.'),
    ('sv', 'https://github.com/Mouaz7/bsv-edutask', 'BSV Edutask', 'Ett utbildningsprojekt för kursen PA1417 där testtekniker för programvara tillämpas.'),
    ('sv', 'https://github.com/Mouaz7/quiz-game', 'Quizspel', 'Ett objektorienterat quizsystem i C++ för att skapa, hantera och spela quiz, med flera frågetyper, spelare, topplistor, filhantering och UML-dokumentation.')
)
insert into public.content_translation (
  entity_type,
  entity_id,
  locale,
  fields,
  updated_at
)
select
  'project',
  project.id::text,
  localized_project.locale,
  jsonb_build_object(
    'title', localized_project.title,
    'description', localized_project.description
  ),
  timezone('utc', now())
from localized_project
join public.project as project
  on lower(rtrim(project.github_url, '/')) = lower(localized_project.github_url)
on conflict (entity_type, entity_id, locale) do update
set fields = content_translation.fields || excluded.fields,
    updated_at = excluded.updated_at;

with category_copy(name, blurb) as (
  values
    ('frontend', 'Interfaces, frameworks, and modern browser experiences.'),
    ('mobile', 'Native and cross-platform apps for phones and tablets.'),
    ('backend', 'Server-side systems, runtimes, and core logic.'),
    ('storage', 'APIs, databases, and reliable data layers.'),
    ('devops', 'Containers, CI/CD pipelines, and reliable cloud deployments.'),
    ('ai', 'LLMs, prompt engineering, and intelligent data workflows.'),
    ('ides', 'Editors and design tools that support the development workflow.'),
    ('workflow', 'Testing, project tracking, and tools for efficient collaboration.'),
    ('webdata', 'Web fundamentals, servers, and database technologies.')
)
update public.skill_category as category
set blurb = category_copy.blurb,
    updated_at = timezone('utc', now())
from category_copy
where category.name = category_copy.name;

with localized_category(locale, name, title, blurb) as (
  values
    ('sv', 'frontend', 'Frontend', 'Gränssnitt och ramverk för moderna webbapplikationer.'),
    ('sv', 'mobile', 'Mobil', 'Nativa och plattformsoberoende appar för telefoner och surfplattor.'),
    ('sv', 'backend', 'Backend', 'Serversystem, exekveringsmiljöer och kärnlogik.'),
    ('sv', 'storage', 'API:er och lagring', 'API:er, databaser och tillförlitliga datalager.'),
    ('sv', 'devops', 'Moln och DevOps', 'Containrar, CI/CD-pipelines och tillförlitliga driftsättningar i molnet.'),
    ('sv', 'ai', 'AI/ML och data', 'LLM:er, promptdesign och intelligenta dataflöden.'),
    ('sv', 'ides', 'IDE:er och design', 'Kodredigerare och designverktyg som stödjer utvecklingsarbetet.'),
    ('sv', 'workflow', 'Verktyg och arbetsflöde', 'Testning, projekthantering och verktyg för effektivt samarbete.'),
    ('sv', 'webdata', 'Webb och data', 'Webbgrunder, servrar och databasteknik.'),
    ('ar', 'frontend', 'الواجهات الأمامية', 'واجهات وأطر عمل لتجارب ويب حديثة.'),
    ('ar', 'mobile', 'تطبيقات الجوال', 'تطبيقات أصلية ومتعددة المنصات للهواتف والأجهزة اللوحية.'),
    ('ar', 'backend', 'الخلفية والأنظمة', 'أنظمة الخوادم وبيئات التشغيل والمنطق الأساسي.'),
    ('ar', 'storage', 'واجهات API والتخزين', 'واجهات API وقواعد بيانات وطبقات بيانات موثوقة.'),
    ('ar', 'devops', 'السحابة وDevOps', 'حاويات ومسارات CI/CD وعمليات نشر موثوقة على السحابة.'),
    ('ar', 'ai', 'الذكاء الاصطناعي والبيانات', 'نماذج لغوية وهندسة الأوامر وتدفقات بيانات ذكية.'),
    ('ar', 'ides', 'بيئات التطوير والتصميم', 'محررات كود وأدوات تصميم تدعم سير عمل التطوير.'),
    ('ar', 'workflow', 'الأدوات وسير العمل', 'اختبارات وإدارة مشاريع وأدوات لتعاون فعّال.'),
    ('ar', 'webdata', 'الويب والبيانات', 'أساسيات الويب والخوادم وتقنيات قواعد البيانات.')
)
insert into public.content_translation (
  entity_type,
  entity_id,
  locale,
  fields,
  updated_at
)
select
  'skill_category',
  localized_category.name,
  localized_category.locale,
  jsonb_build_object(
    'title', localized_category.title,
    'blurb', localized_category.blurb
  ),
  timezone('utc', now())
from localized_category
join public.skill_category as category
  on category.name = localized_category.name
on conflict (entity_type, entity_id, locale) do update
set fields = content_translation.fields || excluded.fields,
    updated_at = excluded.updated_at;

with journey_copy(start_on, source_icon_alt, title, details) as (
  values
    (date '2023-08-28', 'Examen', 'B.Sc. Software Engineering – BTH', 'Bachelor’s degree in Software Engineering at BTH.'),
    (date '2025-01-13', 'Slack', 'Full-Stack Developer Intern (Pong Pal) – Softhouse', 'Built a real-time system using Slack and Firebase.'),
    (date '2025-09-01', 'Mentor', 'Student Mentor – BTH', 'Mentored and onboarded new students.'),
    (date '2025-09-01', 'C++', 'C++ Teaching Assistant (OOP) – BTH', 'Taught C++ and OOP during lab sessions.'),
    (date '2026-01-13', 'Bun', 'Full-Stack Developer Intern (TeamTemp) – Softhouse', 'Built a cross-platform survey app using Bun.'),
    (date '2026-08-01', 'Master', 'M.Sc. Software Engineering – BTH', 'Master’s degree in Software Engineering at BTH.')
)
update public.journey_item as journey
set title = journey_copy.title,
    details = journey_copy.details,
    updated_at = timezone('utc', now())
from journey_copy
where journey.start_date::date = journey_copy.start_on
  and coalesce(journey.icon_alt, '') = journey_copy.source_icon_alt;

with localized_journey(locale, start_on, source_icon_alt, title, details) as (
  values
    ('sv', date '2023-08-28', 'Examen', 'Kandidatexamen i programvaruteknik – BTH', 'Kandidatexamen i programvaruteknik vid BTH.'),
    ('sv', date '2025-01-13', 'Slack', 'Praktikant inom fullstackutveckling (Pong Pal) – Softhouse', 'Byggde ett realtidssystem med Slack och Firebase.'),
    ('sv', date '2025-09-01', 'Mentor', 'Studentmentor – BTH', 'Var mentor och introducerade nya studenter.'),
    ('sv', date '2025-09-01', 'C++', 'Amanuens i C++ och OOP – BTH', 'Undervisade i C++ och objektorienterad programmering under laborationer.'),
    ('sv', date '2026-01-13', 'Bun', 'Praktikant inom fullstackutveckling (TeamTemp) – Softhouse', 'Byggde en plattformsoberoende enkätapp med Bun.'),
    ('sv', date '2026-08-01', 'Master', 'Masterexamen i programvaruteknik – BTH', 'Masterexamen i programvaruteknik vid BTH.'),
    ('ar', date '2023-08-28', 'Examen', 'بكالوريوس هندسة البرمجيات – BTH', 'درجة البكالوريوس في هندسة البرمجيات من BTH.'),
    ('ar', date '2025-01-13', 'Slack', 'متدرب في التطوير المتكامل (Pong Pal) – Softhouse', 'أنشأت نظامًا يعمل في الوقت الفعلي باستخدام Slack وFirebase.'),
    ('ar', date '2025-09-01', 'Mentor', 'مرشد طلابي – BTH', 'أرشدت الطلاب الجدد وساعدتهم في بداية دراستهم.'),
    ('ar', date '2025-09-01', 'C++', 'مساعد تدريس C++ والبرمجة كائنية التوجّه – BTH', 'درّست C++ والبرمجة كائنية التوجّه خلال الجلسات العملية.'),
    ('ar', date '2026-01-13', 'Bun', 'متدرب في التطوير المتكامل (TeamTemp) – Softhouse', 'أنشأت تطبيق استطلاعات متعدد المنصات باستخدام Bun.'),
    ('ar', date '2026-08-01', 'Master', 'ماجستير هندسة البرمجيات – BTH', 'درجة الماجستير في هندسة البرمجيات من BTH.')
)
insert into public.content_translation (
  entity_type,
  entity_id,
  locale,
  fields,
  updated_at
)
select
  'journey_item',
  journey.id::text,
  localized_journey.locale,
  jsonb_build_object(
    'title', localized_journey.title,
    'details', localized_journey.details
  ),
  timezone('utc', now())
from localized_journey
join public.journey_item as journey
  on journey.start_date::date = localized_journey.start_on
 and coalesce(journey.icon_alt, '') = localized_journey.source_icon_alt
on conflict (entity_type, entity_id, locale) do update
set fields = content_translation.fields || excluded.fields,
    updated_at = excluded.updated_at;

commit;
