import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";

const lockedFiles = {
  "app/code-review-page.module.css": "075f23e29b7bd1dafc7989d064976a4e944e91a2d0b707dcabf5efe5df6ea770",
  "app/fonts.ts": "c6132ac9f3af551fefa720bab1edecff3dc8ccf05184e878e101979c7e5fac8c",
  "app/fonts/urbanist-latin.woff2": "ce6e0dd89c3ffa4de97bda85f9b08bcb775bea4df456b3dbb7e819c1c879be50",
  "app/global.css": "fff34fe1dcc37bab081f34fe5225431f63358e99078f144fff4e53c40408a990",
  "app/home-page.module.css": "24bc428c9e960997d7406d39b1a22ce498d04aba4cbd674e184ffd164f69d7ed",
  "app/i18n.css": "b42eaa1be2a06e554e3cfbf8c2f5c2fade22a340e994a18cc7dc677af55e366b",
  "app/contact-page/contact-repository.css": "4ce52f7d6220879c87530bf127800c3313f98702033f78c5ebdcad9808e9a304",
  "components/brand/MouazPremiumLogo.module.css": "10e7b16344705f5739adce71f88fca565cb2222965f3735145d3d5294dca415b",
  "components/code-editor.module.css": "eeebbdd23ca0a20f24566f2179a5c6ea320fd1e9edfd83fd69664fca482b41e7",
  "components/code-review-markdown.module.css": "0dae178097e3d13f0452b7c2d1d1ae2bc4e89fff67e76471b2a2ff53918704b5",
  "components/code-review/ReviewChat.module.css": "f06135f101b17b6bd3570cf260dc2031fad9a7844c2d4e7689764a4e4d1b5f28",
  "components/contact/ContactRepositoryHeader.tsx": "a6fcbd25d8ff9f02c15cbf31849dc2cf91965641b58f73c51866ffc89ddb84be",
  "components/contact/photo-social-container.tsx": "3a2624852585c57808b1d654848c0d8ced4b25eb56f29a9ecb0695c7ee4d3caf",
  "components/project/ProjectCard.tsx": "bd94d2bfb796ec7f07926facb64b041623881a6e1d670ca11c33b1d5749f2e57",
  "components/navigation/Header.tsx": "44c6a947a09086a8d67e22412c03de09902cac740f0d0e85a56258567092141d",
  "components/skills/SkillCard.module.css": "f579f1fdcb9700c7302dc6d005d41c04f0834f7950df82be08a6ebae838ab7e6",
  "components/skills/SkillCard.tsx": "50387842e52e9629094ce8a37f00acdcd818c59e3fbeaf89e273ff21db906934",
  "components/skills/SkillIcon.tsx": "a217af6158b8cb8fe6ee87c1014eac0b9aa013372d32b439e3c6e688936375e9",
  "public/brand/mouaz-logo-light-4k.png": "661f812a74cfbe5d86003f9b9662104e8df1082af3885e0cad3111a61763fb99",
  "public/brand/mouaz-logo.svg": "663081d638244c242715749df6066070b24a067b2b4a7e6d7f542f944b8dcb9d",
  "public/contact/check.svg": "abd410a3361f682a8bc24a2ce005bf5a4918c79ee0bb4b309eb9a508cc92495d",
  "public/contact/send-alt.svg": "6fa98ec84360d23c9359e31375abb542ee4f21afc943479dca3c19ff309420ce",
  "public/home/portfolio-cutout-1600.webp": "6964524a5ce31423595a555ac9256fe4167af40c65b56ac9acefea606990dbda",
  "public/project-icons/android.svg": "d6c8aa6c2b94c90ff02c1b7e89f9cf863d54db59b459b8b287c19bfb8e664c41",
  "public/project-icons/c.svg": "8cce48da91084256f15653e02bfd7046ccb34489d030cb1aa34dee766daad6b7",
  "public/project-icons/category-full-stack.svg": "5825b649c8c04dec13ecf01d0182401bd0ec71789d2fa06224866d882cd1515f",
  "public/project-icons/category-systems.svg": "cf50ae4a263c6142963fad3561f7cb0311d0d41cc6189eadfb34f81a8a36acb0",
  "public/project-icons/cplusplus.svg": "7ff8253551235e3a6b002a7c2bd6e3190d85113a64fcb40f2254473caeb025d4",
  "public/project-icons/docker.svg": "6d762b03f0815f114ac87e3caa3e3463c5c6ef1d39f4f5493f8ddddff7aa380b",
  "public/project-icons/firebase.svg": "8534346c6590a6414cae0e58896295592b9b2081e955be999cd0963bd1b6158c",
  "public/project-icons/githubactions.svg": "3a2524052ccf301d1a239f20cfef98d655e060c51cc29c5e94c867913899a47e",
  "public/project-icons/java.svg": "7582e518a9c02425f97155e5a3bd39d1a3a7d421b78caf9c8df7443dad3edc5d",
  "public/project-icons/javascript.svg": "0656ff65fc8eeacda5c78d7f9ffe91ec1eb919db64f56e0b7dcd460af4bbd36c",
  "public/project-icons/nextjs.svg": "d9435c4ede7133b376c0173a80226bb3856729366707cd96e9a66e39448d0288",
  "public/project-icons/nodejs-badge.svg": "e24e14ec56ccf6ff0e782a341d154cf02963abb30275ae43742470bc45142f7d",
  "public/project-icons/postgresql.svg": "d68b3da8c1ba0aa8a9ff18b0599836e00928dae10962ad479f01f82b130e393f",
  "public/project-icons/python.svg": "71493b4a732f0532b3a03a7a95da3ee11a65766367c8303b901ffbe7bf91a3a2",
  "public/project-icons/react.svg": "5825b649c8c04dec13ecf01d0182401bd0ec71789d2fa06224866d882cd1515f",
  "public/project-icons/typescript.svg": "c9191199f4049920c2fc19035b8a6664f37f4689fcd9e8434e786097e78863f0",
  "public/journey/bth-logo.webp": "3f8e7d55837dc3b5ab8d697a101575bca78a9b1d52573124db1245acdd130ad9",
  "public/journey/softhouse.webp": "a3bed70d2057d32bad63de6f04630a015a0e9716107f00042c8c531436bb5702"
};

const splitFileParts = {
  "app/global.css": [
    "app/global.css",
    "app/styles/home-and-skills.css",
    "app/styles/projects-and-contact.css",
    "app/styles/adaptive-and-motion.css",
  ],
  "app/contact-page/contact-repository.css": [
    "app/contact-page/contact-repository.css",
    "app/contact-page/contact-repository-adaptive.css",
  ],
};

const byteIdenticalAssetAliases = {
  "public/project-icons/android.svg": "public/skill-icons/mobile-android.svg",
  "public/project-icons/category-systems.svg": "public/skill-icons/devops-linux.svg",
  "public/project-icons/cplusplus.svg": "public/skill-icons/backend-c-plus-plus.svg",
  "public/project-icons/githubactions.svg": "public/skill-icons/devops-ci-cd.svg",
  "public/project-icons/java.svg": "public/skill-icons/backend-java.svg",
  "public/project-icons/javascript.svg": "public/skill-icons/frontend-javascript.svg",
  "public/project-icons/python.svg": "public/skill-icons/backend-python.svg",
  "public/project-icons/react.svg": "public/project-icons/category-full-stack.svg",
  "public/project-icons/typescript.svg": "public/skill-icons/frontend-typescript.svg",
};

const changed = [];
for (const [file, expected] of Object.entries(lockedFiles)) {
  const sharedAsset = byteIdenticalAssetAliases[file];
  if (sharedAsset) {
    // Keep legacy URLs valid until their database references and deployed
    // replacements have been verified. Both files must retain approved bytes.
    for (const asset of [file, sharedAsset]) {
      const actual = createHash("sha256").update(await readFile(asset)).digest("hex");
      if (actual !== expected) changed.push(`${asset}: expected ${expected}, received ${actual}`);
    }
    continue;
  }
  const contents = await Promise.all(
    (splitFileParts[file] ?? [file])
      .map((part) => readFile(part)),
  );
  const actual = createHash("sha256").update(Buffer.concat(contents)).digest("hex");
  if (actual !== expected) changed.push(`${file}: expected ${expected}, received ${actual}`);
}

const skillManifestFile = "docs/skill-icon-sources.json";
const skillManifest = await readFile(skillManifestFile);
const skillManifestHash = createHash("sha256").update(skillManifest).digest("hex");
const expectedSkillManifestHash = "24b0b8a96f82830a33be1275992919e61a42df5079f55b41d562146385a528cb";
if (skillManifestHash !== expectedSkillManifestHash) {
  changed.push(`${skillManifestFile}: expected ${expectedSkillManifestHash}, received ${skillManifestHash}`);
}

const skillSources = JSON.parse(skillManifest.toString("utf8"));
const expectedSkillFiles = new Set();
for (const source of skillSources) {
  for (const [pathKey, digestKey] of [["localPath", "primary"], ["localPathLight", "light"]]) {
    const publicPath = source[pathKey];
    const digest = source[digestKey]?.sha256;
    if (!publicPath || !digest) continue;
    const file = join("public", publicPath.replace(/^\//, ""));
    expectedSkillFiles.add(basename(file));
    const actual = createHash("sha256").update(await readFile(file)).digest("hex");
    if (actual !== digest) changed.push(`${file}: expected ${digest}, received ${actual}`);
  }
}

const actualSkillFiles = new Set(await readdir("public/skill-icons"));
for (const file of actualSkillFiles) {
  if (!expectedSkillFiles.has(file)) changed.push(`public/skill-icons/${file}: unexpected asset`);
}
for (const file of expectedSkillFiles) {
  if (!actualSkillFiles.has(file)) changed.push(`public/skill-icons/${file}: missing asset`);
}
if (changed.length > 0) {
  throw new Error(`Design lock failed:\n${changed.join("\n")}`);
}
console.log(
  `Design lock passed for ${Object.keys(lockedFiles).length} files and ${expectedSkillFiles.size} skill icons.`,
);
