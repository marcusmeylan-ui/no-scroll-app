#!/usr/bin/env node

/**
 * Merge live NoScroll library with ready expansion batch.
 *
 * Defaults:
 *   live library:  ./movies.json
 *   additions:     ./library_expansion_ready.json
 *   output:        ./movies.merged.json
 *
 * Usage:
 *   node scripts/merge-library.js
 *   node scripts/merge-library.js path/to/movies.json path/to/additions.json path/to/output.json
 */

const fs = require("fs");
const path = require("path");

const LIVE_LIBRARY_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(process.cwd(), "movies.json");

const ADDITIONS_PATH = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.resolve(process.cwd(), "library_expansion_ready.json");

const OUTPUT_PATH = process.argv[4]
  ? path.resolve(process.argv[4])
  : path.resolve(process.cwd(), "movies.merged.json");

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Could not read or parse JSON: ${filePath}\n${error.message}`);
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizeWhitespace(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizePunctuation(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[“”]/g, '"');
}

function normalizeKey(value) {
  return normalizePunctuation(value).replace(/[^a-z0-9]/g, "");
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildTitleYearKey(title, year) {
  const titleKey = normalizeKey(title);
  return titleKey && Number.isInteger(year) ? `${titleKey}__${year}` : "";
}

function main() {
  const liveMovies = readJson(LIVE_LIBRARY_PATH);
  const additions = readJson(ADDITIONS_PATH);

  if (!Array.isArray(liveMovies)) {
    fail(`Live library must be a JSON array: ${LIVE_LIBRARY_PATH}`);
  }

  if (!Array.isArray(additions)) {
    fail(`Additions file must be a JSON array: ${ADDITIONS_PATH}`);
  }

  const seenIds = new Set();
  const seenTitleYears = new Set();
  const merged = [];

  for (const movie of liveMovies) {
    if (!isPlainObject(movie)) continue;
    merged.push(movie);

    if (Number.isInteger(movie.id)) {
      seenIds.add(movie.id);
    }

    const key = buildTitleYearKey(movie.title, movie.year);
    if (key) seenTitleYears.add(key);
  }

  const skipped = [];

  for (const movie of additions) {
    if (!isPlainObject(movie)) {
      skipped.push({ title: "<invalid object>", reason: "Not a valid object" });
      continue;
    }

    if (!Number.isInteger(movie.id)) {
      skipped.push({ title: movie.title || "<missing title>", reason: "Missing integer id" });
      continue;
    }

    if (seenIds.has(movie.id)) {
      skipped.push({ title: movie.title || "<missing title>", reason: `Duplicate id ${movie.id}` });
      continue;
    }

    const key = buildTitleYearKey(movie.title, movie.year);
    if (key && seenTitleYears.has(key)) {
      skipped.push({
        title: movie.title || "<missing title>",
        year: movie.year || null,
        reason: "Duplicate title+year against merged library"
      });
      continue;
    }

    merged.push(movie);
    seenIds.add(movie.id);
    if (key) seenTitleYears.add(key);
  }

  merged.sort((a, b) => {
    const aId = Number.isInteger(a.id) ? a.id : Number.MAX_SAFE_INTEGER;
    const bId = Number.isInteger(b.id) ? b.id : Number.MAX_SAFE_INTEGER;
    return aId - bId;
  });

  writeJson(OUTPUT_PATH, merged);

  console.log(`\nLive library entries: ${liveMovies.length}`);
  console.log(`Additions read:       ${additions.length}`);
  console.log(`Merged total:         ${merged.length}`);
  console.log(`Skipped on merge:     ${skipped.length}`);
  console.log(`✅ Wrote merged file: ${OUTPUT_PATH}\n`);

  if (skipped.length > 0) {
    console.log("Skipped entries:");
    for (const item of skipped) {
      const yearLabel = item.year ? ` (${item.year})` : "";
      console.log(`- ${item.title}${yearLabel} -> ${item.reason}`);
    }
    console.log("");
  }
}

main();