import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Approved responsive references. They are refreshed only after the complete
// light/dark viewport set has passed accessibility checks and been reviewed at
// native resolution; see docs/testing-guide.md.
const expected = {
  "desktop-code-review-page-dark.png": "19e083a4198a86e609e5023921fc446d7199b45257ac8a1392ef0870696a6393",
  "desktop-code-review-page-light.png": "ed28a95cc86a35fb6d41b9319008169375487f402c5ab2600be0f6e5e0c9bd24",
  "desktop-contact-page-dark.png": "0b5897a93ee99b0e5636819c474c61c04ef0003524b0105a7e7bbdc74ca8af64",
  "desktop-contact-page-light.png": "50ae4899b8ddd3eb4906c9cf15aa4a68cc2889e7f4a2d4b1c43adde5c3b7f424",
  "desktop-home-dark.png": "af25cac12cfd1f363ec0694f62a05c81a06b96e883f66d5b7777d3271b2d45e0",
  "desktop-home-light.png": "dacfaeeb63240dcaa863644afbeacc3d7acbe0f9e594e160e7b136d6235779d4",
  "desktop-projects-page-dark.png": "440d6d352874cd938ef7440f2fb3c1b881007dbad4b0efb4b4100357e2d4fc64",
  "desktop-projects-page-light.png": "3355687d8555e13ad6cfd29f499be55dc488072532e099849cde49b4dbf65b98",
  "desktop-journey-dark.png": "aadcb83f74c262494d69553b95f2a65225ac22e5dec3f4ce66940d2e2d509e25",
  "desktop-journey-light.png": "78462b50130f7b83932e3b1fbc9a206d1a54396fe1a85bc30a15996b63a8db78",
  "desktop-skills-page-dark.png": "aa81d031c8d0ce8f378031f70b07b7fadc9f68be9f32a01be6ac8ed2e8ee0ba1",
  "desktop-skills-page-light.png": "df9386d188f6edb8220430951c2e2445d694db8ccfa1e41380ce803dcc2e3df3",
  "mobile-code-review-page-dark.png": "12fafe011338723d514e72f87f28980865d1dbc76662de2cb3b7f2df1e3ef025",
  "mobile-code-review-page-light.png": "f170dc87ba2cc54a9e25bcb64b57c4b6c0787faa40350587141e2289f20e762b",
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
  "tablet-code-review-page-dark.png": "465442877d480b37c23ab76cdb70a440dc90136842dcbddde5bbbaba9c37eb6c",
  "tablet-code-review-page-light.png": "e0c6315eb34eba74cf9fa2bda344c6d87a3e4ab32081bcb70a72df323f0d3e26",
  "tablet-contact-page-dark.png": "1da79e5515a3d8869c098141d71499932734103035818243fd59b329bb5b918d",
  "tablet-contact-page-light.png": "93f253ddeaa15b9e36efffa7878ad41743e2e058a19f443f12248c8e9441f3c8",
  "tablet-home-dark.png": "4d6c8ebdf6c6244532c84d54ff1c13ad17d15f50f66a16331ce8d4a4746c58c1",
  "tablet-home-light.png": "56222d9b2d36824e8c508ad18922ed2419d6c92c499d14112af68ec4ad26c2ab",
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
  "desktop-code-review-page-dark.png": "1edd2c98e15ea305e074c9c969e081ccfed2099b676903b4b631984018adc23b",
  "desktop-code-review-page-light.png": "3d53e1b3d8238d91c68a9f899424825d6e22f792387bc60782e63049294de59c",
  "desktop-contact-page-dark.png": "c1f6237413da8d3eb49c55ab461036ff933b6c3daf503d227875bcbf802c568e",
  "desktop-contact-page-light.png": "094def21bc4b9fcb6f71dc19f2ab66edb7b3c7242e66104fadae8d7a64b7210c",
  "desktop-home-dark.png": "ca4c2d8ba94610d42a41f3699fa6e6bc5a7796a234d4320fb16c27b37eb3d8f4",
  "desktop-home-light.png": "b496ece0aa4c96c35429d592096f6f1d9299052e4631aafb2f733e4445fb1fa1",
  "desktop-journey-dark.png": "8c3a463d6d7c6ee496f543d5e0fea26c9a30d7da8e21f5bb1ecf74c82586db01",
  "desktop-journey-light.png": "856f63e049087ae1220894547427d7ed5b6daeb7b198ec9dd53b91c304c3af5e",
  "desktop-projects-page-dark.png": "67e043a8e7213297464f3c8de200a667001cb1758aeeb6993f9e2ba2438e35f8",
  "desktop-projects-page-light.png": "0f8924b31ab30fbd1b50fcbb67038e66b997e026e3cd048f3959b049bbbfeaff",
  "desktop-skills-page-dark.png": "c92907778942259d39fa226c9d96f643448fdb14d1fac4fde50f9c6cead701d0",
  "desktop-skills-page-light.png": "a5995700d1b3ac4e8bcc4a11208ca20ff4c64615aa7bf5b5b25fae421d4ef062",
  "mobile-code-review-page-dark.png": "64c16660b1c9353f1cf190f93cbf5cbe0ea34d4c03943910f8a520543f97fc4a",
  "mobile-code-review-page-light.png": "17cb93a5c398e96121d072b9a17454b6e8d662443ddb471a2ff307a0c1256095",
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
  "tablet-code-review-page-dark.png": "be6f6a24e1da1b6d0d42d5fda07805fd1a63c8f349f0325e29e693c492bc82b3",
  "tablet-code-review-page-light.png": "51ebe18ac991f97632c1ed529e723e13009b886d4cf0e625f3e0004e57518893",
  "tablet-contact-page-dark.png": "f4a13a63cd608f562d53ad0605eafd25bee58b84d474850a7736043b605f329c",
  "tablet-contact-page-light.png": "03f147263a9bdec5ffd6cb00587648917520c440b7c67f8c551b360d1eb0b0e3",
  "tablet-home-dark.png": "8164156d42a17504f7ff976328ab201dae2e81a9a6102609f9b6faf7f61d945f",
  "tablet-home-light.png": "ad57db6370d93e935d384c3b5bb39eb4f407eac3ffb685050c7a6273d40a46c8",
  "tablet-journey-dark.png": "bf649d0a1e812e6e1cec3f456270e50148d34d6d5c6e26f35b1fedd39de03a5c",
  "tablet-journey-light.png": "450e3153a57ec7eaed5906fad6b6f14988e15d65fa3b52c9c12f9b62881e62f5",
  "tablet-projects-page-dark.png": "858bb32d72efa55784c47b343203195c1e62b6e9d32d9c5f7aa91003d8f0dd8e",
  "tablet-projects-page-light.png": "5d60790781897c521f42106f1a241cb75a4ce02a7fa07f7464044c88f4db4df8",
  "tablet-skills-page-dark.png": "c1db413893007145b5b1600067d7b860c4b9a696da0229eebd2ade7fbd6910d4",
  "tablet-skills-page-light.png": "974d4bd428d5596550b5293663480beb7cf09f75de36f8a300421671a3b0cd71",
};

// Reviewed Linux CI rasterization of the same desktop Journey layout.
// Keep these exact edge signatures separate from the local reference instead
// of widening the geometry allowance for every future screenshot.
const reviewedPerceptualVariants = {
  "desktop-journey-dark.png": "155eac3d8585b298282ce4a3b610053242d8dca4dd810881abea1091da2e6066",
  "desktop-journey-light.png": "88446cf3c8217db194cd7ea2424b743c2f294697f54f81fca3f6dcbe8a914f9b",
};

// Journey retains its six-bit allowance out of 1024 for reviewed desktop
// border/logo rasterization differences. Skills retain their four-bit
// allowance for SVG logo rasterization.
const expectedGeometrySignatures = {
  "desktop-journey-dark.png": "0AlTatEJU2vkBp2QSwFgLoNgAA4IwAAcJDIATEYuAAwFjgA0UFgATEJvAExCLwA2WDgAHETAAExGTgAMRDYANlhQAExGXgBMRm4ANlEwADxQbABMRm8ADEKeAD4QsAAsRj4ALEZOAB4RGAAMUHgALEZuAA4GPAAeIDAADAhAAAA=",
  "desktop-journey-light.png": "IAaslCAGrJATAWJspMIJEiyAIDQDMAAMCsAAMiiQADQqYAAMJyYAMCaQADIk0AAMJsIADCcwADIokAA0KkAADCeEADApoAAyKJAADCbMAAwnkgAyJJAANCQgAAwnRgAaKcEAEiiwAAwmJgAMJ6QAEiiQABw4gAAMBggAGAggAAA=",
  "desktop-skills-page-dark.png": "0AlTatAJU2vAQmWQWA0K6XJMy5kD8Pwfdo0rTTZk2ZM2ZN2TNmTZkzZk2ZM2ZNmTVKVqjWNM65lDoHYfck6ZlTZk3ZM2ZN2TMk7ZszZE2ZMmZNmzbAsI5WNMaxkD6HwfMkabxTJE2Zs2RN2TNiTJkzYkyZM2ZNhtCGkJjYCAAjA=",
  "desktop-skills-page-light.png": "IAaslCAGrJAgAZpogrD0FoyhNGZ8LwnhwnNcE8mTImzNmyZtSbsibMmbImxJmyJtq1uVUoyjFGY8T4nhjaFma0m7JmxJuyJtTbEmTUm7Im1Zuytsk7QXGpyjlOd8b4nhzbskG02bJmVNqyJsyVs2bUlbNm3JGSmS9pJmMAghCAk=",
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
    && actual.perceptual !== reviewedPerceptualVariants[name]
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
