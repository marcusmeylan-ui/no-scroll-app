// provider-recovery.js
//
// Re-checks TMDB UK watch providers for films currently marked:
// ukAvailabilitySource === "tmdb-none"
//
// Outputs:
// - provider-recovery-results.json
// - provider-recovery-updated.json
//
// Usage:
// $env:TMDB_API_KEY="YOUR_KEY"
// node provider-recovery.js

const fs = require("fs");

const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.error("Missing TMDB_API_KEY");
  process.exit(1);
}

const INPUT_FILE = "./movies.json";
const OUTPUT_FILE = "./provider-recovery-updated.json";
const REPORT_FILE = "./provider-recovery-results.json";

const SUPPORTED_PROVIDERS = {
  8: "netflix",
  9: "prime",
  337: "disney",
  29: "nowtv",
};

const PROVIDER_LABELS = {
  netflix: "Netflix",
  prime: "Prime Video",
  disney: "Disney+",
  nowtv: "NOW TV",
};

async function fetchProviders(tmdbId) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    const uk = data.results?.GB;

    if (!uk) return [];

    const flatrate = uk.flatrate || [];

    const providers = flatrate
      .map((p) => SUPPORTED_PROVIDERS[p.provider_id])
      .filter(Boolean);

    return [...new Set(providers)];
  } catch (err) {
    console.error(`Provider fetch failed for ${tmdbId}`, err.message);
    return [];
  }
}

function buildProviderLabels(providers) {
  return providers.map((p) => PROVIDER_LABELS[p]).filter(Boolean);
}

async function main() {
  const movies = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

  const recoveryCandidates = movies.filter(
    (movie) =>
      movie.tmdbId &&
      (
        movie.ukAvailabilitySource === "tmdb-none" ||
        !Array.isArray(movie.ukProviders) ||
        movie.ukProviders.length === 0
      )
  );

  console.log(`Recovery candidates: ${recoveryCandidates.length}`);

  let recoveredCount = 0;
  const recoveredFilms = [];

  for (const movie of recoveryCandidates) {
    console.log(`Checking: ${movie.title}`);

    const providers = await fetchProviders(movie.tmdbId);

    if (providers.length > 0) {
      movie.ukProviders = providers;
      movie.ukProviderLabels = buildProviderLabels(providers);
      movie.ukAvailabilitySource = "tmdb-recovered";

      // Keep legacy field in sync if used elsewhere
      movie.streaming = [...providers];

      recoveredCount++;

      recoveredFilms.push({
        title: movie.title,
        year: movie.year,
        providers,
      });

      console.log(
        `Recovered: ${movie.title} -> ${providers.join(", ")}`
      );
    }
  }

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(movies, null, 2),
    "utf8"
  );

  fs.writeFileSync(
    REPORT_FILE,
    JSON.stringify(
      {
        recoveredCount,
        recoveredFilms,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log("\n=== RECOVERY COMPLETE ===");
  console.log(`Recovered films: ${recoveredCount}`);
  console.log(`Updated library: ${OUTPUT_FILE}`);
  console.log(`Recovery report: ${REPORT_FILE}`);
}

main();