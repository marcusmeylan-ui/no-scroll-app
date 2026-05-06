#!/usr/bin/env node

/**
 * Generate poster URLs for NoScroll expansion entries using TMDB IDs.
 *
 * Defaults:
 *   input:  ./library_expansion_enriched.json
 *   output: ./library_expansion_posters.json
 *
 * Requires:
 *   TMDB_API_KEY environment variable
 *
 * Usage:
 *   $env:TMDB_API_KEY="your_key_here"
 *   node scripts/generate-posters.js
 *
 * Optional:
 *   node scripts/generate-posters.js path/to/input.json path/to/output.json
 */

const fs = require("fs");
const path = require("path");

const INPUT_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(process.cwd(), "library_expansion_enriched.json");

const OUTPUT_PATH = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.resolve(process.cwd(), "library_expansion_posters.json");

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_MOVIE_URL_BASE = "https://api.themoviedb.org/3/movie";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

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

async function fetchMovieDetails(tmdbId) {
  const url = new URL(`${TMDB_MOVIE_URL_BASE}/${encodeURIComponent(String(tmdbId))}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "en-US");

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`TMDB movie lookup failed (${response.status}) for tmdbId ${tmdbId}`);
  }

  return response.json();
}

function buildPosterUrl(posterPath) {
  if (!posterPath || typeof posterPath !== "string") return "";
  return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
}

async function main() {
  if (!TMDB_API_KEY) {
    fail("Missing TMDB_API_KEY environment variable.");
  }

  const entries = readJson(INPUT_PATH);

  if (!Array.isArray(entries)) {
    fail(`Input file must be a JSON array: ${INPUT_PATH}`);
  }

  const output = [];
  const noTmdbId = [];
  const noPoster = [];
  const lookupErrors = [];

  console.log(`\nGenerating posters for ${entries.length} entries from ${INPUT_PATH}\n`);

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const label = `${index + 1}/${entries.length} ${entry.title}${entry.year ? ` (${entry.year})` : ""}`;

    if (!Number.isInteger(entry.tmdbId)) {
      noTmdbId.push({
        title: entry.title || null,
        year: entry.year || null,
        reason: "Missing tmdbId"
      });

      output.push({
        ...entry,
        poster: typeof entry.poster === "string" ? entry.poster : ""
      });

      console.log(`- ${label} -> skipped (no tmdbId)`);
      continue;
    }

    try {
      const details = await fetchMovieDetails(entry.tmdbId);
      const posterUrl = buildPosterUrl(details?.poster_path);

      if (!posterUrl) {
        noPoster.push({
          title: entry.title || null,
          year: entry.year || null,
          tmdbId: entry.tmdbId,
          reason: "No poster_path returned by TMDB"
        });

        output.push({
          ...entry,
          poster: ""
        });

        console.log(`- ${label} -> no poster found`);
        continue;
      }

      output.push({
        ...entry,
        poster: posterUrl
      });

      console.log(`- ${label} -> poster set`);
    } catch (error) {
      lookupErrors.push({
        title: entry.title || null,
        year: entry.year || null,
        tmdbId: entry.tmdbId || null,
        reason: error.message
      });

      output.push({
        ...entry,
        poster: typeof entry.poster === "string" ? entry.poster : ""
      });

      console.log(`- ${label} -> error: ${error.message}`);
    }
  }

  writeJson(OUTPUT_PATH, output);

  const noPosterPath = OUTPUT_PATH.replace(/\.json$/i, ".no-poster.json");
  const errorsPath = OUTPUT_PATH.replace(/\.json$/i, ".errors.json");
  const noTmdbIdPath = OUTPUT_PATH.replace(/\.json$/i, ".missing-tmdb.json");

  writeJson(noPosterPath, noPoster);
  writeJson(errorsPath, lookupErrors);
  writeJson(noTmdbIdPath, noTmdbId);

  console.log(`\n✅ Wrote poster-enriched file: ${OUTPUT_PATH}`);
  console.log(`🟡 No-poster file: ${noPosterPath}`);
  console.log(`🔴 Error file: ${errorsPath}`);
  console.log(`⚪ Missing-tmdb file: ${noTmdbIdPath}\n`);
  console.log(`Poster URLs set: ${output.filter((x) => typeof x.poster === "string" && x.poster.trim() !== "").length}`);
  console.log(`No poster found: ${noPoster.length}`);
  console.log(`Lookup errors:   ${lookupErrors.length}`);
  console.log(`Missing tmdbId:  ${noTmdbId.length}\n`);
}

main();