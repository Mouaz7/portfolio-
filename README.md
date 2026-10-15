<div align="center">

# 👨‍💻 Mouaz Naji

### Developer Portfolio

A developer portfolio built around code, projects and experience.

**[🌐 Explore the portfolio ↗](https://mouazdev.vercel.app)**

[📖 Documentation](docs/README.md) &nbsp; · &nbsp; [✉️ Contact](https://mouazdev.vercel.app/contact)

<sub>English · Swedish · Arabic &nbsp; / &nbsp; Light & dark</sub>

</div>

<br />

## ✨ The portfolio

A personal developer workspace with a Git inspired interface, built with
**Next.js**, **React**, **TypeScript** and **Supabase**.
Designed for desktop, tablet and mobile.

**🏠 Home & 🧩 Skills**<br />
Get to know the developer, explore technologies and access the CV.

**🌱 Journey & 🚀 Projects**<br />
Follow education and experience, then browse projects with search,
category filters and GitHub details.

**🔎 Code Review & ✉️ Contact**<br />
Review code with AI, ask the portfolio assistant a question or send a message.

<br />

## 🧰 Built with

**⚛️ Interface · Next.js, React & TypeScript**<br />
Pages, reusable components and application logic.

**🎨 Styling · Tailwind CSS & CSS Modules**<br />
Responsive layouts, theme styling and component animations.

**🗄️ Data · Supabase**<br />
PostgreSQL data and storage integrations for portfolio features.

**🤖 Features · NVIDIA AI, Shiki & Nodemailer**<br />
AI responses, code highlighting and contact email delivery.

**🧪 Quality · Jest, Playwright & axe**<br />
Unit tests, browser checks and accessibility checks.

**☁️ Delivery · GitHub Actions & Vercel**<br />
Automated project checks and website deployment.

<br />

## ⚡ Run it locally

**1️⃣ Prepare**

Install **Node.js 22.x** and npm, then open the project directory.

```bash
npm ci
cp .env.example .env.local
```

**2️⃣ Configure**

Use [`.env.example`](.env.example) as the setup reference.
Supabase powers database features. AI and email features need their own
credentials. Keep real credentials in `.env.local`.

**3️⃣ Start**

```bash
npm run dev
```

When the terminal reports `Public pages ready`, open
**[localhost:3000](http://localhost:3000)**.

<details>
<summary><strong>🛠️ Build, checks and tests</strong></summary>

```bash
# Production build and server
npm run build
npm start

# Code checks
npm run lint
npm run typecheck

# Unit and browser tests
npm run test:ci
npm run test:e2e
```

See the [testing guide](docs/testing%2Dguide.md) for browser installation
and additional checks.

</details>

<br />

## 📚 Further reading

[📖 Documentation](docs/README.md) &nbsp; · &nbsp; [🛡️ Security](.github/SECURITY.md) &nbsp; · &nbsp; [🔒 Privacy](https://mouazdev.vercel.app/privacy)

Setup, architecture, integrations and deployment guides live in the documentation hub.

<br />

<sub>© 2026 Mouaz Naji. All rights reserved. Read the <a href="LICENSE">license</a> and <a href="ASSETS_LICENSE.md">asset rights</a> before reusing code or assets.</sub>
