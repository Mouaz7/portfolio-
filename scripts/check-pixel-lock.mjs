import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Approved responsive references. They are refreshed only after the complete
// light/dark viewport set has passed accessibility checks and been reviewed at
// native resolution; see docs/testing-guide.md.
// Navigation references updated after the requested feature removal.
// The 12 changed headers were compared with an isolated pre-change render;
// existing text masks, dimensions and geometry tolerances are retained.
const expected = {
  "desktop-contact-page-dark.png": "cf7e9f76352c4d16c8615023f9d8ded0983f0f6cebd3a6605665b8358e51ac7d",
  "desktop-contact-page-light.png": "c4726e1e616bada26c9193093581476f65f9fd8d3152a437204d23fc50e9c5b1",
  "desktop-home-dark.png": "702262c504c19d6ce6fed48ec835501e8d1c72df3876900f4781e9e40d6c35b1",
  "desktop-home-light.png": "e60745c3528f795cb8cfbe0f5e84fdf271c0e018c02490f5af9fed34c934bc86",
  "desktop-projects-page-dark.png": "f92f99fb2f8f3bcd815b4f2d6f40040b6733006ac6be9a2dbdd330906cff71e2",
  "desktop-projects-page-light.png": "7ff8dbec2d68d1077063d1c7613263762e5db0e5323f75c976fb6a1f259f85ae",
  "desktop-journey-dark.png": "a44076132fc033f790ed73a58d79671388c9a034cc3effc002cf083c68cd1a2a",
  "desktop-journey-light.png": "811a102a55cd348c3ceeb17c6cc6a640ce3e706ad5449f81e77f37dbfae14221",
  "desktop-skills-page-dark.png": "14df99119b3e8e19d293d53eca594a7ce50dc6287bfc0a6a7b1c9f9af7bf4d0b",
  "desktop-skills-page-light.png": "0f3b7c77ce873c2cb4dc89793ef0c9897a05af122953d7b71a3eb428eae6ae2c",
  "mobile-contact-page-dark.png": "bd2692cf398b8da76686571d30b404dff20b9ab141d88c091b421daeca3818f6",
  "mobile-contact-page-light.png": "b5ee2cbd9a574c9fb60c690e7fd52ae3b3baf5a3ef48150e2c3b0d0395b49f7e",
  "mobile-home-dark.png": "0d9d798ec2e6b562ecef9802ad66eeb7187234fd04fd60f4de35ccc04c98747b",
  "mobile-home-light.png": "1cd81e9db1f0f8b529ce48ee64673ecfb14ed4948e20b03ec0a00eee27801ca6",
  "mobile-projects-page-dark.png": "ee310f71c26dd4134287b8f8a729cb89602a11af82a9aca5d537caef9cc095fb",
  "mobile-projects-page-light.png": "0cc7257e9f547270b1c3fea1bd3684a880959b0d3445add8a993647583c45f61",
  "mobile-journey-dark.png": "39a4a56f2479f95f3199254932c5a50b12df0bdb671b446389c9cc97a5f9e8e4",
  "mobile-journey-light.png": "3966bcb8dabad5c3dd94eacc4202443ebe86933bab2a90b3820cad90a936b95e",
  "mobile-skills-page-dark.png": "31a09f73eddf8ded2b5d2194519d8c6783460a17b1ae57821d239e23c1ae6f6e",
  "mobile-skills-page-light.png": "3392b146d891d30d89631db740a2c538af6b16d2b543c2b3cbdc9c734fe7c8aa",
  "tablet-contact-page-dark.png": "1da79e5515a3d8869c098141d71499932734103035818243fd59b329bb5b918d",
  "tablet-contact-page-light.png": "93f253ddeaa15b9e36efffa7878ad41743e2e058a19f443f12248c8e9441f3c8",
  "tablet-home-dark.png": "73b599830548f160d81b6a189a2a91f1d961035d305c1e97fa3be6e784047fb7",
  "tablet-home-light.png": "f558f2bfeb5dfcf61f9f4b93af2a8e1671f1e72a6dcdb8299cc173a0a8043813",
  "tablet-projects-page-dark.png": "635aaf6154b2105eaf8a61c15d69950fab9e415dd18cde8c6dd111a1aa8c6c9a",
  "tablet-projects-page-light.png": "5e977c2ee88504b549164485e7874689fad6e9bd3de32d1d06ce14841f9a2834",
  "tablet-journey-dark.png": "1e30ece57e9031d99e0deb9bde3db21f5b233642fba79ebca392c9cf8c654dbd",
  "tablet-journey-light.png": "e5289f4ae2c70b09b64dbc21ee272a7358d4ae924528aa1d5f4afc5cdb7abdba",
  "tablet-skills-page-dark.png": "9c367faa766538eb5ea3825f11802c6c0427df160eed6c814af321ce3c426270",
  "tablet-skills-page-light.png": "e930509f870bb660070b5d31edc1e72894129a8e855d1900d62da815a85451f2",
};

// The exact hash remains the primary lock. This edge signature is a fallback
// for the handful of subpixel anti-aliasing differences Linux Chromium can
// produce while preserving the same dimensions, geometry and visible edges.
const expectedPerceptual = {
  "desktop-contact-page-dark.png": "3f0195d031b723561c74f948677359c76b8be23985bd6d93d7d4673c5880b5e3",
  "desktop-contact-page-light.png": "a80b08e4ddc8e02915f0849d11d8392a9964cd1b2268479d1fbd84c5e39617a3",
  "desktop-home-dark.png": "b8ff22c348e837405f626400dace617a80a24c1c5ddb01415a651f9e904e29cf",
  "desktop-home-light.png": "2fac2cf82104bd18fb9d66482906bd6c6b5d0b5fb63e463dc914a287f34760f1",
  "desktop-journey-dark.png": "c6e047a3f2fa629ce83c17c883f73bf4e92017a8cc34f7186b0d5515feb1089b",
  "desktop-journey-light.png": "5d829b8317c3327ff7b5322304378018ac2f9ed894448154141b35c3ea997077",
  "desktop-projects-page-dark.png": "ff0640261520e391c68ca2597ae3f02e5adf5c495d0617fc1f3bef254db37e81",
  "desktop-projects-page-light.png": "9b22789929f905505740734b14ac5b86b3e0be317d9f7ab434dc6b7768976676",
  "desktop-skills-page-dark.png": "a8c12f8a80f421091ef129bc7eb2ba7d47ba2c943204560a56061e32494be2a2",
  "desktop-skills-page-light.png": "4ab0644755294e2105de269deebd7eb985e9befee1829688bda427af328cf8d7",
  "mobile-contact-page-dark.png": "939a0da72c3f602c4f1e3271ee4e2153290abf5d9cee7b7e9acd9285f58152eb",
  "mobile-contact-page-light.png": "175ba796223584aaf4a7ea07ee1e40064fc2f1a40cc0e21af962d08e391d0ae2",
  "mobile-home-dark.png": "f35dd7643d66011efe4bdb8f68c0818b5e335f039c50eb1034d950ad26a5d4e4",
  "mobile-home-light.png": "87424c7a335bc5f34d4eb67238bc9d4d3e551f27c6a5feafd89b8c4065706dba",
  "mobile-journey-dark.png": "9611b6cf7cc07108b99650dd537180f3c7c0e3565e1b459ad6811a4e006c273c",
  "mobile-journey-light.png": "2e0bd8219a3e712d64a5ef9d949d0ae187146e4448c4f16b80128510b7607a32",
  "mobile-projects-page-dark.png": "728489e8886f69b024a7f7df4e1f7e6b2aab723f435fb9c9d82693e608f508ff",
  "mobile-projects-page-light.png": "1e1bc0139c7220cbc85cbded7d0f7b2884a452d5f96c8b02fa16b1c6e365d8ed",
  "mobile-skills-page-dark.png": "48f661aa8b531dbe49534d0c1f4d03bc557d72a75bd354bf54cd970174076425",
  "mobile-skills-page-light.png": "b2afb54543c716efc133c2e932047e5604630f0cc51437fa4da6932f20d85738",
  "tablet-contact-page-dark.png": "f4a13a63cd608f562d53ad0605eafd25bee58b84d474850a7736043b605f329c",
  "tablet-contact-page-light.png": "03f147263a9bdec5ffd6cb00587648917520c440b7c67f8c551b360d1eb0b0e3",
  "tablet-home-dark.png": "17bf40089265d5996f5cb5dab8e52b2c3b169c3d8ef0c88d00007640eea1c96f",
  "tablet-home-light.png": "142be32b9f770421a5565a21da6d1bf52c429a0cefe65c465c087cc857ecf0e1",
  "tablet-journey-dark.png": "bf649d0a1e812e6e1cec3f456270e50148d34d6d5c6e26f35b1fedd39de03a5c",
  "tablet-journey-light.png": "450e3153a57ec7eaed5906fad6b6f14988e15d65fa3b52c9c12f9b62881e62f5",
  "tablet-projects-page-dark.png": "858bb32d72efa55784c47b343203195c1e62b6e9d32d9c5f7aa91003d8f0dd8e",
  "tablet-projects-page-light.png": "5d60790781897c521f42106f1a241cb75a4ce02a7fa07f7464044c88f4db4df8",
  "tablet-skills-page-dark.png": "c1db413893007145b5b1600067d7b860c4b9a696da0229eebd2ade7fbd6910d4",
  "tablet-skills-page-light.png": "974d4bd428d5596550b5293663480beb7cf09f75de36f8a300421671a3b0cd71",
};

// Journey retains its six-bit allowance out of 1024 for reviewed desktop
// border/logo rasterization differences. Skills retain their four-bit
// allowance for SVG logo rasterization.
const expectedGeometrySignatures = {
  "desktop-journey-dark.png": "0ACTatEAk2vkAGmQSwAWLoNgAQ4IwAAcJDIATEYuAAwFjgA0UFgATEJvAExCLwA2WDgAHETAAExGTgAMRDYANlhQAExGXgBMRm4ANlEwADxQbABMRm8ADEKeAD4QsAAsRj4ALEZOAB4RGAAMUHgALEZuAA4GPAAeIDAADAhAAAA=",
  "desktop-journey-light.png": "IABslCABbJATABYspMApkiyABDQDMAAMCsAAMiiQADQqYAAMJyYAMCaQADIk0AAMJsIADCMwADIokAA0KEAADCeEADApoAAyKJAADCbMAAwnkgAyJJAANCQgAAwnRgAaKcEAEiiwAAwmJgAMJ6QAEiiQABw4gAAMBggAGAggAAA=",
  "desktop-skills-page-dark.png": "0ACTatAAk2vAQGaQWA0J6XJMy5kD8Pwfdo0rTTZk2ZM2ZN2TNmTZkzZk2ZM2ZNmTVKVqjWNM65lDoHYfck6ZlTZk3ZM2ZN2TMk7ZszZE2ZMmZNmzbAsI5WNMaxkD6HwfMkabxTJE2Zs2RN2TNiTJkzYkyZM2ZNhtCGkJjYCAAjA=",
  "desktop-skills-page-light.png": "IABslCABbJAgBBlogrDWFoyhNGZ8LwnhwnNcE8mTImzNmyZtSbsibMmbImxJmyJtq1uVUoyjFGY8T4nhjaFma0m7JmxJuyJtTbEmTUm7Im1Zuytsk7QXGpyjlOd8b4nhzbskG02bJmVNqyJsyVs2bUlbNm3JGSmS9pJmMAghCAk=",
  "mobile-skills-page-dark.png": "NAAAEjYAk5PBL2RtMPk4YRjGnMYZxpzGGMacxhyLHOdBeWEZMGcy3RimHOecxhhnHMYcZhSvHMdDGWG5IpcY9ZzKmMc8ppjWHOacxhzNXONjOWMZGjcIfRjmnGcY5BjDONocwxlvHOXGUTeIEmM5ggIcx4ACGOeAAgytgAILEYA=",
  "mobile-skills-page-light.png": "yACCDIiwQGw6AZqTzobHlsc5YxnnOWMZ4xljGWN0YxiShJ7nzpbNIkM5YxhjGWOdZzljmWsQYzmc555H3TjGCmM1YxhDGWMpQxFjCWMyoxycxpzj5Yj3gmcZY5hnOWc95ydjPMYQYxkRjsnUApzGiAJjGYACZxmAAtNSgADkzgA=",
  "tablet-skills-page-dark.png": "aAAaAWgAGgEAAOQCgAAYAAAAAAAAAAAAKAUCQEZI2RtDaGkdNmTZ0zbk3JM2ZNmTNuTYk1RrKU1Nyfk/CelpLTbEnJM2RJmTNsTZkzbk2JNIS8lhS+h5LzJkyWU2xNmTNuTYkzZk2alIazktUBCCkgAAAAgAAAAAAAAAAAAAAAA=",
  "tablet-skills-page-light.png": "kAHkBpAB5AbAABgBQACAAgAAAAAAAAAAAgjAGLm3JMQ8JwHhyZsiDMkbImzJOyNsyRsjbKOVJrIyNgTE9laW0kk7YmxJu2ZtSTkibckbK2yyNCaUNBaC0M2bJpJJOyJsyVsibMlbJEG2FMvQyKkVAAAAAAAAAAAAAAAAAAAAAAA=",
};

function hammingDistance(left, right) {
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    let value = left[index] ^ right[index];
    while (value > 0) {
      distance += 1;
      value &= value - 1;
    }
  }
  return distance;
}

const expectedSize = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
};

function allowedTextMasks(name) {
  const masks = [];
  if (name.startsWith("desktop-")) {
    masks.push({ left: 936, top: 22, width: 88, height: 27 });
  } else if (name.startsWith("tablet-")) {
    masks.push({ left: 399, top: 22, width: 78, height: 28 });
  }

  if (name.includes("journey")) {
    if (name.startsWith("desktop-")) {
      masks.push({ left: 251, top: 111, width: 67, height: 25 });
    } else if (name.startsWith("tablet-")) {
      masks.push({ left: 168, top: 113, width: 65, height: 24 });
    } else {
      masks.push({ left: 136, top: 65, width: 60, height: 24 });
    }
  }
  if (name.startsWith("desktop-home-")) {
    masks.push({ left: 700, top: 500, width: 700, height: 270 });
  }
  // Repository statistics arrive independently from the server-rendered
  // project data. The GitHub response can replace the fallback language and
  // add live star/fork counts before the screenshot.
  // Mask only that dynamic first-card metadata line; card geometry and all
  // other project content remain pixel-locked.
  if (name.includes("projects-page")) {
    if (name.startsWith("desktop-")) {
      masks.push({ left: 96, top: 325, width: 154, height: 24 });
    } else if (name.startsWith("tablet-")) {
      masks.push({ left: 38, top: 331, width: 154, height: 24 });
    }
  }
  return masks;
}

async function normalizedHash(file, masks) {
  let image = sharp(file);
  if (masks.length > 0) {
    image = image.composite(masks.map((mask) => ({
      input: {
        create: {
          width: mask.width,
          height: mask.height,
          channels: 3,
          background: { r: 255, g: 0, b: 255 },
        },
      },
      left: mask.left,
      top: mask.top,
    })));
  }
  const normalized = await image.png().toBuffer();
  const { data, info } = await sharp(normalized).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const edges = await sharp(normalized)
    .removeAlpha()
    .grayscale()
    .resize(33, 32, { fit: "fill" })
    .raw()
    .toBuffer();
  const signature = Buffer.alloc(128);
  let signatureOffset = 0;
  for (let y = 0; y < 32; y += 1) {
    for (let byte = 0; byte < 4; byte += 1) {
      let value = 0;
      for (let bit = 0; bit < 8; bit += 1) {
        const x = (byte * 8) + bit;
        value = (value << 1) | Number(edges[(y * 33) + x] > edges[(y * 33) + x + 1]);
      }
      signature[signatureOffset] = value;
      signatureOffset += 1;
    }
  }
  return {
    geometry: signature,
    hash: crypto.createHash("sha256").update(data).digest("hex"),
    perceptual: crypto.createHash("sha256").update(signature).digest("hex"),
    height: info.height,
    width: info.width,
  };
}

const screenshotDir = path.resolve(process.argv[2] ?? "test-results/visual-actual");
const failures = [];

for (const [name, expectedHash] of Object.entries(expected)) {
  const file = path.join(screenshotDir, name);
  try {
    await fs.access(file);
  } catch {
    failures.push(`${name}: screenshot is missing`);
    continue;
  }

  const viewport = name.split("-", 1)[0];
  const size = expectedSize[viewport];
  const actual = await normalizedHash(file, allowedTextMasks(name));
  const expectedGeometry = expectedGeometrySignatures[name];
  const geometryMatches = expectedGeometry
    ? hammingDistance(actual.geometry, Buffer.from(expectedGeometry, "base64"))
      <= (name.startsWith("desktop-journey-") ? 6 : 4)
    : false;
  if (actual.width !== size.width || actual.height !== size.height) {
    failures.push(`${name}: expected ${size.width}x${size.height}, received ${actual.width}x${actual.height}`);
  } else if (
    actual.hash !== expectedHash
    && actual.perceptual !== expectedPerceptual[name]
    && !geometryMatches
  ) {
    failures.push(
      `${name}: expected hash ${expectedHash}, received ${actual.hash}; `
      + `expected perceptual ${expectedPerceptual[name]}, received ${actual.perceptual}`,
    );
  }
}

if (failures.length > 0) {
  console.error(`Pixel lock failed (${failures.length}/${Object.keys(expected).length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Pixel lock passed for ${Object.keys(expected).length} screenshots.`);
}
