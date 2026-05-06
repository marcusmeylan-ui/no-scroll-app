const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.join(__dirname, "..", "movies.json");
const OUTPUT_PATH = path.join(__dirname, "..", "movies.overrides.json");

const PROVIDER_LABELS = {
  netflix: "Netflix",
  prime: "Prime Video",
  disney: "Disney+",
  nowtv: "NOW",
};

const OVERRIDES = [
  {
    title: "The Dark Knight",
    year: 2008,
    ukProviders: ["nowtv"],
  },
  {
    title: "John Wick",
    year: 2014,
    ukProviders: ["nowtv"],
  },
  {
    title: "Parasite",
    year: 2019,
    ukProviders: ["nowtv"],
  },
  {
    title: "Hot Fuzz",
    year: 2007,
    ukProviders: ["nowtv"],
  },
  {
    title: "The Raid",
    year: 2012,
    ukProviders: ["nowtv"],
  },
  {
    title: "Train to Busan",
    year: 2016,
    ukProviders: ["nowtv"],
  },
  {
    title: "The Descent",
    year: 2005,
    ukProviders: ["nowtv"],
  },
];

function normaliseTitle(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function buildLabels(providerKeys) {
  return providerKeys.map((key) => PROVIDER_LABELS[key] || key);
}

function validateOverride(override) {
  if (!override.title || !override.year || !Array.isArray(override.ukProviders)) {
    throw new Error(`Invalid override shape: ${JSON.stringify(override)}`);
  }

  for (const provider of override.ukProviders) {
    if (!PROVIDER_LABELS[provider]) {
      throw new Error(
        `Unsupported provider "${provider}" in override for ${override.title}`
      );
    }
  }
}

function main() {
  const raw = fs.readFileSync(INPUT_PATH, "utf8");
  const movies = JSON.parse(raw);

  if (!Array.isArray(movies)) {
    throw new Error("movies.json must contain a JSON array.");
  }

  let applied = 0;
  let notFound = 0;
  let unchanged = 0;

  console.log("Manual provider override pass starting...");
  console.log(`Input films: ${movies.length}`);
  console.log(`Overrides to apply: ${OVERRIDES.length}`);
  console.log("");

  for (const override of OVERRIDES) {
    validateOverride(override);

    const movie = movies.find(
      (item) =>
        normaliseTitle(item.title) === normaliseTitle(override.title) &&
        Number(item.year) === Number(override.year)
    );

    if (!movie) {
      notFound++;
      console.log(`NOT FOUND: ${override.title} (${override.year})`);
      continue;
    }

    const newProviders = [...override.ukProviders];
    const newLabels = buildLabels(newProviders);

    const alreadyMatches =
      JSON.stringify(movie.ukProviders || []) === JSON.stringify(newProviders) &&
      JSON.stringify(movie.ukProviderLabels || []) === JSON.stringify(newLabels) &&
      JSON.stringify(movie.streaming || []) === JSON.stringify(newProviders) &&
      movie.ukAvailabilitySource === "manual-override";

    if (alreadyMatches) {
      unchanged++;
      console.log(
        `UNCHANGED: ${movie.id} - ${movie.title} (${movie.year}) already has ${newLabels.join(", ")}`
      );
      continue;
    }

    movie.ukProviders = newProviders;
    movie.ukProviderLabels = newLabels;
    movie.streaming = [...newProviders];
    movie.ukAvailabilitySource = "manual-override";

    applied++;
    console.log(
      `APPLIED: ${movie.id} - ${movie.title} (${movie.year}) -> ${newLabels.join(", ")}`
    );
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(movies, null, 2) + "\n", "utf8");

  console.log("");
  console.log("Manual provider override pass complete.");
  console.log(`Applied: ${applied}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Output written to: movies.overrides.json`);
}

main();