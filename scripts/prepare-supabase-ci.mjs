import { createServer } from "node:net";
import { appendFile, cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, resolve } from "node:path";

const temporaryDirectory = process.env.RUNNER_TEMP;
const environmentFile = process.env.GITHUB_ENV;
if (!temporaryDirectory || !environmentFile || !isAbsolute(temporaryDirectory) || !isAbsolute(environmentFile)) {
  throw new Error("Supabase CI preparation requires absolute RUNNER_TEMP and GITHUB_ENV paths");
}

function setting(source, section, key, value) {
  let activeSection = "";
  let replacements = 0;
  const result = source.split("\n").map((line) => {
    const header = line.match(/^\s*\[([^\]]+)\]\s*(?:#.*)?$/);
    if (header) activeSection = header[1];
    if (activeSection === section && new RegExp(`^\\s*${key}\\s*=`).test(line)) {
      replacements += 1;
      return `${key} = ${JSON.stringify(value)}`;
    }
    return line;
  }).join("\n");
  if (replacements !== 1) throw new Error(`Expected one Supabase setting: ${section}.${key}`);
  return result;
}

const reservations = [];
try {
  // Keep all three listeners open until configuration is ready, ensuring
  // distinct ports and avoiding ports already owned by another local stack.
  for (let index = 0; index < 3; index += 1) {
    const server = createServer();
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "0.0.0.0", resolve);
    });
    reservations.push(server);
  }
  const [apiPort, databasePort, shadowPort] = reservations.map((server) => server.address().port);
  const workdir = await mkdtemp(join(temporaryDirectory, "portfolio-supabase-"));
  const sourceDirectory = resolve("supabase");
  const destination = join(workdir, "supabase");
  await mkdir(destination);
  const job = (process.env.GITHUB_JOB ?? "test").replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 12);
  const projectId = `portfolio-ci-${job}-${basename(workdir).slice(-6)}`;
  let config = await readFile(join(sourceDirectory, "config.toml"), "utf8");
  config = setting(config, "", "project_id", projectId);
  config = setting(config, "api", "port", apiPort);
  config = setting(config, "db", "port", databasePort);
  config = setting(config, "db", "shadow_port", shadowPort);
  // These UI/mail/edge/log services are not part of either job's tests.
  // API, Auth, Storage and the database retain their normal configuration.
  for (const section of ["studio", "inbucket", "analytics", "edge_runtime", "db.pooler"]) {
    config = setting(config, section, "enabled", false);
  }
  await writeFile(join(destination, "config.toml"), config);
  for (const name of ["migrations", "tests", "seed.sql"]) {
    await cp(join(sourceDirectory, name), join(destination, name), { recursive: true });
  }
  // Do not copy .temp: its linked-project metadata must never enter CI.
  await appendFile(environmentFile, `SUPABASE_CI_WORKDIR=${workdir}\n`);
  console.log(JSON.stringify({ projectId, workdir, apiPort, databasePort, shadowPort }));
} finally {
  await Promise.all(reservations.map((server) => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  })));
}
