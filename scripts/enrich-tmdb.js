#!/usr/bin/env node

/**
 * Enrich NoScroll expansion batch with TMDB IDs only.
 *
 * Defaults:
 *   input:  ./library_expansion_clean.json
 *   output: ./library_expansion_enriched.json
 *
 * Requires:
 *   TMDB_API_KEY environment variable
 *
 * Usage:
 *   $env:TMDB_API_KEY="cfff835ff23077aa9d1cdc290f77558b"
 *   node scripts/enrich-tmdb.js
 *
 * Optional:
 *   node scripts/enrich-tmdb.js path/to/input.json path/to/output.json
 */

const fs = require("fs");
const path = require("path");

const INPUT_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(process.cwd(), "library_expansion_clean.json");

const OUTPUT_PATH = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.resolve(process.cwd(), "library_expansion_enriched.json");

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie";

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

function extractYear(dateString) {
  if (!dateString || typeof dateString !== "string") return null;
  const match = dateString.match(/^(\d{4})-/);
  return match ? Number(match[1]) : null;
}

async function searchTmdb(query, year) {
  const url = new URL(TMDB_SEARCH_URL);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");

  if (Number.isInteger(year)) {
    url.searchParams.set("year", String(year));
  }

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`TMDB search failed (${response.status}) for query "${query}"`);
  }

  const data = await response.json();
  return Array.isArray(data?.results) ? data.results : [];
}

function scoreCandidate(candidate, entry, queryUsed) {
  let score = 0;

  const entryTitleKey = normalizeKey(entry.title);
  const entryOriginalTitleKey = normalizeKey(entry.originalTitle);
  const candidateTitleKey = normalizeKey(candidate.title);
  const candidateOriginalTitleKey = normalizeKey(candidate.original_title);

  const candidateYear = extractYear(candidate.release_date);
  const wantedYear = Number.isInteger(entry.year) ? entry.year : null;

  if (candidateTitleKey && candidateTitleKey === entryTitleKey) score += 60;
  if (candidateOriginalTitleKey && candidateOriginalTitleKey === entryTitleKey) score += 45;
  if (entryOriginalTitleKey && candidateTitleKey === entryOriginalTitleKey) score += 45;
  if (entryOriginalTitleKey && candidateOriginalTitleKey === entryOriginalTitleKey) score += 60;

  if (wantedYear && candidateYear) {
    const diff = Math.abs(wantedYear - candidateYear);
    if (diff === 0) score += 30;
    else if (diff === 1) score += 15;
    else if (diff === 2) score += 5;
    else score -= 20;
  }

  if (queryUsed === "title+year") score += 8;
  if (queryUsed === "originalTitle+year") score += 6;
  if (candidate.popularity && Number.isFinite(candidate.popularity)) {
    score += Math.min(candidate.popularity / 25, 8);
  }

  return score;
}

function chooseBestMatch(results, entry, queryUsed) {
  if (!results.length) return null;

  const scored = results
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, entry, queryUsed)
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const runnerUp = scored[1] || null;

  const confidence =
    best.score >= 80 ? "high" :
    best.score >= 55 ? "medium" :
    "low";

  const ambiguous = runnerUp ? best.score - runnerUp.score < 8 : false;

  return {
    candidate: best.candidate,
    score: best.score,
    confidence,
    ambiguous
  };
}

async function findBestTmdbMatch(entry) {
  const attempts = [];

  if (entry.title && entry.year) {
    attempts.push({
      label: "title+year",
      query: entry.title,
      year: entry.year
    });
  }

  if (entry.originalTitle && entry.year) {
    attempts.push({
      label: "originalTitle+year",
      query: entry.originalTitle,
      year: entry.year
    });
  }

  if (entry.title) {
    attempts.push({
      label: "title",
      query: entry.title,
      year: null
    });
  }

  if (entry.originalTitle) {
    attempts.push({
      label: "originalTitle",
      query: entry.originalTitle,
      year: null
    });
  }

  let bestOverall = null;

  for (const attempt of attempts) {
    const results = await searchTmdb(attempt.query, attempt.year);
    const bestForAttempt = chooseBestMatch(results, entry, attempt.label);

    if (!bestForAttempt) continue;

    const candidateBundle = {
      ...bestForAttempt,
      queryUsed: attempt.label
    };

    if (!bestOverall || candidateBundle.score > bestOverall.score) {
      bestOverall = candidateBundle;
    }

    if (
      candidateBundle.confidence === "high" &&
      !candidateBundle.ambiguous
    ) {
      return candidateBundle;
    }
  }

  return bestOverall;
}

async function main() {
  if (!TMDB_API_KEY) {
    fail("Missing TMDB_API_KEY environment variable.");
  }

  const entries = readJson(INPUT_PATH);

  if (!Array.isArray(entries)) {
    fail(`Input file must be a JSON array: ${INPUT_PATH}`);
  }

  const enriched = [];
  const unmatched = [];
  const review = [];

  console.log(`\nEnriching ${entries.length} entries from ${INPUT_PATH}\n`);

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const label = `${index + 1}/${entries.length} ${entry.title}${entry.year ? ` (${entry.year})` : ""}`;

    try {
      const match = await findBestTmdbMatch(entry);

      if (!match || !match.candidate || !match.candidate.id) {
        unmatched.push({
          title: entry.title,
          year: entry.year || null,
          reason: "No TMDB match found"
        });

        enriched.push({
          ...entry,
          tmdbId: null
        });

        console.log(`- ${label} -> no match`);
        continue;
      }

      const candidateYear = extractYear(match.candidate.release_date);

      const enrichedEntry = {
        ...entry,
        tmdbId: Number(match.candidate.id)
      };

      enriched.push(enrichedEntry);

      const needsReview =
        match.confidence !== "high" ||
        match.ambiguous ||
        (entry.year && candidateYear && Math.abs(entry.year - candidateYear) > 1);

      if (needsReview) {
        review.push({
          title: entry.title,
          year: entry.year || null,
          matchedTitle: match.candidate.title || null,
          matchedOriginalTitle: match.candidate.original_title || null,
          matchedYear: candidateYear,
          tmdbId: match.candidate.id,
          confidence: match.confidence,
          ambiguous: match.ambiguous,
          queryUsed: match.queryUsed,
          score: match.score
        });
      }

      console.log(
        `- ${label} -> tmdbId ${match.candidate.id} (${match.candidate.title || "unknown"}) [${match.confidence}${match.ambiguous ? ", review" : ""}]`
      );
    } catch (error) {
      unmatched.push({
        title: entry.title,
        year: entry.year || null,
        reason: error.message
      });

      enriched.push({
        ...entry,
        tmdbId: null
      });

      console.log(`- ${label} -> error: ${error.message}`);
    }
  }

  writeJson(OUTPUT_PATH, enriched);

  const reviewPath = OUTPUT_PATH.replace(/\.json$/i, ".review.json");
  const unmatchedPath = OUTPUT_PATH.replace(/\.json$/i, ".unmatched.json");

  writeJson(reviewPath, review);
  writeJson(unmatchedPath, unmatched);

  console.log(`\n✅ Wrote enriched file: ${OUTPUT_PATH}`);
  console.log(`🟡 Review file: ${reviewPath}`);
  console.log(`🔴 Unmatched file: ${unmatchedPath}\n`);
  console.log(`Matched with tmdbId: ${enriched.filter((x) => Number.isInteger(x.tmdbId)).length}`);
  console.log(`Needs review:        ${review.length}`);
  console.log(`Unmatched/errors:    ${unmatched.length}\n`);
}

main();