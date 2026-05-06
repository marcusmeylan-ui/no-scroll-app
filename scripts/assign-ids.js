#!/usr/bin/env node

/**
 * Assign sequential IDs to poster-enriched NoScroll expansion entries.
 *
 * Defaults:
 *   live library:  ./movies.json
 *   input:         ./library_expansion_posters.json
 *   output:        ./library_expansion_ready.json
 *
 * Usage:
 *   node scripts/assign-ids.js
 *   node scripts/assign-ids.js path/to/movies.json path/to/input.json path/to/output.json
 */

const fs = require("fs");
const path = require("path");

const LIVE_LIBRARY_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(process.cwd(), "movies.json");

const INPUT_PATH = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.resolve(process.cwd(), "library_expansion_posters.json");

const OUTPUT_PATH = process.argv[4]
  ? path.resolve(process.argv[4])
  : path.resolve(process.cwd(), "library_expansion_ready.json");

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

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getMaxId(liveMovies) {
  let maxId = 0;

  for (const movie of liveMovies) {
    if (!isPlainObject(movie)) continue;
    if (Number.isInteger(movie.id) && movie.id > maxId) {
      maxId = movie.id;
    }
  }

  return maxId;
}

function normalizeReadyEntry(entry, assignedId) {
  return {
    id: assignedId,
    title: typeof entry.title === "string" ? entry.title : "",
    genre: typeof entry.genre === "string" ? entry.genre : "",
    tone: typeof entry.tone === "string" ? entry.tone : "",
    streaming: Array.isArray(entry.streaming) ? entry.streaming : [],
    poster: typeof entry.poster === "string" ? entry.poster : "",
    energy: typeof entry.energy === "string" ? entry.energy : "medium",
    weight: typeof entry.weight === "string" ? entry.weight : "balanced",
    style: typeof entry.style === "string" ? entry.style : "grounded",
    humor: typeof entry.humor === "string" ? entry.humor : "low",
    tmdbId: Number.isInteger(entry.tmdbId) ? entry.tmdbId : null,
    year: Number.isInteger(entry.year) ? entry.year : null,
    ...(typeof entry.originalTitle === "string" && entry.originalTitle.trim() !== ""
      ? { originalTitle: entry.originalTitle }
      : {}),
    ukProviders: Array.isArray(entry.ukProviders) ? entry.ukProviders : [],
    ukProviderLabels: Array.isArray(entry.ukProviderLabels) ? entry.ukProviderLabels : [],
    ukAvailabilitySource:
      typeof entry.ukAvailabilitySource === "string" ? entry.ukAvailabilitySource : "none"
  };
}

function main() {
  const liveMovies = readJson(LIVE_LIBRARY_PATH);
  const entries = readJson(INPUT_PATH);

  if (!Array.isArray(liveMovies)) {
    fail(`Live library must be a JSON array: ${LIVE_LIBRARY_PATH}`);
  }

  if (!Array.isArray(entries)) {
    fail(`Input file must be a JSON array: ${INPUT_PATH}`);
  }

  const maxId = getMaxId(liveMovies);
  let nextId = maxId + 1;

  const ready = entries.map((entry) => {
    const normalized = normalizeReadyEntry(entry, nextId);
    nextId += 1;
    return normalized;
  });

  writeJson(OUTPUT_PATH, ready);

  console.log(`\nLive library max ID: ${maxId}`);
  console.log(`Entries assigned:    ${ready.length}`);
  console.log(`First new ID:        ${ready[0]?.id ?? "n/a"}`);
  console.log(`Last new ID:         ${ready[ready.length - 1]?.id ?? "n/a"}`);
  console.log(`✅ Wrote ready file: ${OUTPUT_PATH}\n`);
}

main();