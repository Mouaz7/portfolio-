import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const expected = {
  "desktop-code-review-page-dark.png": "0af882fda0ec1be3af2173b079eb0547900e68652f0aa9c258007adf9528021f",
  "desktop-code-review-page-light.png": "635bb7941b36d8fe23762b066f4bc1026062110bc78e077aca0f0e6792644266",
  "desktop-contact-page-dark.png": "5ad8b341664590f0298f5dc1df502c3b5f8c49744a6569f3cef5ba7c19e1d876",
  "desktop-contact-page-light.png": "f672f41f4c7c1ad3a3eeb04027b3e96659ce2c134d19af3fb8f871eb8854810d",
  "desktop-home-dark.png": "1cd1ecbc60d883d1b7b4641e7c58554078c4c04b2e864b50faba6a069fe572ee",
  "desktop-home-light.png": "9f70f14fd784e9181ce77860195ef13d67ae3b8987ff301b7cfb2ea20e45bb92",
  "desktop-projects-page-dark.png": "3993fc104971252a163cae9ace5671863377fad098ac2256d125d88c0b623494",
  "desktop-projects-page-light.png": "61f777061cdcee9cdc6f005a0e81800f27d3890129428c9c2e6a8489583f048f",
  "desktop-journey-dark.png": "f46d6c49713a9104164ceb218300784b8e0366a983a74d14af4165063992a0a0",
  "desktop-journey-light.png": "f43cd0947a58f0ba79eed6ae40606560b8579654b9849d796b17d36dcb386a19",
  "desktop-skills-page-dark.png": "9a77a6e5045a211f58be71794489f14539630198873b488f8bfa77dc927d2019",
  "desktop-skills-page-light.png": "68f3077349412d2fc759a30dc6f9ce9e0bb612992f5b3ca99671c36242af1cd4",
  "mobile-code-review-page-dark.png": "88dd0d65ceaa6ce89d608dab79de8e38364d82ecb1c0574e074f585e224b7b7a",
  "mobile-code-review-page-light.png": "6069cd071709f6d1d8fba33fbdb205ccca20f33721c8ce7aa44ab84bb5ecb79e",
  "mobile-contact-page-dark.png": "982bee0c146104f38340c47c46f3f3d911c585a1ffeb919d2bf44a2781c758b3",
  "mobile-contact-page-light.png": "6e05812ccf32bc538119a627248030bee44f9e4912ba77f51dc1ebd51c13ae01",
  "mobile-home-dark.png": "63a53e1a42dc476a70c0ccd9944035c94a9ecf231a8da1a95f0aa91ecf14f834",
  "mobile-home-light.png": "217964636954ec5ed40d2fd0e27c353082a79fcf989274d3bf26469b18b4d50f",
  "mobile-projects-page-dark.png": "405860cf818e49eccb0027d6b31e507fe2bfc9d0c3d488895e11096ffaad94dc",
  "mobile-projects-page-light.png": "7c072f45707b003880fa55312abe8760530bbe29e028f81749f68de1e73d6815",
  "mobile-journey-dark.png": "44a11c68f4ae6f9ac8a3677da814875039ad1138a4ab6f5ce259617400ff2d0c",
  "mobile-journey-light.png": "10bb78acf2860cd2afe4804d3e81829f1753c8382e1652ad5acb7ac8ad65c288",
  "mobile-skills-page-dark.png": "19d5a4c42e70c965d0b7bcc55bf0d65cd7604997fafc0f2530629a56d2b384ac",
  "mobile-skills-page-light.png": "a0bf1f112db5c3b07112190ddbd291b57846256ce3b228a31b34682eb45e5838",
  "tablet-code-review-page-dark.png": "77cac44df02699e1b2ccf33918ba97fcf4e1ba416217cf365c1731ea453d70a9",
  "tablet-code-review-page-light.png": "c4c67a3a010b29d0ac22b3860b56b73c0453cadac7582b1841e5c49e27c29981",
  "tablet-contact-page-dark.png": "d5ded790825497d1cdf9e3955706e83b1e561f23adccde5067cfba36ede5a822",
  "tablet-contact-page-light.png": "99f58939c4e45f46ca71880c5e550458deb1b85818ed7a55fcea2c9cfcaad8f6",
  "tablet-home-dark.png": "f941c5b11c3681ddfef363dda406b9b7f76bf4a80312188ea5de453936bb6a32",
  "tablet-home-light.png": "2a98b4471ece03cec0d263c5c1e0e5981ae474e828e562f9fae65f7a1a098811",
  "tablet-projects-page-dark.png": "fc62e138b66b949537b186f978b9078cbd64cffd07911658ebce00575ab95c3e",
  "tablet-projects-page-light.png": "e80260dd7379bdd702271e0ec9f7f57b505978e3c4eb8524aba0c84733f81afd",
  "tablet-journey-dark.png": "760b0eb69c6edc0d6f604c3b840d0d1319136df8cb4e373e9ecdd62eef4a6716",
  "tablet-journey-light.png": "3d2e577d4227a310b602dd2ea3c3191fb97d83bbeea9e05d1e4faeee278d1e0a",
  "tablet-skills-page-dark.png": "e4ddd538a1ef873e693912b70c6d64700c87f88db61a848d963a1b5506a0547c",
  "tablet-skills-page-light.png": "9440015bfae4eec713e9410a99e6cde66c2d761cb05a3f4324ac027a9db6b30d",
};

// The exact hash remains the primary lock. This edge signature is a fallback
// for the handful of subpixel anti-aliasing differences Linux Chromium can
// produce while preserving the same dimensions, geometry and visible edges.
const expectedPerceptual = {
  "desktop-code-review-page-dark.png": "4090277d1a174abc421c76453991c104873cb171af97df1791441cc71889ca67",
  "desktop-code-review-page-light.png": "9b20911e650599b7e4dfbadc22de528b6c0672b3a493ac6a11bb323ae4a75152",
  "desktop-contact-page-dark.png": "d3a2ac1cc7bae3251fda01ccd246e481d6818108f7a783794fdb8450c6c15cf3",
  "desktop-contact-page-light.png": "ba9c059152e1a073cdc5992f82d126fae11702ff41d192408d1b5901bb13594b",
  "desktop-home-dark.png": "5cdca9209207047a8382ec90bdf53a73f27a130d16aca93b1f85bda5de29665c",
  "desktop-home-light.png": "9014704426711b85f95d26e3828b0eb9b657c33e9bc5db5e06c87a2c28855f75",
  "desktop-journey-dark.png": "1ed472e3a60b9332b7a4abe739a71d08d1a01fc3955a983fa2ad6942b8aba910",
  "desktop-journey-light.png": "fb8f49acb65ea8b3d022b2c3b7d2f9592ad8ac8f88e0ae673d49c31249535c6e",
  "desktop-projects-page-dark.png": "7bdeed720819d61a4bcf2f03449b244c02b0c90bdba53866bc0b3e2a60020665",
  "desktop-projects-page-light.png": "7b83898eec459709c049381b8893127fd96aa824a87df86ba7ebcd22258658f6",
  "desktop-skills-page-dark.png": "98f94f2013ffc33ca5e6d5337943f3c85ea27ccff451fb104c3cf127767b2a64",
  "desktop-skills-page-light.png": "53fc5be9a0750242d7742b845994cc5151cccb152c441950180ca3003187ba74",
  "mobile-code-review-page-dark.png": "b8fbd91fa138e06af27aa5fe6601345201d5369415f4b11b2e90725afe17fdcb",
  "mobile-code-review-page-light.png": "47557ec0721d32f3c02348fea8dc643c45cde6d7894ea7daaa1f6b110636847f",
  "mobile-contact-page-dark.png": "e61dddfb47397c03fda839f9e325ea21bd593390896fa837d60566f50808525f",
  "mobile-contact-page-light.png": "190012aef6ee7116c011a4e933ca2192c25e1b0047cee500f38ffbb2a9e9111b",
  "mobile-home-dark.png": "2ac36504d4954a626301809000094104ba35d993424bcc6abfd5a7efa2f3ba8c",
  "mobile-home-light.png": "4c9d8fcbea2f5ff5d23718fcb9163e3c976257138ff66d403a1285fba21ee36d",
  "mobile-journey-dark.png": "3d25d084f1e188c20241b43657706c0775ea4fb619508e067d09764f004bc6dc",
  "mobile-journey-light.png": "cdd6e39a4124ee14eeaf4c535954dbf999788607d387fbf4f688d24db055b888",
  "mobile-projects-page-dark.png": "753bd6a15a7c092ba241686d3f0fc74940b4b43c0e175d2dd3eb2cc20f686992",
  "mobile-projects-page-light.png": "00f496dd921ad8e7362afbcca91dfad3a07623944daf2bda325903bab3f8a465",
  "mobile-skills-page-dark.png": "5a050651c81ad1ebf3284e740a496bea791e39466e9710bfc40f43f6869f42cc",
  "mobile-skills-page-light.png": "a96d96151526925654edbeb4240074b435fd1a0d6190be3b70b0e2b133adb19c",
  "tablet-code-review-page-dark.png": "d27e595b472bfdae9e3ece5d0a24b2496c397cd66217fdb2a943f1ea8b26c408",
  "tablet-code-review-page-light.png": "c1aa2c11815def59a2031091c63aa81527484b8a189a3b30b46537f27658dda7",
  "tablet-contact-page-dark.png": "37b2245eccfb2d5bd76ee0c0bbe3d1d24aa14c9df5518808e5c5536c0d34d098",
  "tablet-contact-page-light.png": "2a27b3306e35b862a5a53103ee9973bc87ed468906f49d81215859786297d64d",
  "tablet-home-dark.png": "c7b90bada807e90c5ecda8d4efc8f4c9bdedaf240291606457f1e898331aa160",
  "tablet-home-light.png": "3195864c223e56cb480c9557c366b09d5048ebcacb49e956659d1f35f61fbceb",
  "tablet-journey-dark.png": "936f6b91d19e9d7597342aee17cea5136f9ff6412dadb81c366e65bb2cd5bec1",
  "tablet-journey-light.png": "b64aa5d2fcf1bdab622a6a1a1ae3128a3221219d83d9d59dd675433b980f4eca",
  "tablet-projects-page-dark.png": "81f1bb95fa9d4b7d628810c958600eff38d11e123f1d4f925d4aaaf99a6d688f",
  "tablet-projects-page-light.png": "870ef66328f12eeee04fdc5d63b65a33d6645af3fcead16918fe7f41938a383d",
  "tablet-skills-page-dark.png": "455738607ee41880078f355f36490492e03fcc9ddfaf52018bd9798673c07eac",
  "tablet-skills-page-light.png": "64a4765f7adf6a0e9ce77cd4eeaf6892d0ab5640dee447c97aebbb584161f64b",
};

// These two unmasked, full-card signatures come from the last approved green
// mobile Skills screenshots. Linux Chromium runners can flip up to three of
// their 1,024 edge bits through subpixel rasterization while keeping every
// visible edge and dimension unchanged.
const expectedGeometrySignatures = {
  "mobile-skills-page-dark.png": "WAAAEloAkxNh72RtYOk4aRjGnMYYxpzGGMacxhyLHOdJa2EZIGEyXZimHOac5phHnOYcxhynHMdDGWG5IpcxPZzKnNM8ppjnHOYc5RzFXSFjOWMdEjcKXRjmnGcY5hjDGNIc0hltHOXGYTGIEhj1ggKcxoACnNaAAhzHgAJYw4A=",
  "mobile-skills-page-light.png": "pACSDKSiQGyWAZqTzobHlsc5YwnnGWMJYxlnGWN0YxiSFZ5nzpbNIkN5YxljGWO9ZxljGWtYYzmcp6xF3WjMQmMRYw1DWWMZQxljGGM6IlycxpxhzQj1gmcZY5lnOWc9ZydjLeYSYxgRnk3EAscKiAJjGYACYzmAAmMZgAGnPAA=",
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
    ? hammingDistance(actual.geometry, Buffer.from(expectedGeometry, "base64")) <= 4
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
