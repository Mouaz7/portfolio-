import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";

const lockedFiles = {
  "app/code-review-page.module.css": "5e0be36ca4ea65caac327cd92365a1916d149d6d33f4b35b0e65d503ab81718a",
  "app/fonts.ts": "c6132ac9f3af551fefa720bab1edecff3dc8ccf05184e878e101979c7e5fac8c",
  "app/fonts/urbanist-latin.woff2": "ce6e0dd89c3ffa4de97bda85f9b08bcb775bea4df456b3dbb7e819c1c879be50",
  "app/global.css": "524d511cb925cad46ffaf5ce12d7e056a77ffbb6ba6a11fa02d0e847418f5a38",
  "app/home-page.module.css": "707a6f0be16446c601fed7a83f69f90690effb2ce97dc62df3c65ca5f93a11ba",
  "app/i18n.css": "6356f72a0c2df5d2fa7d8d55af96bca38396cb7e6940fbfdec9b75988d9ea5f5",
  "app/contact-page/contact-repository.css": "7fddba19dc62f75c10fb67150344955668c05d327c1f4745b8ae9c89522556ea",
  "components/brand/MouazPremiumLogo.module.css": "73202087229b69211bac4840d5634dfb557593c9e7441e1093754d0906fd3429",
  "components/code-editor.module.css": "d9bd87070ac92749047db5ce246ccb96c29e1d51eef743fc4d3366eceeb94383",
  "components/code-review-markdown.module.css": "0dae178097e3d13f0452b7c2d1d1ae2bc4e89fff67e76471b2a2ff53918704b5",
  "components/code-review/ReviewChat.module.css": "f06135f101b17b6bd3570cf260dc2031fad9a7844c2d4e7689764a4e4d1b5f28",
  "components/contact/ContactRepositoryHeader.tsx": "a6fcbd25d8ff9f02c15cbf31849dc2cf91965641b58f73c51866ffc89ddb84be",
  "components/contact/photo-social-container.tsx": "3a2624852585c57808b1d654848c0d8ced4b25eb56f29a9ecb0695c7ee4d3caf",
  "components/project/ProjectCard.tsx": "d09c8d30a53714ca0871e41b1b73caa797dd71a5faec9397c665438dcd2a130e",
  "components/navigation/Header.tsx": "2bad29deb8018a5fc0f62264f166919ce74ec1e7be4724ece38655e51d74349d",
  "components/skills/SkillCard.module.css": "d5e873324434778126ed8014960ef675513cc4d1b019a94c8dcaf5b796915edc",
  "components/skills/SkillCard.tsx": "681e64fbf75b72e52bd62e754fb01e4056d988798408d4f4ae5cfb16ff7544b4",
  "components/skills/SkillIcon.tsx": "acc41e0402cf76e4b95e1b65978ee61ed513a3aefa3b00f4cee27374161fafe8",
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
