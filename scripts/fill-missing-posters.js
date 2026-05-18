const fs = require("fs");

const MOVIES_PATH = "movies.json";
const APP_PATH = "app.js";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function getApiKey() {
  if (process.env.TMDB_API_KEY) return process.env.TMDB_API_KEY;

  const app = fs.readFileSync(APP_PATH, "utf8");
  const match = app.match(/const TMDB_API_KEY = "([^"]+)"/);
  return match ? match[1] : "";
}

async function main() {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("No TMDB API key found.");
  }

  const movies = JSON.parse(fs.readFileSync(MOVIES_PATH, "utf8"));
  let updated = 0;
  let missing = 0;

  for (const movie of movies) {
    if (movie.poster || !movie.tmdbId) continue;

    const url = `https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${apiKey}&language=en-US`;
    const response = await fetch(url);

    if (!response.ok) {
      console.log("TMDB failed:", movie.title, movie.tmdbId);
      missing += 1;
      continue;
    }

    const data = await response.json();

    if (data.poster_path) {
      movie.poster = `${TMDB_IMAGE_BASE_URL}${data.poster_path}`;
      updated += 1;
      console.log("Updated poster:", movie.title);
    } else {
      console.log("No poster found:", movie.title);
      missing += 1;
    }
  }

  fs.writeFileSync(MOVIES_PATH, JSON.stringify(movies, null, 2));
  console.log("Poster update complete.");
  console.log("Updated:", updated);
  console.log("Still missing:", missing);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});