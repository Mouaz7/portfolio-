-- Deterministic public content for local development and browser tests.
-- Production content remains managed through Supabase Studio.
insert into public.skill_category (name, title, blurb, sort_order, is_active)
values
  ('frontend', 'Frontend', 'Interfaces, frameworks, and modern browser experiences.', 10, true),
  ('mobile', 'Mobile', 'Native and cross-platform apps for phones and tablets.', 20, true),
  ('backend', 'Backend', 'Server-side systems, runtimes, and core logic.', 30, true),
  ('storage', 'APIs & Storage', 'APIs, databases, and reliable data layers.', 40, true),
  ('devops', 'Cloud & DevOps', 'Containers, CI/CD pipelines, and reliable cloud deployments.', 50, true),
  ('ai', 'AI/ML & Data', 'LLMs, prompt engineering, and intelligent data workflows.', 60, true),
  ('ides', 'IDEs & Design', 'Editors and design tools that support the development workflow.', 70, true),
  ('workflow', 'Tools & Workflow', 'Testing, project tracking, and tools for efficient collaboration.', 80, true),
  ('webdata', 'Web & Data', 'Web fundamentals, servers, and database technologies.', 90, true)
on conflict (name) do update
set title = excluded.title,
    blurb = excluded.blurb,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

insert into public.skill (
  name,
  category,
  icon_bucket,
  icon_path,
  icon_path_light,
  icon_alt,
  mono,
  sort_order,
  is_active
)
values
  ('TypeScript', 'frontend', '', '/skill-icons/frontend-typescript.svg', null, 'TypeScript', false, 1, true),
  ('JavaScript', 'frontend', '', '/skill-icons/frontend-javascript.svg', null, 'JavaScript', false, 2, true),
  ('React', 'frontend', '', '/skill-icons/frontend-react.svg', '/skill-icons/frontend-react-light.svg', 'React', false, 3, true),
  ('Next.js', 'frontend', '', '/skill-icons/frontend-next-js.svg', null, 'Next.js', true, 4, true),
  ('Vue 3', 'frontend', '', '/skill-icons/frontend-vue-3.svg', null, 'Vue 3', false, 5, true),
  ('Tailwind CSS', 'frontend', '', '/skill-icons/frontend-tailwind-css.svg', null, 'Tailwind CSS', false, 6, true),
  ('Kotlin', 'mobile', '', '/skill-icons/mobile-kotlin.svg', null, 'Kotlin', false, 1, true),
  ('Swift', 'mobile', '', '/skill-icons/mobile-swift.svg', null, 'Swift', false, 2, true),
  ('Flutter', 'mobile', '', '/skill-icons/mobile-flutter.svg', null, 'Flutter', false, 3, true),
  ('Dart', 'mobile', '', '/skill-icons/mobile-dart.svg', null, 'Dart', false, 4, true),
  ('Android', 'mobile', '', '/skill-icons/mobile-android.svg', null, 'Android', false, 5, true),
  ('Firebase', 'mobile', '', '/skill-icons/mobile-firebase.svg', null, 'Firebase', false, 6, true),
  ('Python', 'backend', '', '/skill-icons/backend-python.svg', null, 'Python', false, 1, true),
  ('Java', 'backend', '', '/skill-icons/backend-java.svg', null, 'Java', false, 2, true),
  ('C++', 'backend', '', '/skill-icons/backend-c-plus-plus.svg', null, 'C++', false, 3, true),
  ('C', 'backend', '', '/skill-icons/backend-c.svg', null, 'C', false, 4, true),
  ('Bun', 'backend', '', '/skill-icons/backend-bun.svg', null, 'Bun', false, 5, true),
  ('x86 Asm', 'backend', '', '/skill-icons/backend-x86-asm.svg', null, 'x86 Assembly', true, 6, true),
  ('Node.js', 'storage', '', '/skill-icons/storage-node-js.svg', null, 'Node.js', false, 1, true),
  ('GraphQL', 'storage', '', '/skill-icons/storage-graphql.svg', null, 'GraphQL', false, 2, true),
  ('PostgreSQL', 'storage', '', '/skill-icons/storage-postgresql.svg', null, 'PostgreSQL', false, 3, true),
  ('MySQL', 'storage', '', '/skill-icons/storage-mysql.svg', null, 'MySQL', false, 4, true),
  ('MariaDB', 'storage', '', '/skill-icons/storage-mariadb.svg', null, 'MariaDB', true, 5, true),
  ('SQL', 'storage', '', '/skill-icons/storage-sql.svg', null, 'Azure SQL Database', false, 6, true),
  ('Docker', 'devops', '', '/skill-icons/devops-docker.svg', null, 'Docker', false, 1, true),
  ('Git', 'devops', '', '/skill-icons/devops-git.svg', null, 'Git', false, 2, true),
  ('GitHub', 'devops', '', '/skill-icons/devops-github.svg', null, 'GitHub', true, 3, true),
  ('CI/CD', 'devops', '', '/skill-icons/devops-ci-cd.svg', null, 'CI/CD', false, 4, true),
  ('Linux', 'devops', '', '/skill-icons/devops-linux.svg', null, 'Linux', false, 5, true),
  ('Pytest', 'devops', '', '/skill-icons/devops-pytest.svg', null, 'Pytest', false, 6, true),
  ('LLM Integration', 'ai', '', '/skill-icons/ai-llm-integration.svg', null, 'LLM Integration', true, 1, true),
  ('Function Calling', 'ai', '', '/skill-icons/ai-function-calling.svg', null, 'Function Calling', true, 2, true),
  ('Prompt Design', 'ai', '', '/skill-icons/ai-prompt-design.svg', null, 'Prompt Design', true, 3, true),
  ('VS Code', 'ides', '', '/skill-icons/ides-vs-code.svg', null, 'VS Code', false, 1, true),
  ('Visual Studio', 'ides', '', '/skill-icons/ides-visual-studio.svg', null, 'Visual Studio', false, 2, true),
  ('Figma', 'ides', '', '/skill-icons/ides-figma.svg', null, 'Figma', false, 3, true),
  ('Bitbucket', 'ides', '', '/skill-icons/ides-bitbucket.svg', null, 'Bitbucket', false, 4, true),
  ('Premiere Pro', 'ides', '', '/skill-icons/ides-premiere-pro.svg', null, 'Adobe Premiere Pro', false, 5, true),
  ('Jira', 'workflow', '', '/skill-icons/workflow-jira.svg', null, 'Jira', false, 1, true),
  ('Trello', 'workflow', '', '/skill-icons/workflow-trello.svg', null, 'Trello', false, 2, true),
  ('Cypress', 'workflow', '', '/skill-icons/workflow-cypress.svg', '/skill-icons/workflow-cypress-light.svg', 'Cypress', false, 3, true),
  ('Jenkins', 'workflow', '', '/skill-icons/workflow-jenkins.svg', null, 'Jenkins', false, 4, true),
  ('Vercel', 'workflow', '', '/skill-icons/workflow-vercel.svg', null, 'Vercel', true, 5, true),
  ('Bash', 'workflow', '', '/skill-icons/workflow-bash.svg', null, 'Bash', true, 6, true),
  ('HTML5', 'webdata', '', '/skill-icons/webdata-html5.svg', null, 'HTML5', false, 1, true),
  ('CSS3', 'webdata', '', '/skill-icons/webdata-css3.svg', null, 'CSS3', false, 2, true),
  ('PHP', 'webdata', '', '/skill-icons/webdata-php.svg', null, 'PHP', false, 3, true),
  ('Flask', 'webdata', '', '/skill-icons/webdata-flask.svg', null, 'Flask', true, 4, true),
  ('Express', 'webdata', '', '/skill-icons/webdata-express.svg', null, 'Express', true, 5, true),
  ('MongoDB', 'webdata', '', '/skill-icons/webdata-mongodb.svg', null, 'MongoDB', false, 6, true)
on conflict (category, name) do update
set icon_bucket = excluded.icon_bucket,
    icon_path = excluded.icon_path,
    icon_path_light = excluded.icon_path_light,
    icon_alt = excluded.icon_alt,
    mono = excluded.mono,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

insert into public.project (
  id,
  title,
  description,
  category,
  github_url,
  languages,
  cover_image_href,
  visibility,
  sort_order,
  is_active,
  created_at
)
values
  ('72ead79d-3b39-4e44-b7fe-778e57ac0586', 'Developer Portfolio', 'A multilingual developer portfolio built with Next.js, TypeScript, Tailwind CSS, and Supabase.', 'Full-Stack', 'https://github.com/Mouaz7/portfolio-', array['Next.js', 'TypeScript', 'Tailwind', 'Supabase'], '/project-icons/nextjs.svg', 'public', 0, true, '2026-06-22T06:33:28.130044+00:00'),
  ('c1b00cf2-d54e-4d36-a5d0-0ee7651290d8', 'Team Temp App Showcase', 'Visual and video documentation for Team Temp App, an AI-driven employee survey platform developed for Softhouse.', 'Full-Stack', 'https://github.com/Mouaz7/team-temp-app', array['React', 'React Native', 'TypeScript', 'AI', 'Express'], '/project-icons/react.svg', 'public', 1, true, '2026-06-22T06:33:28.130044+00:00'),
  ('a96da9bb-713f-4b29-9384-a84150f05431', 'Move-Out: Moving Box System', 'A professional moving box management system built with Node.js, Express, and EJS, using SQLite for development and PostgreSQL/Supabase in production with robust security controls.', 'Full-Stack', 'https://github.com/Mouaz7/Move-Out', array['Node.js', 'Express', 'PostgreSQL', 'Supabase', 'Security'], '/project-icons/nodejs-badge.svg', 'public', 2, true, '2026-06-08T20:04:14.100811+00:00'),
  ('d65bbe3a-bd72-4f33-86e1-8bf6e05be39e', 'PongPal Showcase', 'A visual showcase of the PongPal project developed at Softhouse, featuring booking, statistics, and user profile flows. The repository contains images and videos, not source code.', 'Full-Stack', 'https://github.com/Mouaz7/PongPal-Showcase', array['TypeScript', 'JavaScript'], '/project-icons/typescript.svg', 'public', 3, true, '2026-07-05T18:05:08.324888+00:00'),
  ('823c8c13-5240-4dc7-baf3-c29989454035', 'E-Shop Management System', 'A full-stack e-commerce management system built with Node.js, Express, EJS, and MariaDB, including product, category, order, and inventory management, stored procedures, triggers, and an admin interface.', 'Full-Stack', 'https://github.com/Mouaz7/Eshop-management-system', array['Node.js', 'Express', 'MySQL', 'EJS'], '/project-icons/nodejs-badge.svg', 'public', 4, true, '2026-06-22T06:33:28.130044+00:00'),
  ('cb5a0ef2-c3ea-4f19-a213-ac8b5d42a736', 'Burger Project', 'A full-stack burger ordering app built with Node.js, MySQL, and EJS, including order customization, a kitchen view, and database integration.', 'Full-Stack', 'https://github.com/Mouaz7/BurgerProject', array['Node.js', 'MySQL', 'EJS'], '/project-icons/nodejs-badge.svg', 'public', 5, true, '2026-07-05T18:05:08.324888+00:00'),
  ('b1f8e630-fee9-45a2-8246-7832a1e3853d', 'Auto-Healing DevOps Platform', 'An AI-powered, self-healing CI/CD pipeline with six specialized agents, MCP microservices, a traffic-light safety system, and Prometheus metrics. Developed as a bachelor’s thesis at BTH.', 'Build', 'https://github.com/Mouaz7/auto-healing-devops-platform', array['Python', 'Jenkins', 'Docker', 'JSON', 'AI'], '/project-icons/python.svg', 'public', 101, true, '2026-06-22T06:33:28.130044+00:00'),
  ('e894f170-db1d-42ab-9998-947dedaa538f', 'Campus360', 'An Android campus navigation app with indoor and outdoor maps, pathfinding, and Firebase authentication, built with Kotlin, Clean Architecture, and MVVM.', 'Mobile', 'https://github.com/Mouaz7/Campus360', array['Kotlin', 'Java', 'Firebase', 'Android'], '/project-icons/android.svg', 'public', 201, true, '2026-06-08T20:04:14.100811+00:00'),
  ('0b57195f-ef67-4e81-a595-0d6937a0fb10', 'Buffered I/O in Assembly', 'An Assembly and C I/O library with x86-64 routines for text and integer input/output, plus test applications in both languages.', 'Systems', 'https://github.com/Mouaz7/Asm-Buffered-IO', array['Assembly', 'C', 'x86'], '/project-icons/c.svg', 'public', 301, true, '2026-06-08T20:04:14.100811+00:00'),
  ('882c9596-d229-4932-9773-11465952154a', 'Concurrency Systems', 'Low-level systems programming in C covering multithreading, process synchronization, IPC mechanisms, and memory-management algorithms.', 'Systems', 'https://github.com/Mouaz7/Concurrency-Systems', array['C', 'Linux', 'POSIX Threads'], '/project-icons/c.svg', 'public', 302, true, '2026-06-22T06:33:28.130044+00:00'),
  ('c179d094-9e84-4085-8ba7-767c47f3cced', 'OS Filesystem', 'A C++ implementation of a FAT-based file system with a command-line shell.', 'Systems', 'https://github.com/Mouaz7/Os_filesystem', array['C++', 'Linux'], '/project-icons/cplusplus.svg', 'public', 303, true, '2026-06-08T20:04:14.100811+00:00'),
  ('b53ca88b-acfb-432f-8b3e-1bd79671b283', 'Chess Game', 'A lightweight chess game built with C++ and SFML 3.0, featuring move hints, material scores, player names, 10-minute timers, and automatically saved results.', 'Systems', 'https://github.com/Mouaz7/chess-game', array['C++', 'SFML', 'CMake'], '/project-icons/cplusplus.svg', 'public', 304, true, '2026-07-05T18:05:08.324888+00:00'),
  ('05f461c1-779a-401f-9022-91431dc2e934', 'Linked List in Python', 'A Python implementation of the TwoCell class for doubly linked lists.', 'Systems', 'https://github.com/Mouaz7/Python-Linked-List', array['Python', 'Data Structures'], '/project-icons/python.svg', 'public', 305, true, '2026-07-05T18:05:08.324888+00:00'),
  ('81c43e79-d602-4409-95e1-611b6ce51623', 'Python Table Implementations', 'Implementations and performance tests for a table ADT in Python, including TableAsArray, TableAsList, and TableAsMTF.', 'Systems', 'https://github.com/Mouaz7/Python-Table-Implementations', array['Python', 'Algorithms'], '/project-icons/python.svg', 'public', 306, true, '2026-07-05T18:05:08.324888+00:00'),
  ('932fbf16-02cd-4d0e-b18c-d606080e6355', 'ARM Interrupt and UART Display', 'An ARM Cortex-A9 Assembly project that handles button interrupts, reads UART commands, and updates a seven-segment display.', 'Systems', 'https://github.com/Mouaz7/ARM-Interrupt-UART-Display', array['Assembly', 'ARM', 'UART'], '/project-icons/c.svg', 'public', 307, true, '2026-07-05T18:05:08.324888+00:00'),
  ('4f014ae3-b9a0-4494-ab5c-4d466582d771', 'ARM UART Factorial', 'A compact ARM Assembly project that computes factorials recursively and prints the results over UART.', 'Systems', 'https://github.com/Mouaz7/ARM-UART-Factorial', array['Assembly', 'ARM', 'UART'], '/project-icons/c.svg', 'public', 308, true, '2026-07-05T18:05:08.324888+00:00'),
  ('337c4cb7-c8df-4603-8d60-a900d47e9282', 'Practical Network Communication', 'A practical network communication project using TCP, UDP, and a simple web browser.', 'Systems', 'https://github.com/Mouaz7/Practical-Communication', array['Python', 'TCP', 'UDP'], '/project-icons/python.svg', 'public', 309, true, '2026-07-05T18:05:08.324888+00:00'),
  ('13ef9627-43fe-4e46-bb97-3c1f382f2027', 'UDP and TCP Analysis', 'Analysis and implementation of UDP and TCP send-and-receive tests, including performance observations and improvements.', 'Systems', 'https://github.com/Mouaz7/network-udp-tcp-analysis', array['Python', 'TCP', 'UDP'], '/project-icons/python.svg', 'public', 310, true, '2026-07-05T18:05:08.324888+00:00'),
  ('9394a032-aba3-48bd-b578-6c9431fe84c3', 'Directed Graph and BFS in Python', 'A Python program that checks connectivity in directed graphs using breadth-first search (BFS).', 'Systems', 'https://github.com/Mouaz7/Python-directed-graph-bfs', array['Python', 'BFS', 'Graphs'], '/project-icons/python.svg', 'public', 311, true, '2026-07-05T18:05:08.324888+00:00'),
  ('4a3a0688-efdc-4ccd-8359-f6b5bc09dba9', 'Typing Speed Tracker', 'A Python program that measures and tracks typing speed with word lists at different difficulty levels.', 'Systems', 'https://github.com/Mouaz7/typing-speed-tracker', array['Python'], '/project-icons/python.svg', 'public', 312, true, '2026-07-05T18:05:08.324888+00:00'),
  ('47856dc5-33fd-4e7b-9a8c-309ab8dbb735', 'C++ Transport System', 'A C++ project for managing transport schedules, shuttle services, and passenger bookings.', 'Systems', 'https://github.com/Mouaz7/Cpp-TransportSystem', array['C++', 'OOP'], '/project-icons/cplusplus.svg', 'public', 313, true, '2026-06-22T06:33:28.130044+00:00'),
  ('dbfb157f-6ff0-4000-8b96-f589c6c419a3', 'BSV Duplicate', 'A course project that detects duplicate entries in BibTeX files.', 'Systems', 'https://github.com/Mouaz7/bsv-duplicate', array['Python'], '/project-icons/python.svg', 'public', 314, true, '2026-07-05T18:05:08.324888+00:00'),
  ('500c8c0a-816e-4388-9e30-67bd855b217c', 'BSV Edutask', 'An educational project for the PA1417 course that applies software-testing techniques.', 'Systems', 'https://github.com/Mouaz7/bsv-edutask', array['Python', 'Testing'], '/project-icons/python.svg', 'public', 315, true, '2026-07-05T18:05:08.324888+00:00'),
  ('5d8f3352-bf8a-45d7-9544-0fc4a443c665', 'Quiz Game', 'An object-oriented C++ quiz system for creating, managing, and playing quizzes, with multiple question types, players, leaderboards, file handling, and UML documentation.', 'Systems', 'https://github.com/Mouaz7/quiz-game', array['C++', 'OOP', 'Algorithms'], '/project-icons/cplusplus.svg', 'public', 316, true, '2026-07-05T18:05:08.324888+00:00')
on conflict (github_url) do update
set title = excluded.title,
    description = excluded.description,
    category = excluded.category,
    languages = excluded.languages,
    cover_image_href = excluded.cover_image_href,
    visibility = excluded.visibility,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    created_at = excluded.created_at;

insert into public.journey_item (
  id,
  title,
  details,
  start_date,
  end_date,
  icon_bucket,
  icon_path,
  icon_alt,
  sort_order,
  is_active
)
values
  ('c28c5768-6a19-4ee4-acd2-1607cb9d8005', 'M.Sc. Software Engineering – BTH', 'Master’s degree in Software Engineering at BTH.', '2026-08-01T00:00:00+00:00', '2028-06-30T00:00:00+00:00', '', '/journey/bth-logo.webp', 'Master', 0, true),
  ('4898ced1-e1ef-4ed2-ac39-1c29d4921cd5', 'Full-Stack Developer Intern (TeamTemp) – Softhouse', 'Built a cross-platform survey app using Bun.', '2026-01-13T00:00:00+00:00', '2026-05-31T00:00:00+00:00', '', '/journey/softhouse.webp', 'Bun', 0, true),
  ('9966107f-5951-466f-a208-1abd3c92d3ba', 'Student Mentor – BTH', 'Mentored and onboarded new students.', '2025-09-01T00:00:00+00:00', '2026-06-15T00:00:00+00:00', '', '/journey/bth-logo.webp', 'Mentor', 0, true),
  ('e4bfe45d-a25b-4d7b-af75-bbe65e700cee', 'C++ Teaching Assistant (OOP) – BTH', 'Taught C++ and OOP during lab sessions.', '2025-09-01T00:00:00+00:00', '2026-06-15T00:00:00+00:00', '', '/journey/bth-logo.webp', 'C++', 0, true),
  ('bb3fae1f-1883-4d7f-958b-33d063d42913', 'Full-Stack Developer Intern (Pong Pal) – Softhouse', 'Built a real-time system using Slack and Firebase.', '2025-01-13T00:00:00+00:00', '2025-05-31T00:00:00+00:00', '', '/journey/softhouse.webp', 'Slack', 0, true),
  ('907d3374-d946-473e-b729-2b44a1bde9e2', 'B.Sc. Software Engineering – BTH', 'Bachelor’s degree in Software Engineering at BTH.', '2023-08-28T00:00:00+00:00', '2026-06-15T00:00:00+00:00', '', '/journey/bth-logo.webp', 'Examen', 0, true)
on conflict (id) do update
set title = excluded.title,
    details = excluded.details,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    icon_bucket = excluded.icon_bucket,
    icon_path = excluded.icon_path,
    icon_alt = excluded.icon_alt,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

insert into public.contact_social (
  id,
  name,
  href,
  svg_path,
  viewbox,
  is_active,
  sort_order
)
overriding system value
values
  (1, 'GitHub', 'https://github.com/Mouaz7', 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12', '0 0 24 24', true, 1),
  (2, 'LinkedIn', 'https://www.linkedin.com/in/mouaz-naji', 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z', '0 0 24 24', true, 2),
  (3, 'Email', 'mailto:mouaz.naji.dev@gmail.com', 'M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-1.909V10.91L12 16.636 3.545 10.91v10.092H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z', '0 0 24 24', true, 3),
  (4, 'Beacons', 'https://beacons.ai/mouaz98', 'M5 8a3 3 0 1 0 6 0 3 3 0 0 0-6 0Zm8.4-2a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0ZM8.3 15a3.2 3.2 0 1 0 6.4 0 3.2 3.2 0 0 0-6.4 0ZM2 11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Zm2.4 7.5a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0Z', '0 0 24 24', true, 4)
on conflict (id) do update
set name = excluded.name,
    href = excluded.href,
    svg_path = excluded.svg_path,
    viewbox = excluded.viewbox,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

select setval(
  pg_get_serial_sequence('public.contact_social', 'id'),
  coalesce((select max(id) from public.contact_social), 1),
  true
);
