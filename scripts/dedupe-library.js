#!/usr/bin/env node

/**
 * Dedupe stage additions against live NoScroll library.
 *
 * Defaults:
 *   live library:  ./movies.json
 *   stage file:    ./library_expansion_stage.json
 *   output file:   ./library_expansion_clean.json
 *
 * Usage:
 *   node scripts/dedupe-library.js
 *   node scripts/dedupe-library.js path/to/movies.json path/to/stage.json path/to/output.json
 */

const fs = require("fs");
const path = require("path");

const LIVE_LIBRARY_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(process.cwd(), "movies.json");

const STAGE_PATH = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.resolve(process.cwd(), "library_expansion_stage.json");

const OUTPUT_PATH = process.argv[4]
  ? path.resolve(process.argv[4])
  : path.resolve(process.cwd(), "library_expansion_clean.json");

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
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

function buildTitleKey(title) {
  return normalizeKey(title);
}

function buildTitleYearKey(title, year) {
  const titleKey = buildTitleKey(title);
  return titleKey && Number.isInteger(year) ? `${titleKey}__${year}` : "";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function indexLiveLibrary(liveMovies) {
  const index = {
    titleKeys: new Map(),
    titleYearKeys: new Map(),
    originalTitleKeys: new Map(),
    originalTitleYearKeys: new Map()
  };

  for (const movie of liveMovies) {
    if (!isPlainObject(movie)) continue;

    const titleKey = buildTitleKey(movie.title);
    const titleYearKey = buildTitleYearKey(movie.title, movie.year);
    const originalTitleKey = buildTitleKey(movie.originalTitle);
    const originalTitleYearKey = buildTitleYearKey(movie.originalTitle, movie.year);

    if (titleKey) index.titleKeys.set(titleKey, movie);
    if (titleYearKey) index.titleYearKeys.set(titleYearKey, movie);

    // secondary only — the live library has some bad originalTitle values
    if (originalTitleKey) index.originalTitleKeys.set(originalTitleKey, movie);
    if (originalTitleYearKey) index.originalTitleYearKeys.set(originalTitleYearKey, movie);
  }

  return index;
}

function describeMatch(movie) {
  return `${movie.title || "<unknown title>"}${movie.year ? ` (${movie.year})` : ""}`;
}

function main() {
  const liveMovies = readJson(LIVE_LIBRARY_PATH);
  const stageMovies = readJson(STAGE_PATH);

  if (!Array.isArray(liveMovies)) {
    fail(`Live library must be a JSON array: ${LIVE_LIBRARY_PATH}`);
  }

  if (!Array.isArray(stageMovies)) {
    fail(`Stage file must be a JSON array: ${STAGE_PATH}`);
  }

  const liveIndex = indexLiveLibrary(liveMovies);

  const clean = [];
  const removed = [];
  const stageSeenTitleYear = new Set();
  const stageSeenTitle = new Set();

  for (const entry of stageMovies) {
    if (!isPlainObject(entry)) {
      removed.push({
        title: "<invalid object>",
        reason: "Not a valid object"
      });
      continue;
    }

    const titleKey = buildTitleKey(entry.title);
    const titleYearKey = buildTitleYearKey(entry.title, entry.year);
    const originalTitleKey = buildTitleKey(entry.originalTitle);
    const originalTitleYearKey = buildTitleYearKey(entry.originalTitle, entry.year);

    let removeReason = "";

    // strongest signals first
    if (titleYearKey && liveIndex.titleYearKeys.has(titleYearKey)) {
      removeReason = `Live library already contains title+year match: ${describeMatch(liveIndex.titleYearKeys.get(titleYearKey))}`;
    } else if (titleKey && liveIndex.titleKeys.has(titleKey)) {
      removeReason = `Live library already contains title match: ${describeMatch(liveIndex.titleKeys.get(titleKey))}`;
    }

    // stage internal duplicates
    if (!removeReason && titleYearKey && stageSeenTitleYear.has(titleYearKey)) {
      removeReason = "Duplicate inside stage file by title+year";
    } else if (!removeReason && titleKey && stageSeenTitle.has(titleKey)) {
      removeReason = "Duplicate inside stage file by title";
    }

    // secondary originalTitle checks — conservative only
    if (!removeReason && originalTitleYearKey && liveIndex.originalTitleYearKeys.has(originalTitleYearKey)) {
      removeReason = `Possible live originalTitle+year collision: ${describeMatch(liveIndex.originalTitleYearKeys.get(originalTitleYearKey))}`;
    } else if (!removeReason && originalTitleKey && liveIndex.titleKeys.has(originalTitleKey)) {
      removeReason = `Possible alias collision: stage originalTitle matches live title: ${describeMatch(liveIndex.titleKeys.get(originalTitleKey))}`;
    } else if (!removeReason && titleKey && liveIndex.originalTitleKeys.has(titleKey)) {
      removeReason = `Possible alias collision: stage title matches live originalTitle: ${describeMatch(liveIndex.originalTitleKeys.get(titleKey))}`;
    }

    if (removeReason) {
      removed.push({
        title: entry.title || "<missing title>",
        year: entry.year || null,
        reason: removeReason
      });
      continue;
    }

    clean.push(entry);

    if (titleYearKey) stageSeenTitleYear.add(titleYearKey);
    if (titleKey) stageSeenTitle.add(titleKey);
  }

  writeJson(OUTPUT_PATH, clean);

  console.log(`\nLive library entries: ${liveMovies.length}`);
  console.log(`Stage entries read:   ${stageMovies.length}`);
  console.log(`Entries kept:         ${clean.length}`);
  console.log(`Entries removed:      ${removed.length}\n`);

  if (removed.length > 0) {
    console.log("Removed entries:");
    for (const item of removed) {
      const yearLabel = item.year ? ` (${item.year})` : "";
      console.log(`- ${item.title}${yearLabel} -> ${item.reason}`);
    }
    console.log("");
  }

  console.log(`✅ Wrote clean stage file: ${OUTPUT_PATH}\n`);
}

main();