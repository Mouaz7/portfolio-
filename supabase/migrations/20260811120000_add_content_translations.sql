-- Localized, editable content. UI chrome remains in versioned dictionaries so
-- rendering never depends on a database round-trip. This table is only for
-- content editors: profile text, capabilities, categories, projects and Journey.
create table if not exists public.content_translation (
  entity_type text not null,
  entity_id text not null,
  locale text not null check (locale in ('sv', 'ar')),
  fields jsonb not null default '{}'::jsonb check (jsonb_typeof(fields) = 'object'),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (entity_type, entity_id, locale),
  constraint content_translation_entity_type_check check (
    entity_type in (
      'site_profile',
      'home_role',
      'home_capability',
      'skill_category',
      'project',
      'journey_item'
    )
  )
);

create index if not exists content_translation_locale_entity_idx
  on public.content_translation (locale, entity_type);

alter table public.content_translation enable row level security;
revoke all on public.content_translation from public, anon, authenticated;
drop policy if exists content_translation_public_read on public.content_translation;
create policy content_translation_public_read
  on public.content_translation
  for select
  to anon
  using (true);
grant select on public.content_translation to anon;

insert into public.content_translation (entity_type, entity_id, locale, fields)
values
  ('site_profile', '00000000-0000-0000-0000-000000000001', 'sv', '{"intro_prefix":"Jag är ","display_name":"Mouaz","role_prefix":""}'),
  ('site_profile', '00000000-0000-0000-0000-000000000001', 'ar', '{"intro_prefix":"أنا ","display_name":"معاذ","role_prefix":""}'),
  ('home_capability', 'backend', 'sv', '{"title":"Backendsystem","description":"API:er, databaser och skalbar arkitektur"}'),
  ('home_capability', 'ai', 'sv', '{"title":"AI-integrationer","description":"LLM:er, automation och intelligenta arbetsflöden"}'),
  ('home_capability', 'secure-web', 'sv', '{"title":"Säker webb","description":"Autentisering, validering och tillförlitliga system"}'),
  ('home_capability', 'cloud-devops', 'sv', '{"title":"Moln och DevOps","description":"CI/CD, containrar och stabila driftsättningar"}'),
  ('home_capability', 'quality', 'sv', '{"title":"Kvalitetsteknik","description":"Testning, observerbarhet och systemtillförlitlighet"}'),
  ('home_capability', 'backend', 'ar', '{"title":"أنظمة الخلفية","description":"واجهات API وقواعد بيانات وبنية قابلة للتوسع"}'),
  ('home_capability', 'ai', 'ar', '{"title":"تكامل الذكاء الاصطناعي","description":"نماذج لغوية وأتمتة وتدفقات عمل ذكية"}'),
  ('home_capability', 'secure-web', 'ar', '{"title":"ويب آمن","description":"مصادقة وتحقق وأنظمة موثوقة"}'),
  ('home_capability', 'cloud-devops', 'ar', '{"title":"السحابة وDevOps","description":"CI/CD وحاويات ونشر موثوق"}'),
  ('home_capability', 'quality', 'ar', '{"title":"هندسة الجودة","description":"اختبارات ومراقبة وموثوقية الأنظمة"}')
on conflict (entity_type, entity_id, locale) do update
set fields = excluded.fields, updated_at = timezone('utc', now());

insert into public.content_translation (entity_type, entity_id, locale, fields)
select
  'home_role',
  id::text,
  locale,
  jsonb_build_object(
    'label',
    case locale
      when 'sv' then case sort_order
        when 10 then 'Mjukvaruingenjör'
        when 20 then 'Designer'
        when 30 then 'Utvecklare'
        when 40 then 'AI-utvecklare'
        when 50 then 'Webbutvecklare'
        when 60 then 'Cybersäkerhetsingenjör'
        else 'Mjukvaruingenjör'
      end
      when 'ar' then case sort_order
        when 10 then 'مهندس برمجيات'
        when 20 then 'مصمم'
        when 30 then 'مطوّر'
        when 40 then 'مطوّر ذكاء اصطناعي'
        when 50 then 'مطوّر ويب'
        when 60 then 'مهندس أمن سيبراني'
        else 'مهندس برمجيات'
      end
    end
  )
from public.home_role
cross join (values ('sv'), ('ar')) as requested_locale(locale)
on conflict (entity_type, entity_id, locale) do update
set fields = excluded.fields, updated_at = timezone('utc', now());

insert into public.content_translation (entity_type, entity_id, locale, fields)
values
  ('skill_category', 'frontend', 'sv', '{"title":"Frontend och mobil","blurb":"Gränssnitt, ramverk och appupplevelser för webbläsare och mobil."}'),
  ('skill_category', 'mobile', 'sv', '{"title":"Mobil","blurb":"Inbyggda och plattformsoberoende appar för telefoner och surfplattor."}'),
  ('skill_category', 'backend', 'sv', '{"title":"Backend och system","blurb":"Tjänster, systemlogik och koden som driver allt bakom kulisserna."}'),
  ('skill_category', 'storage', 'sv', '{"title":"API:er och lagring","blurb":"API:er, databaser och datalagret som gör appar tillförlitliga."}'),
  ('skill_category', 'devops', 'sv', '{"title":"Moln, DevOps och testning","blurb":"Driftsättning, automation, testning och lugna releaseflöden."}'),
  ('skill_category', 'ai', 'sv', '{"title":"AI/ML och data","blurb":"LLM:er, promptar, intelligenta arbetsflöden och datadrivna funktioner."}'),
  ('skill_category', 'ides', 'sv', '{"title":"IDE:er och design","blurb":"Redigerare och designverktyg som formar utvecklingsloopen."}'),
  ('skill_category', 'workflow', 'sv', '{"title":"Verktyg och arbetsflöde","blurb":"Testning, uppföljning och verktygen för lugnt samarbete."}'),
  ('skill_category', 'webdata', 'sv', '{"title":"Webb och data","blurb":"Webbgrunder, servrar och databasverktyg."}'),
  ('skill_category', 'frontend', 'ar', '{"title":"الواجهات وتطبيقات الجوال","blurb":"واجهات وأطر وتجارب تطبيقات للويب والجوال."}'),
  ('skill_category', 'mobile', 'ar', '{"title":"تطبيقات الجوال","blurb":"تطبيقات أصلية ومتعددة المنصات للهواتف والأجهزة اللوحية."}'),
  ('skill_category', 'backend', 'ar', '{"title":"الخلفية والأنظمة","blurb":"خدمات ومنطق أنظمة والكود الذي يشغّل كل شيء خلف الكواليس."}'),
  ('skill_category', 'storage', 'ar', '{"title":"واجهات API والتخزين","blurb":"واجهات API وقواعد بيانات وطبقة بيانات تجعل التطبيقات موثوقة."}'),
  ('skill_category', 'devops', 'ar', '{"title":"السحابة وDevOps والاختبارات","blurb":"نشر وأتمتة واختبارات وتدفقات إصدار مستقرة."}'),
  ('skill_category', 'ai', 'ar', '{"title":"الذكاء الاصطناعي والبيانات","blurb":"نماذج لغوية وهندسة أوامر وتدفقات ذكية وميزات معتمدة على البيانات."}'),
  ('skill_category', 'ides', 'ar', '{"title":"بيئات التطوير والتصميم","blurb":"محررات وأدوات تصميم تدعم دورة التطوير."}'),
  ('skill_category', 'workflow', 'ar', '{"title":"الأدوات وسير العمل","blurb":"اختبارات وتتبع وأدوات لتعاون منظّم."}'),
  ('skill_category', 'webdata', 'ar', '{"title":"الويب والبيانات","blurb":"أساسيات الويب والخوادم وأدوات قواعد البيانات."}')
on conflict (entity_type, entity_id, locale) do update
set fields = excluded.fields, updated_at = timezone('utc', now());

-- Existing public projects. New projects can add the same two rows through the
-- Supabase editor without changing application code.
insert into public.content_translation (entity_type, entity_id, locale, fields)
values
  ('project', '72ead79d-3b39-4e44-b7fe-778e57ac0586', 'sv', '{"title":"Utvecklarportfolio","description":"Den här portfolion är byggd med Next.js, TypeScript, temabaserad UI-design och ett Supabase-drivet projektflöde."}'),
  ('project', 'c1b00cf2-d54e-4d36-a5d0-0ee7651290d8', 'sv', '{"title":"Team Temp App Showcase","description":"Visuell dokumentation och videomaterial för Team Temp App – en AI-driven plattform för medarbetarundersökningar utvecklad för Softhouse."}'),
  ('project', 'a96da9bb-713f-4b29-9384-a84150f05431', 'sv', '{"title":"Move-Out: flyttkartongsystem","description":"Professionellt system för hantering av flyttkartonger, byggt med Node.js, Express, EJS, SQLite under utveckling och PostgreSQL/Supabase i produktion med starka säkerhetsskydd."}'),
  ('project', 'd65bbe3a-bd72-4f33-86e1-8bf6e05be39e', 'sv', '{"title":"PongPal Showcase","description":"Visuell presentation av PongPal-projektet som utvecklades på Softhouse, med bilder och videor av bokning, statistik och användarprofiler."}'),
  ('project', '823c8c13-5240-4dc7-baf3-c29989454035', 'sv', '{"title":"Hanteringssystem för e-handel","description":"Fullstackssystem för e-handel med Node.js, Express, EJS och MariaDB, inklusive produkt-, kategori-, order- och lagerhantering samt administratörsgränssnitt."}'),
  ('project', 'cb5a0ef2-c3ea-4f19-a213-ac8b5d42a736', 'sv', '{"title":"Burgerprojekt","description":"Fullstackapp för hamburgerbeställningar med Node.js, MySQL och EJS, inklusive orderanpassning, köksvy och databasintegration."}'),
  ('project', 'b1f8e630-fee9-45a2-8246-7832a1e3853d', 'sv', '{"title":"Självläkande DevOps-plattform","description":"AI-baserad självläkande CI/CD-pipeline med sex specialiserade agenter, MCP-mikrotjänster, säkerhetssystem med trafikljus och Prometheus-mätvärden. Kandidatarbete vid BTH."}'),
  ('project', 'e894f170-db1d-42ab-9998-947dedaa538f', 'sv', '{"title":"Campus360","description":"Androidapp för campusnavigering med hybrida inom- och utomhuskartor, ruttplanering och Firebase-autentisering, byggd med Kotlin, Clean Architecture och MVVM."}'),
  ('project', '0b57195f-ef67-4e81-a595-0d6937a0fb10', 'sv', '{"title":"Buffrad I/O i assembler","description":"I/O-bibliotek i assembler och C med testprogram för text och heltal, en testapp i x86-64-assembler och en motsvarande C-version."}'),
  ('project', '882c9596-d229-4932-9773-11465952154a', 'sv', '{"title":"System för samtidighet","description":"Lågnivåprogrammering i C med flertrådning, processynkronisering, IPC-mekanismer och algoritmer för minneshantering."}'),
  ('project', 'c179d094-9e84-4085-8ba7-767c47f3cced', 'sv', '{"title":"Filsystem för operativsystem","description":"C++-implementation av ett FAT-baserat filsystem med skalgränssnitt."}'),
  ('project', 'b53ca88b-acfb-432f-8b3e-1bd79671b283', 'sv', '{"title":"Schackspel","description":"Lättviktigt schackspel i C++ och SFML 3.0 med dragförslag, materialpoäng, spelarnamn, tiominuterstimer och automatiskt sparade resultat."}'),
  ('project', '05f461c1-779a-401f-9022-91431dc2e934', 'sv', '{"title":"Länkad lista i Python","description":"Pythonimplementation av klassen TwoCell för dubbellänkade listor."}'),
  ('project', '81c43e79-d602-4409-95e1-611b6ce51623', 'sv', '{"title":"Tabellimplementationer i Python","description":"Implementationer och prestandatester av tabell-ADT i Python, inklusive TableAsArray, TableAsList och TableAsMTF."}'),
  ('project', '932fbf16-02cd-4d0e-b18c-d606080e6355', 'sv', '{"title":"ARM-avbrott och UART-display","description":"Assemblerprojekt för ARM Cortex-A9 som hanterar knappavbrott, läser UART-kommandon och uppdaterar en sjusegmentsdisplay."}'),
  ('project', '4f014ae3-b9a0-4494-ab5c-4d466582d771', 'sv', '{"title":"ARM UART-fakultet","description":"Enkelt ARM-assemblerprojekt som beräknar fakultet rekursivt och skriver ut resultat via UART."}'),
  ('project', '337c4cb7-c8df-4603-8d60-a900d47e9282', 'sv', '{"title":"Praktisk nätverkskommunikation","description":"Praktiskt projekt för nätverkskommunikation med TCP, UDP och en enkel webbläsare."}'),
  ('project', '13ef9627-43fe-4e46-bb97-3c1f382f2027', 'sv', '{"title":"Analys av UDP och TCP","description":"Analys och implementation av sändnings- och mottagningstester med UDP och TCP, inklusive prestandaobservationer och förbättringar."}'),
  ('project', '9394a032-aba3-48bd-b578-6c9431fe84c3', 'sv', '{"title":"Riktad graf och BFS i Python","description":"Pythonprogram som kontrollerar konnektivitet i riktade grafer med BFS."}'),
  ('project', '4a3a0688-efdc-4ccd-8359-f6b5bc09dba9', 'sv', '{"title":"Mätning av skrivhastighet","description":"Pythonprogram som mäter och följer skrivhastighet med ordlistor på olika svårighetsnivåer."}'),
  ('project', '47856dc5-33fd-4e7b-9a8c-309ab8dbb735', 'sv', '{"title":"Transportsystem i C++","description":"C++-projekt för hantering av tidtabeller, skytteltrafik och passagerarbokningar."}'),
  ('project', 'dbfb157f-6ff0-4000-8b96-f589c6c419a3', 'sv', '{"title":"BSV Duplicate","description":"Ett enkelt övningssystem som hittar dubbletter bland BibTeX-poster."}'),
  ('project', '500c8c0a-816e-4388-9e30-67bd855b217c', 'sv', '{"title":"BSV Edutask","description":"Övningsprojekt för kursen PA1417 med tillämpning av testtekniker."}'),
  ('project', '5d8f3352-bf8a-45d7-9544-0fc4a443c665', 'sv', '{"title":"Quizspel","description":"Objektorienterat quizsystem i C++ för att skapa, hantera och spela quiz, med frågetyper, spelare, topplistor och filhantering."}'),
  ('project', '72ead79d-3b39-4e44-b7fe-778e57ac0586', 'ar', '{"title":"ملف المطوّر","description":"هذا الملف مبني باستخدام Next.js وTypeScript وواجهة متعددة السمات وتغذية مشاريع مدعومة من Supabase."}'),
  ('project', 'c1b00cf2-d54e-4d36-a5d0-0ee7651290d8', 'ar', '{"title":"عرض تطبيق Team Temp","description":"توثيق مرئي وفيديو لتطبيق Team Temp، وهو منصة استطلاعات موظفين مدعومة بالذكاء الاصطناعي طُوّرت لصالح Softhouse."}'),
  ('project', 'a96da9bb-713f-4b29-9384-a84150f05431', 'ar', '{"title":"Move-Out: نظام صناديق النقل","description":"نظام احترافي لإدارة صناديق النقل مبني باستخدام Node.js وExpress وEJS وSQLite أثناء التطوير وPostgreSQL/Supabase في الإنتاج مع حماية أمنية قوية."}'),
  ('project', 'd65bbe3a-bd72-4f33-86e1-8bf6e05be39e', 'ar', '{"title":"عرض PongPal","description":"عرض مرئي لمشروع PongPal الذي طُوّر في Softhouse، ويتضمن صوراً وفيديوهات للحجز والإحصاءات وملفات المستخدمين."}'),
  ('project', '823c8c13-5240-4dc7-baf3-c29989454035', 'ar', '{"title":"نظام إدارة متجر إلكتروني","description":"نظام متكامل لإدارة التجارة الإلكترونية باستخدام Node.js وExpress وEJS وMariaDB، مع إدارة المنتجات والفئات والطلبات والمخزون وواجهة إدارية."}'),
  ('project', 'cb5a0ef2-c3ea-4f19-a213-ac8b5d42a736', 'ar', '{"title":"مشروع البرغر","description":"تطبيق متكامل لطلبات البرغر باستخدام Node.js وMySQL وEJS، مع تخصيص الطلبات وعرض المطبخ وتكامل قاعدة البيانات."}'),
  ('project', 'b1f8e630-fee9-45a2-8246-7832a1e3853d', 'ar', '{"title":"منصة DevOps ذاتية الإصلاح","description":"خط CI/CD ذاتي الإصلاح بالذكاء الاصطناعي يضم ستة وكلاء متخصصين وخدمات MCP مصغّرة ونظام أمان بإشارات المرور ومقاييس Prometheus. مشروع بكالوريوس في BTH."}'),
  ('project', 'e894f170-db1d-42ab-9998-947dedaa538f', 'ar', '{"title":"Campus360","description":"تطبيق Android للملاحة داخل الحرم بخرائط داخلية وخارجية وتحديد المسارات ومصادقة Firebase، مبني باستخدام Kotlin وClean Architecture وMVVM."}'),
  ('project', '0b57195f-ef67-4e81-a595-0d6937a0fb10', 'ar', '{"title":"إدخال وإخراج مخزّن بالاسمبلي","description":"مكتبة إدخال وإخراج بالاسمبلي وC مع برامج اختبار للنصوص والأعداد وتطبيق اختبار x86-64 ونسخة C مقابلة."}'),
  ('project', '882c9596-d229-4932-9773-11465952154a', 'ar', '{"title":"أنظمة التزامن","description":"برمجة أنظمة منخفضة المستوى بلغة C تشمل تعدد الخيوط ومزامنة العمليات وآليات IPC وخوارزميات إدارة الذاكرة."}'),
  ('project', 'c179d094-9e84-4085-8ba7-767c47f3cced', 'ar', '{"title":"نظام ملفات لنظام تشغيل","description":"تنفيذ C++ لنظام ملفات قائم على FAT مع واجهة أوامر."}'),
  ('project', 'b53ca88b-acfb-432f-8b3e-1bd79671b283', 'ar', '{"title":"لعبة شطرنج","description":"لعبة شطرنج خفيفة باستخدام C++ وSFML 3.0 مع اقتراحات للحركات ونقاط القطع وأسماء اللاعبين ومؤقتات ونتائج محفوظة تلقائياً."}'),
  ('project', '05f461c1-779a-401f-9022-91431dc2e934', 'ar', '{"title":"قائمة مترابطة ببايثون","description":"تنفيذ صنف TwoCell في Python للقوائم المترابطة المزدوجة."}'),
  ('project', '81c43e79-d602-4409-95e1-611b6ce51623', 'ar', '{"title":"تنفيذات الجداول ببايثون","description":"تنفيذات واختبارات أداء لنوع بيانات الجدول في Python، تشمل TableAsArray وTableAsList وTableAsMTF."}'),
  ('project', '932fbf16-02cd-4d0e-b18c-d606080e6355', 'ar', '{"title":"مقاطعات ARM وشاشة UART","description":"مشروع اسمبلي لمعالج ARM Cortex-A9 يتعامل مع مقاطعات الأزرار ويقرأ أوامر UART ويحدّث شاشة سباعية المقاطع."}'),
  ('project', '4f014ae3-b9a0-4494-ab5c-4d466582d771', 'ar', '{"title":"حساب المضروب عبر ARM UART","description":"مشروع اسمبلي ARM بسيط لحساب المضروب بالاستدعاء الذاتي وطباعة النتائج عبر UART."}'),
  ('project', '337c4cb7-c8df-4603-8d60-a900d47e9282', 'ar', '{"title":"اتصالات شبكية عملية","description":"مشروع عملي للاتصال الشبكي باستخدام TCP وUDP ومتصفح بسيط."}'),
  ('project', '13ef9627-43fe-4e46-bb97-3c1f382f2027', 'ar', '{"title":"تحليل UDP وTCP","description":"تحليل وتنفيذ اختبارات الإرسال والاستقبال عبر UDP وTCP مع ملاحظات أداء وتحسينات."}'),
  ('project', '9394a032-aba3-48bd-b578-6c9431fe84c3', 'ar', '{"title":"رسم بياني موجّه وBFS ببايثون","description":"برنامج Python لفحص اتصال الرسوم البيانية الموجّهة باستخدام BFS."}'),
  ('project', '4a3a0688-efdc-4ccd-8359-f6b5bc09dba9', 'ar', '{"title":"متتبع سرعة الكتابة","description":"برنامج Python يقيس سرعة الكتابة ويتابعها باستخدام قوائم كلمات بدرجات صعوبة مختلفة."}'),
  ('project', '47856dc5-33fd-4e7b-9a8c-309ab8dbb735', 'ar', '{"title":"نظام نقل بلغة C++","description":"مشروع C++ لإدارة جداول النقل والحافلات والحجوزات."}'),
  ('project', 'dbfb157f-6ff0-4000-8b96-f589c6c419a3', 'ar', '{"title":"BSV Duplicate","description":"نظام تدريبي بسيط لاكتشاف المراجع المكررة في ملفات BibTeX."}'),
  ('project', '500c8c0a-816e-4388-9e30-67bd855b217c', 'ar', '{"title":"BSV Edutask","description":"مشروع تدريبي لمقرر PA1417 لتطبيق تقنيات الاختبار."}'),
  ('project', '5d8f3352-bf8a-45d7-9544-0fc4a443c665', 'ar', '{"title":"لعبة أسئلة","description":"نظام أسئلة كائني التوجه بلغة C++ لإنشاء الاختبارات وإدارتها وتشغيلها، مع أنواع أسئلة ولاعبين ولوحات صدارة وإدارة ملفات."}')
on conflict (entity_type, entity_id, locale) do update
set fields = excluded.fields, updated_at = timezone('utc', now());

insert into public.content_translation (entity_type, entity_id, locale, fields)
values
  ('journey_item', '907d3374-d946-473e-b729-2b44a1bde9e2', 'sv', '{"title":"Kandidatexamen i programvaruteknik – BTH","details":"Kandidatexamen i programvaruteknik vid BTH.","icon_alt":"Examen"}'),
  ('journey_item', 'bb3fae1f-1883-4d7f-958b-33d063d42913', 'sv', '{"title":"Fullstackpraktikant (Pong Pal) – Softhouse","details":"Byggde ett realtidssystem med Slack och Firebase.","icon_alt":"Slack"}'),
  ('journey_item', '9966107f-5951-466f-a208-1abd3c92d3ba', 'sv', '{"title":"Studentmentor – BTH","details":"Mentorskap och introduktion för nya studenter.","icon_alt":"Mentor"}'),
  ('journey_item', 'e4bfe45d-a25b-4d7b-af75-bbe65e700cee', 'sv', '{"title":"Amanuens i C++ och OOP – BTH","details":"Undervisade i C++ och objektorienterad programmering under laborationer.","icon_alt":"C++"}'),
  ('journey_item', '4898ced1-e1ef-4ed2-ac39-1c29d4921cd5', 'sv', '{"title":"Fullstackpraktikant (TeamTemp) – Softhouse","details":"Byggde en plattformsoberoende undersökningsapp med Bun.","icon_alt":"Bun"}'),
  ('journey_item', 'c28c5768-6a19-4ee4-acd2-1607cb9d8005', 'sv', '{"title":"Masterexamen i programvaruteknik – BTH","details":"Masterexamen i programvaruteknik vid BTH.","icon_alt":"Master"}'),
  ('journey_item', '907d3374-d946-473e-b729-2b44a1bde9e2', 'ar', '{"title":"بكالوريوس هندسة البرمجيات – BTH","details":"درجة البكالوريوس في هندسة البرمجيات من BTH.","icon_alt":"تخرّج"}'),
  ('journey_item', 'bb3fae1f-1883-4d7f-958b-33d063d42913', 'ar', '{"title":"متدرب تطوير متكامل (Pong Pal) – Softhouse","details":"بنيت نظاماً فورياً باستخدام Slack وFirebase.","icon_alt":"Slack"}'),
  ('journey_item', '9966107f-5951-466f-a208-1abd3c92d3ba', 'ar', '{"title":"مرشد طلابي – BTH","details":"أرشدت الطلاب الجدد وساعدتهم في بداية دراستهم.","icon_alt":"إرشاد"}'),
  ('journey_item', 'e4bfe45d-a25b-4d7b-af75-bbe65e700cee', 'ar', '{"title":"مساعد تدريس C++ والبرمجة الكائنية – BTH","details":"درّست C++ والبرمجة كائنية التوجه في الجلسات العملية.","icon_alt":"C++"}'),
  ('journey_item', '4898ced1-e1ef-4ed2-ac39-1c29d4921cd5', 'ar', '{"title":"متدرب تطوير متكامل (TeamTemp) – Softhouse","details":"بنيت تطبيق استطلاعات متعدد المنصات باستخدام Bun.","icon_alt":"Bun"}'),
  ('journey_item', 'c28c5768-6a19-4ee4-acd2-1607cb9d8005', 'ar', '{"title":"ماجستير هندسة البرمجيات – BTH","details":"درجة الماجستير في هندسة البرمجيات من BTH.","icon_alt":"ماجستير"}')
on conflict (entity_type, entity_id, locale) do update
set fields = excluded.fields, updated_at = timezone('utc', now());

comment on table public.content_translation is
  'Localized editable fields keyed by source entity. English remains in source tables; sv/ar override selected fields.';
