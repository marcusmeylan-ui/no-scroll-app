const fs = require("fs");
const path = require("path");

const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.error("ERROR: TMDB_API_KEY is not set.");
  console.error("Set it in PowerShell with:");
  console.error('$env:TMDB_API_KEY="your_api_key_here"');
  process.exit(1);
}

const INPUT_PATH = path.join(__dirname, "..", "movies.json");
const OUTPUT_PATH = path.join(__dirname, "..", "movies.providers.json");

const SUPPORTED_PROVIDERS = {
  "Netflix": { key: "netflix", label: "Netflix" },
  "Amazon Prime Video": { key: "prime", label: "Prime Video" },
  "Disney Plus": { key: "disney", label: "Disney+" },
  "NOW": { key: "nowtv", label: "NOW" },
};

const DELAY_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldUpdateMovie(movie) {
  const hasNoUkProviders =
    !Array.isArray(movie.ukProviders) || movie.ukProviders.length === 0;

  return movie.ukAvailabilitySource === "manual-dev" || hasNoUkProviders;
}

async function fetchWatchProviders(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  return response.json();
}

function extractGbProviders(data) {
  const gb = data && data.results && data.results.GB;

  if (!gb) {
    return [];
  }

  const providerBuckets = [
    ...(Array.isArray(gb.flatrate) ? gb.flatrate : []),
    ...(Array.isArray(gb.ads) ? gb.ads : []),
    ...(Array.isArray(gb.free) ? gb.free : []),
  ];

  const mapped = [];

  for (const provider of providerBuckets) {
    const providerName = provider.provider_name;
    const match = SUPPORTED_PROVIDERS[providerName];

    if (match && !mapped.some((item) => item.key === match.key)) {
      mapped.push(match);
    }
  }

  return mapped;
}

async function main() {
  const raw = fs.readFileSync(INPUT_PATH, "utf8");
  const movies = JSON.parse(raw);

  if (!Array.isArray(movies)) {
    throw new Error("movies.json must contain a JSON array.");
  }

  const targetMovies = movies.filter(shouldUpdateMovie);

  let updated = 0;
  let noProviders = 0;
  let errors = 0;

  console.log(`Provider enrichment starting...`);
  console.log(`Input films: ${movies.length}`);
  console.log(`Films to check: ${targetMovies.length}`);
  console.log("");

  for (let index = 0; index < targetMovies.length; index++) {
    const movie = targetMovies[index];
    const progress = `${index + 1}/${targetMovies.length}`;

    if (!movie.tmdbId) {
      console.log(`${progress} ${movie.title} - skipped, missing tmdbId`);
      movie.ukProviders = [];
      movie.ukProviderLabels = [];
      movie.streaming = [];
      movie.ukAvailabilitySource = "tmdb-none";
      noProviders++;
      continue;
    }

    try {
      console.log(`${progress} ${movie.title} (${movie.year}) - checking TMDB...`);

      const data = await fetchWatchProviders(movie.tmdbId);
      const mappedProviders = extractGbProviders(data);

      if (mappedProviders.length > 0) {
        movie.ukProviders = mappedProviders.map((provider) => provider.key);
        movie.ukProviderLabels = mappedProviders.map((provider) => provider.label);
        movie.streaming = [...movie.ukProviders];
        movie.ukAvailabilitySource = "tmdb";

        updated++;

        console.log(
          `  applied: ${movie.ukProviderLabels.join(", ")}`
        );
      } else {
        movie.ukProviders = [];
        movie.ukProviderLabels = [];
        movie.streaming = [];
        movie.ukAvailabilitySource = "tmdb-none";

        noProviders++;

        console.log("  no supported UK providers found");
      }
    } catch (error) {
      errors++;
      console.error(`  ERROR: ${error.message}`);
    }

    await sleep(DELAY_MS);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(movies, null, 2) + "\n", "utf8");

  console.log("");
  console.log("Provider enrichment complete.");
  console.log(`Updated with providers: ${updated}`);
  console.log(`No supported providers: ${noProviders}`);
  console.log(`Errors: ${errors}`);
  console.log(`Output written to: movies.providers.json`);
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});