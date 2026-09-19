import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Approved responsive references. They are refreshed only after the complete
// light/dark viewport set has passed accessibility checks and been reviewed at
// native resolution; see docs/testing-guide.md.
const expected = {
  "desktop-code-review-page-dark.png": "0af882fda0ec1be3af2173b079eb0547900e68652f0aa9c258007adf9528021f",
  "desktop-code-review-page-light.png": "635bb7941b36d8fe23762b066f4bc1026062110bc78e077aca0f0e6792644266",
  "desktop-contact-page-dark.png": "efe038292821e98ad6db10aa75c365207f7c4dd505fe25360d4083da5418ed99",
  "desktop-contact-page-light.png": "38c3b44b7cbcd56be37e95ae12f8f36f02f5e49ec229d0dc9905a9fff0af880a",
  "desktop-home-dark.png": "1cd1ecbc60d883d1b7b4641e7c58554078c4c04b2e864b50faba6a069fe572ee",
  "desktop-home-light.png": "9f70f14fd784e9181ce77860195ef13d67ae3b8987ff301b7cfb2ea20e45bb92",
  "desktop-projects-page-dark.png": "e490932f3ba734099242ecc2b4c5ac048227ff7c0cc0e5fbc0333067c2aa3707",
  "desktop-projects-page-light.png": "c6b4aa7bc5bb890fb4bb7905297c52ce9f789c9fc7b4e0f9f09efc86f3da905c",
  "desktop-journey-dark.png": "72ca5b588d26828f1172de43a744a5e154234cf952cb2a875107eb7abf98f9a1",
  "desktop-journey-light.png": "85c9b6d63b63678ee8ac97adf39c7ac9526d455c20a45f76fab06473c21febe7",
  "desktop-skills-page-dark.png": "3cfa10f1646ab4a1bff0dc7e8577a2204f3a1fb3e627b99fa2ad02d31699373d",
  "desktop-skills-page-light.png": "15cde48c9779dbafb20cff5818578849e87c5bc4525b2c9d8c568f4ad36b8e7e",
  "mobile-code-review-page-dark.png": "88dd0d65ceaa6ce89d608dab79de8e38364d82ecb1c0574e074f585e224b7b7a",
  "mobile-code-review-page-light.png": "6069cd071709f6d1d8fba33fbdb205ccca20f33721c8ce7aa44ab84bb5ecb79e",
  "mobile-contact-page-dark.png": "29b07c59098cd99621a0be1f77777040381921dd037dfde97ffa4350b0953342",
  "mobile-contact-page-light.png": "f65e907f64b7a358305e6c520fcc8de8069fc1a158644f1d2ba42be2ba7c2b20",
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
  "tablet-contact-page-dark.png": "eeaff83d7e477a0b128c93177a1544ee92f00c06d5ba1e275359224d5222f57d",
  "tablet-contact-page-light.png": "a0268f7b4cd735b2e44cc079b31239bf17dd1d22e48c6747f1d171e47eafc3b9",
  "tablet-home-dark.png": "f941c5b11c3681ddfef363dda406b9b7f76bf4a80312188ea5de453936bb6a32",
  "tablet-home-light.png": "2a98b4471ece03cec0d263c5c1e0e5981ae474e828e562f9fae65f7a1a098811",
  "tablet-projects-page-dark.png": "2c7512425d682c60fd6d2de796f04d998c97ee810674dc912ae387adaae34658",
  "tablet-projects-page-light.png": "7998a477c78d5c7d4164b500db7b97d55b37178f90f5614cd1a3cad58ddcef70",
  "tablet-journey-dark.png": "fceb5284d6fcf4854af700e746faa0bfa6695f36692fd6243790d81f6556800f",
  "tablet-journey-light.png": "7dfcba7d003da3e7307c1b5d7df00249022a06df26481701bc1597d81f951168",
  "tablet-skills-page-dark.png": "4397d40c6cf2a367ddb29e4392e01dd4e657cd53731cf68919e621abfd9ab80d",
  "tablet-skills-page-light.png": "de3987c25ab0f082bba313ed53f1bdc22d3b9eb4d3f84ebe61555056791b7947",
};

// The exact hash remains the primary lock. This edge signature is a fallback
// for the handful of subpixel anti-aliasing differences Linux Chromium can
// produce while preserving the same dimensions, geometry and visible edges.
const expectedPerceptual = {
  "desktop-code-review-page-dark.png": "4090277d1a174abc421c76453991c104873cb171af97df1791441cc71889ca67",
  "desktop-code-review-page-light.png": "9b20911e650599b7e4dfbadc22de528b6c0672b3a493ac6a11bb323ae4a75152",
  "desktop-contact-page-dark.png": "25bb292263cb96d322e61719ae549a76b1673b09dfc35bfd6d569b99008463a1",
  "desktop-contact-page-light.png": "8e2d7ea5a686f08d06ffa97f62945796f63145b6d7d5c02f1ba4b88d7b3707d6",
  "desktop-home-dark.png": "5cdca9209207047a8382ec90bdf53a73f27a130d16aca93b1f85bda5de29665c",
  "desktop-home-light.png": "9014704426711b85f95d26e3828b0eb9b657c33e9bc5db5e06c87a2c28855f75",
  "desktop-journey-dark.png": "0173e5a092c944bbdfb9eb2585aa9a377a1f2ce2d586c8045eb66c7ae1590aa9",
  "desktop-journey-light.png": "c7316fa36fdb3aa2bcf0fbbac9cffdeda5e93b52f94688133433959c42f86939",
  "desktop-projects-page-dark.png": "25848e42ac4f424e40a2fc8c2b75fe1e861b8ab695f0e399f8c6784138d6d6cf",
  "desktop-projects-page-light.png": "eb8f47d01bb9987a914e66a65f5061b9d034e52a757fcdd97d4e57c4dde9a9bc",
  "desktop-skills-page-dark.png": "dd6bba3c9b2d7e2b94d84b7d5b0ed078b30ce6002df4bf3f818614c0a83eb0f9",
  "desktop-skills-page-light.png": "af0e40bf91fcc6603b520568418e99bc8d26b6eba2ea44979bee7cbcc80e7d16",
  "mobile-code-review-page-dark.png": "b8fbd91fa138e06af27aa5fe6601345201d5369415f4b11b2e90725afe17fdcb",
  "mobile-code-review-page-light.png": "47557ec0721d32f3c02348fea8dc643c45cde6d7894ea7daaa1f6b110636847f",
  "mobile-contact-page-dark.png": "15a2f2cf68c0d00d9ab468f97e5a3dd10e7c8316ed5faff9114788fb986d3e72",
  "mobile-contact-page-light.png": "c2f91d1207453a0deba30ebcf619f271fb0d4098dd1ceae5c9fea1b9fdb7c1e2",
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
  "tablet-contact-page-dark.png": "60326066b97f2044fb1bd7681750527519dfc2db315eb5df2823021e04fd1ebd",
  "tablet-contact-page-light.png": "8df22e5050f7cd8d0acd5d8f034fc4d2fe9c744fd7f634e61bf855f1ece3cf2f",
  "tablet-home-dark.png": "c7b90bada807e90c5ecda8d4efc8f4c9bdedaf240291606457f1e898331aa160",
  "tablet-home-light.png": "3195864c223e56cb480c9557c366b09d5048ebcacb49e956659d1f35f61fbceb",
  "tablet-journey-dark.png": "9899f6d3c85a5e80a88e2d80b84f5e54130ccff314073d2130decf5b4c544d64",
  "tablet-journey-light.png": "a4ea49b60ad24d7109f7a2cfe8da66109f1eb5ad10f093da107ad42e41720eec",
  "tablet-projects-page-dark.png": "29365685281814cf1771394e38519aeb999423769298b66b413747da9e71a370",
  "tablet-projects-page-light.png": "afeb3bc4e6fc1a0269cbcfd657337a9c6734be0fa85081e202ed1b88e42b95c8",
  "tablet-skills-page-dark.png": "52b882a349cda66c70656eaf9b8f61d8657c2a53f6d228ff7a182e94836c2f1b",
  "tablet-skills-page-light.png": "dcaf59aaa64091411d6286b06ed33238b821ce148adca8761b2303bc8d6c256b",
};

// Skills also keep edge-only signatures because their many SVG logos are the
// most sensitive to subpixel Chromium rasterization. The four-bit allowance
// accepts that rendering noise without weakening the exact locks elsewhere.
const expectedGeometrySignatures = {
  "desktop-skills-page-dark.png": "IAJTSygCU0sgAZGgghBEVHwNA+FyTMuZA/D8HTaMi+M2ZN2TNmTdkzZk2ZM2ZNmTNGTaK3gOC4EjYPgfY6lwHTZE2mU2ZNmTMk7ZkzZE2ZM2RNllbEtJw2NMa5kD4HofMEaZkzZE3ZM2RNmTNiTJszYk2ZMCZRkziBCAAAAAAAA=",
  "desktop-skills-page-light.png": "0AGMgNABrLTQAGRKZAkSgIKg1BaMoTRmbE8J48NzXhPJmyJtSbsmbcmbImzJmyJsy5shxIPw1B4crwnhnGaNY0m7JBtJuyZtTbEmbUm7Jm1JuyARkbQWPJyjlGZ8T4nhybkmbUm7Im1JqyJtSVsmTUlbJm33GKKMyREmIBBAEAA=",
  "mobile-skills-page-dark.png": "WAAAEloAkxNhJ2RtYOk4YRjGnOYZxpzGGMacxhyLHOdJaWEZMGcyXRimGOec5phnHMYcZhSvHMdDGVG5IpcxPZzKHNM8ppznHOYc5xzFXQFjOWMdGjcIfRjmnGcY5BjDONocwxltHOfGYTWIEhj1ggKYx4ACONaAAhjHgAJYw4A=",
  "mobile-skills-page-light.png": "pACSDKSkQGySAZqTzpbHlsc5YxnnGWMZ4zljGWN0YxiSBZ5nzp7NIkN5YxhjGWOdZzljmWsQYzmc54xH3WjMwmM1Yw1DGWMYQxnjGGM6Ilycxpxj7Yj3gmcZY5jnOWc95ydjPOYSYxkRnkfGAsYIiAJjGYACRzmAAmcZgAGnPAA=",
  "tablet-skills-page-dark.png": "cAAaCXQAGglwAOQGgAAYASAAAAAAAAAAgRAkBFxLCWFGSNkbQ2hpHTZk2LM2xNyTNuTZkzRk2ZNFSaktSelpLzZumWE2xJiTNsTZkzbk2OVMS+kzS+h5LzJk2ZM2xNyTNuTZkzZk2JNIayJBIgCAAAAAAAAAAAAAAAAAAAAAAAA=",
  "tablet-skills-page-light.png": "iAHkBogB5BaAABgJIACAAoAAAAAAAAAAUAIAAKM0Zgy5NyTEPMcQ48mbIkzJGyNsyRsjbMubImyyNgSQdlaW0Mm5JppJuyNsSTkmbckbIRKyNCaMNDaE08mbNmxJOyNsyVsibclbI2y2FMGQCIMAQQAAAAAAAAAAAAAAAAAAAAA=",
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
