import { createWriteStream, readFileSync } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

function loadDatabaseUrlFromDotEnv() {
  if (process.env.DATABASE_URL) return;
  const envFile = path.join(process.cwd(), ".env");
  try {
    const line = readFileSync(envFile, "utf8")
      .split(/\r?\n/)
      .find((value) => value.trim().startsWith("DATABASE_URL="));
    const value = line?.slice(line.indexOf("=") + 1).trim();
    if (value) process.env.DATABASE_URL = value.replace(/^([\"'])(.*)\1$/, "$2");
  } catch {
    return;
  }
}

function argumentValue(name: string) {
  const index = process.argv.findIndex((value) => value === name || value.startsWith(`${name}=`));
  if (index === -1) return undefined;
  return process.argv[index].includes("=") ? process.argv[index].slice(name.length + 1) : process.argv[index + 1];
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function databaseConnection() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL is required.");
  const url = new URL(rawUrl);
  return {
    host: url.hostname,
    port: url.port || "5432",
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")) || "postgres"
  };
}

async function commandExists(command: string) {
  return new Promise<boolean>((resolve) => {
    const child = spawn(command, ["--version"], { windowsHide: true });
    child.once("error", () => resolve(false));
    child.once("close", (code) => resolve(code === 0));
  });
}

async function main() {
  loadDatabaseUrlFromDotEnv();
  const connection = databaseConnection();
  const outputArgument = argumentValue("--output");
  const output = path.resolve(outputArgument || path.join(".local-backups", `beyblade-x-${timestamp()}.dump`));
  const force = process.argv.includes("--force");
  await mkdir(path.dirname(output), { recursive: true });

  try {
    await stat(output);
    if (!force) throw new Error(`Backup already exists: ${output}. Use --force to replace it.`);
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
  }

  const env = {
    ...process.env,
    PGHOST: connection.host,
    PGPORT: connection.port,
    PGUSER: connection.user,
    PGPASSWORD: connection.password
  };
  const pgDumpAvailable = await commandExists("pg_dump");
  const executable = pgDumpAvailable ? "pg_dump" : "docker";
  const args = pgDumpAvailable
    ? ["--format=custom", "--no-owner", "--no-privileges", "--dbname", connection.database]
    : [
        "exec",
        "-e", `PGPASSWORD=${connection.password}`,
        process.env.DATABASE_DOCKER_CONTAINER || "beyblade-x-postgres",
        "pg_dump",
        "--format=custom",
        "--no-owner",
        "--no-privileges",
        "--host", "localhost",
        "--port", connection.port,
        "--username", connection.user,
        "--dbname", connection.database
      ];

  const outputStream = createWriteStream(output, { flags: "w" });
  const outputFinished = new Promise<void>((resolve, reject) => {
    outputStream.once("error", reject);
    outputStream.once("finish", resolve);
  });
  const child = spawn(executable, args, { env, windowsHide: true });
  child.stdout.pipe(outputStream);
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  try {
    await new Promise<void>((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`pg_dump exited with code ${code}`)));
    });
    await outputFinished;
  } catch (error) {
    outputStream.destroy();
    await unlink(output).catch(() => undefined);
    throw error;
  }

  console.log(`Backup created: ${output}`);
}

main().catch((error) => {
  console.error("Database backup failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
