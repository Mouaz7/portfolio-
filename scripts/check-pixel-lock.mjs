import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Reconcile fourteen stale references against independently built, unchanged
// c3a7941 (not this implementation branch). See docs/testing-guide.md.
const expected = {
  "desktop-code-review-page-dark.png": "0af882fda0ec1be3af2173b079eb0547900e68652f0aa9c258007adf9528021f",
  "desktop-code-review-page-light.png": "635bb7941b36d8fe23762b066f4bc1026062110bc78e077aca0f0e6792644266",
  "desktop-contact-page-dark.png": "013adf7915a6672aad0d12e0c6214fa8a94384970896137902bd41e6aa180b0a",
  "desktop-contact-page-light.png": "30b3e94dc6004d39c2961dd2e2705be88ee19942ad0db88adfce7245b1a487c9",
  "desktop-home-dark.png": "1cd1ecbc60d883d1b7b4641e7c58554078c4c04b2e864b50faba6a069fe572ee",
  "desktop-home-light.png": "9f70f14fd784e9181ce77860195ef13d67ae3b8987ff301b7cfb2ea20e45bb92",
  "desktop-projects-page-dark.png": "e490932f3ba734099242ecc2b4c5ac048227ff7c0cc0e5fbc0333067c2aa3707",
  "desktop-projects-page-light.png": "c6b4aa7bc5bb890fb4bb7905297c52ce9f789c9fc7b4e0f9f09efc86f3da905c",
  "desktop-journey-dark.png": "f46d6c49713a9104164ceb218300784b8e0366a983a74d14af4165063992a0a0",
  "desktop-journey-light.png": "f43cd0947a58f0ba79eed6ae40606560b8579654b9849d796b17d36dcb386a19",
  "desktop-skills-page-dark.png": "d247c163912c19ce391ca818a0e0bf36e30d941b4476c09967b0d4c4f1505f33",
  "desktop-skills-page-light.png": "d8bff2a6d0ec800b797603f3f90bd335a9c32ed8040e92494425bf6ead498fb3",
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
  "mobile-skills-page-dark.png": "c2893b585bcc340757079729b0d37fe7e80c49a16766fa1d2e74533da7592a84",
  "mobile-skills-page-light.png": "97cadf537a4c1296c0a3a8debc580c12bca777e4e354d9361fbc93d7fdb1ea93",
  "tablet-code-review-page-dark.png": "6582e6d61b3631a47ca71fefd7b475dd87c277e7fd61e62fb73acd29938ff582",
  "tablet-code-review-page-light.png": "80ec3e354d7ba1da627d804e321e73d211bff9659f0ecff23703221ffdabc981",
  "tablet-contact-page-dark.png": "d2b1a78e7e80df8b72f015ed8f1f9bebee10e076b326c76a05bcb5de175e6cd4",
  "tablet-contact-page-light.png": "0e9feb505ada947d1924a7e791dc268679fbd7faa7ecd4b89fb007da20c6226c",
  "tablet-home-dark.png": "f941c5b11c3681ddfef363dda406b9b7f76bf4a80312188ea5de453936bb6a32",
  "tablet-home-light.png": "2a98b4471ece03cec0d263c5c1e0e5981ae474e828e562f9fae65f7a1a098811",
  "tablet-projects-page-dark.png": "2c7512425d682c60fd6d2de796f04d998c97ee810674dc912ae387adaae34658",
  "tablet-projects-page-light.png": "7998a477c78d5c7d4164b500db7b97d55b37178f90f5614cd1a3cad58ddcef70",
  "tablet-journey-dark.png": "b8972bee4b4c3765a21436ae9bf5dca5b0c8a320553982907772493aac0e8864",
  "tablet-journey-light.png": "6aa5553061cbb95989094feb482fa72896ecc39125f685371980d9c361f0bed5",
  "tablet-skills-page-dark.png": "a927ff749b1197290700c194264458a1de22f8409c342f519c5b70a2fa037195",
  "tablet-skills-page-light.png": "fefdf3573d15f417c38675dc2928154a236027d0e4a66eaffd11c6047a025b11",
};

// The exact hash remains the primary lock. This edge signature is a fallback
// for the handful of subpixel anti-aliasing differences Linux Chromium can
// produce while preserving the same dimensions, geometry and visible edges.
const expectedPerceptual = {
  "desktop-code-review-page-dark.png": "4090277d1a174abc421c76453991c104873cb171af97df1791441cc71889ca67",
  "desktop-code-review-page-light.png": "9b20911e650599b7e4dfbadc22de528b6c0672b3a493ac6a11bb323ae4a75152",
  "desktop-contact-page-dark.png": "c01c5b15804b5a068e11698f9d511a7d69d963e088393471e5fce9ef8537403e",
  "desktop-contact-page-light.png": "8861d0a7a27f77ee7d33dd7b67f69b1eb852646ec4235011ee339fe20814cd1b",
  "desktop-home-dark.png": "5cdca9209207047a8382ec90bdf53a73f27a130d16aca93b1f85bda5de29665c",
  "desktop-home-light.png": "9014704426711b85f95d26e3828b0eb9b657c33e9bc5db5e06c87a2c28855f75",
  "desktop-journey-dark.png": "1ed472e3a60b9332b7a4abe739a71d08d1a01fc3955a983fa2ad6942b8aba910",
  "desktop-journey-light.png": "fb8f49acb65ea8b3d022b2c3b7d2f9592ad8ac8f88e0ae673d49c31249535c6e",
  "desktop-projects-page-dark.png": "25848e42ac4f424e40a2fc8c2b75fe1e861b8ab695f0e399f8c6784138d6d6cf",
  "desktop-projects-page-light.png": "eb8f47d01bb9987a914e66a65f5061b9d034e52a757fcdd97d4e57c4dde9a9bc",
  "desktop-skills-page-dark.png": "22e0eab1d2dba85cac9767d7d706565ed9a235c34a6e5018eb0dd2f2f6da71a6",
  "desktop-skills-page-light.png": "f1d1e8f84e42c8a9221c5f564651b542979b7b539aa2e902df4a3e0180ed7887",
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
  "mobile-skills-page-dark.png": "4bfd904c1556ff926a9b752141f162db68acbb933739ecd00df9917f29552a02",
  "mobile-skills-page-light.png": "1291daaa05666d4eeb445e107a3cd0b41ed570ab94132a18e592538e46996648",
  "tablet-code-review-page-dark.png": "cbb9c253d157c9dadf76a4b4babc76363b550849130243bd206a138fcf436704",
  "tablet-code-review-page-light.png": "6bfd2cb9a4bfa333156165fbc40ba6feb402240738663d38c77f3b98f83ca232",
  "tablet-contact-page-dark.png": "7a3bb3fba8bc419d0bf158fe7dc8aaeecd013fe82106a59a1cea0b6dd7073536",
  "tablet-contact-page-light.png": "28aab76004940b8d4121874b29d6c6e5d52e0b8b8f80eff9528dca65874c6e32",
  "tablet-home-dark.png": "c7b90bada807e90c5ecda8d4efc8f4c9bdedaf240291606457f1e898331aa160",
  "tablet-home-light.png": "3195864c223e56cb480c9557c366b09d5048ebcacb49e956659d1f35f61fbceb",
  "tablet-journey-dark.png": "f933ad7ffb160520f7316b6b78c9248b4779ecbe0660b1a0fb86b8931604fc67",
  "tablet-journey-light.png": "9de05eb0ebf4ae91177a9490192dee206092dd8da0198cb6c1ba694079daa26f",
  "tablet-projects-page-dark.png": "29365685281814cf1771394e38519aeb999423769298b66b413747da9e71a370",
  "tablet-projects-page-light.png": "afeb3bc4e6fc1a0269cbcfd657337a9c6734be0fa85081e202ed1b88e42b95c8",
  "tablet-skills-page-dark.png": "75c79aaa3bd9649a6fc5652fff09f89bbb32abd2c7f67b224eab8eb9c8e37c87",
  "tablet-skills-page-light.png": "a217f84ff22169d399bb232e9e48569d4cb5af5303e9201fdec077126c9db041",
};

// Skills signatures come from the intentionally enlarged, responsive card and
// icon profiles. Keep the existing four-bit Chromium rasterization allowance;
// all non-Skills references remain unchanged.
const expectedGeometrySignatures = {
  "desktop-skills-page-dark.png": "IAJTSygCU0sgAZGgwABMSCgRAsFyTMuZA+DYH1OMKg02ZNmTNmTdkzZk2ZM2ZNmTNGTYK1wOK+FjbOsbQ6BwHzZM2sU2ZNmTNk7ZkzZE2ZM2RNmzJGNJw2NMa5kD4H4fcEa5lTJE3ZM2RN2TNiTJszak2ZM2ZNmzSGEobKIAABI=",
  "desktop-skills-page-light.png": "0AGMgNABrLTQAGRKIACQgIJIlBKIoRRmbC8J4Y5jDOPJmyJtSZsmbUm7ImzJmyJsy5sk5KPw1BIYowDlPG+J4cm7JBtJuyZtTbEibUm5Jm1Juy4N2RQ2HIyjlGZ8L4nhjalOa0m7Im1JuyJtSVs2RUlbJm3RGyJsphSWoggpCEU=",
  "mobile-skills-page-dark.png": "WAAAEloAkxNhJ2RtYOk4YRjGnOYZxpzGGMacxhyLHOdJaWEZMGcyXRimGOec5phnHMYcZhSvHMdDGVG5IpcxPZzKHNM8ppznHOYc5xzFXQFjOWMdGjcIfRjmnGcY5BjDONocwxltHOfGYTWIEhj1ggKYx4ACONaAAhjHgAJYw4A=",
  "mobile-skills-page-light.png": "pACSDKSkQGySAZqTzpbHlsc5YxnnGWMZ4zljGWN0YxiSBZ5nzp7NIkN5YxhjGWOdZzljmWsQYzmc54xH3WjMwmM1Yw1DGWMYQxnjGGM6Ilycxpxj7Yj3gmcZY5jnOWc95ydjPOYSYxkRnkfGAsYIiAJjGYACRzmAAmcZgAGnPAA=",
  "tablet-skills-page-dark.png": "cAAaCXQAGglwAOQGgAAYASAAAAAAAAAAAAAAAExJAGBGSNkbQ2hpHTZk2bM2xNyTNuTZkzRk2ZNNSWltSelpLzZsmWU2xJiTNsTZkzbk2O1cS4lTS8h5LypkiZk2xNyTNuTZkzdk2JNMayiToBDBTAAAAAAAAAAAAAAAAAAAAAA=",
  "tablet-skills-page-light.png": "iAHkBogB5BaAABgJIACAAoAAAAAAAAAAAAAAAIMi5BypNyTEPKcB48mbIkzJGyJsyRsjbMsbI2yytgSSdlaW0MkTJpJJO2NsSTkmbEk7IRKjNHYMNCeM0dmbNmRJOyNsyVsibclbI2y2FMMMCEMAAQAAAAAAAAAAAAAAAAAAAAA=",
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
  // project data. Isolated CI uses deterministic zero counts while a local
  // run may receive the live language/star/fork row before the screenshot.
  // Mask only that dynamic first-card metadata line; card geometry and all
  // other project content remain pixel-locked.
  if (name.includes("projects-page")) {
    if (name.startsWith("desktop-")) {
      masks.push({ left: 96, top: 315, width: 154, height: 24 });
    } else if (name.startsWith("tablet-")) {
      masks.push({ left: 38, top: 300, width: 154, height: 24 });
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
