import { execFile as execFileCallback } from "node:child_process";
import { createWriteStream } from "node:fs";
import { access, writeFile } from "node:fs/promises";
import { mkdir, stat } from "node:fs/promises";
import { promisify } from "node:util";
import { type Response, Router } from "express";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { DATA_DIR } from "../paths.js";

const execFile = promisify(execFileCallback);
const UPSTREAM_BASE = "https://raw.githubusercontent.com/SwiftLaTeX/Texlive-Ondemand/master";
const SWIFTLATEX_DIR = path.join(DATA_DIR, "swiftlatex");
const PDFTEX_DIR = path.join(SWIFTLATEX_DIR, "pdftex", "10");
const FORMAT_PATH = path.join(PDFTEX_DIR, "swiftlatexpdftex.fmt");
const SAFE_FILENAME_RE = /^[A-Za-z0-9 _.\-]+$/;

function sanitizeFilename(filename: string): string | null {
  return SAFE_FILENAME_RE.test(filename) ? filename : null;
}

async function ensureFormatFile() {
  try {
    const info = await stat(FORMAT_PATH);
    if (info.size > 1_000_000) return;
  } catch {}

  await mkdir(PDFTEX_DIR, { recursive: true });
  const res = await fetch(`${UPSTREAM_BASE}/swiftlatexpdftex.fmt`);
  if (!res.ok || !res.body) {
    throw new Error(`failed to fetch swiftlatexpdftex.fmt: ${res.status} ${res.statusText}`);
  }
  await pipeline(res.body as any, createWriteStream(FORMAT_PATH));
}

async function findTexFile(filename: string): Promise<string | null> {
  const candidates = [filename];
  if (!filename.includes(".")) {
    candidates.push(`${filename}.tfm`, `${filename}.sty`, `${filename}.cls`, `${filename}.clo`, `${filename}.fd`, `${filename}.def`);
  }

  for (const candidate of candidates) {
    try {
      const { stdout } = await execFile("kpsewhich", [candidate]);
      const resolved = stdout.trim();
      if (!resolved) continue;
      await access(resolved);
      console.log("swiftlatex hit", filename, candidate, resolved);
      return resolved;
    } catch {}
  }

  console.log("swiftlatex miss", filename);
  return null;
}

async function sendResolvedFile(
  res: Response,
  filePath: string,
  headerName: "fileid" | "pkid",
) {
  res.setHeader("content-type", "application/octet-stream");
  res.setHeader(headerName, path.basename(filePath));
  res.setHeader("Access-Control-Expose-Headers", headerName);
  return res.sendFile(filePath);
}

export const swiftlatexRouter = Router();

swiftlatexRouter.post("/pdftex/10/swiftlatexpdftex.fmt", async (req, res) => {
  const body = req.body;
  if (!body || !(body instanceof Buffer)) {
    return res.status(400).json({ error: "expected raw binary body" });
  }

  const bytes = new Uint8Array(body);
  if (bytes.byteLength < 1_000_000) {
    return res.status(400).json({ error: "format file too small" });
  }

  await mkdir(PDFTEX_DIR, { recursive: true });
  await writeFile(FORMAT_PATH, bytes);
  return res.json({ ok: true, bytes: bytes.byteLength, path: FORMAT_PATH });
});

swiftlatexRouter.get("/pdftex/pk/:dpi/:filename", async (req, res) => {
  const filename = sanitizeFilename(req.params.filename);
  console.log("swiftlatex pk request", req.params.dpi, req.params.filename, filename);
  if (!filename) return res.status(301).send("File not found");

  const filePath = await findTexFile(filename);
  if (!filePath) return res.status(301).send("File not found");
  return sendResolvedFile(res, filePath, "pkid");
});

swiftlatexRouter.get("/pdftex/:fileformat/:filename", async (req, res) => {
  const filename = sanitizeFilename(req.params.filename);
  console.log("swiftlatex file request", req.params.fileformat, req.params.filename, filename);
  if (!filename) return res.status(301).send("File not found");

  if (filename === "swiftlatexpdftex.fmt") {
    await ensureFormatFile();
    return sendResolvedFile(res, FORMAT_PATH, "fileid");
  }

  const filePath = await findTexFile(filename);
  if (!filePath) return res.status(301).send("File not found");
  return sendResolvedFile(res, filePath, "fileid");
});
