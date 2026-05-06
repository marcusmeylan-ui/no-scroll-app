// =========================
// Constants
// =========================

const DAILY_STORAGE_KEY = "noScrollDaily";
const RATINGS_STORAGE_KEY = "noScrollRatings";
const SERVICES_STORAGE_KEY = "noScrollServices";
const SEEN_STORAGE_KEY = "noScrollSeen";
const WATCHLIST_STORAGE_KEY = "noScrollWatchlist";
const DEV_MODE_STORAGE_KEY = "noScrollDevMode";
const PENDING_FOLLOW_UP_STORAGE_KEY = "noScrollPendingFollowUp";

const TMDB_API_KEY = "cfff835ff23077aa9d1cdc290f77558b";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_POSTER_PATH_CACHE_KEY = "noScrollTmdbPosterPathCache";

const MIN_RATINGS = 10;
const PAGE_SIZE = 50;
const SKIP_COOLDOWN_WINDOW = 12;
const DEV_SEARCH_RESULT_LIMIT = 12;

const ALLOWED_ENERGY_VALUES = ["low", "medium", "high"];
const ALLOWED_WEIGHT_VALUES = ["light", "balanced", "heavy"];
const ALLOWED_STYLE_VALUES = ["grounded", "heightened", "quirky", "cerebral", "spectacle"];
const ALLOWED_HUMOR_VALUES = ["none", "low", "medium", "high"];

const DEFAULT_ENERGY = "medium";
const DEFAULT_WEIGHT = "balanced";
const DEFAULT_STYLE = "grounded";
const DEFAULT_HUMOR = "low";
const OPENING_BUCKETS = [
  {
    label: "Sci-fi / high concept",
    count: 2,
    match: (movie) =>
      movie.genre === "Sci-Fi" ||
      movie.style === "cerebral" ||
      movie.style === "spectacle"
  },
  {
    label: "Thriller / dark",
    count: 2,
    match: (movie) =>
      movie.genre === "Thriller" ||
      movie.tone === "dark" ||
      movie.tone === "tense"
  },
  {
    label: "Comedy / light",
    count: 2,
    match: (movie) =>
      movie.genre === "Comedy" ||
      movie.humor === "high" ||
      movie.weight === "light"
  },
  {
    label: "Emotional / romance",
    count: 2,
    match: (movie) =>
      movie.genre === "Romance" ||
      movie.tone === "emotional" ||
      movie.genre === "Drama"
  },
  {
    label: "Wildcard / horror / foreign",
    count: 2,
    match: (movie) =>
      movie.genre === "Horror" ||
      movie.genre === "Foreign" ||
      movie.tone === "unsettling"
  }
];

const SUPPORTED_SERVICES = ["netflix", "prime", "nowtv", "disney"];
const SERVICE_LABELS = {
  netflix: "Netflix",
  prime: "Prime Video",
  nowtv: "NOW TV",
  disney: "Disney+"
};

const TEST_PROFILES = [
  {
    id: "profile1",
    label: "Profile 1 — Epic Sci-Fi Fan",
    ratings: [
      ["Inception", 5],
      ["Interstellar", 5],
      ["Arrival", 4],
      ["Blade Runner 2049", 4],
      ["The Martian", 4],
      ["Superbad", 1],
      ["Step Brothers", 1],
      ["Mean Girls", 2],
      ["Titanic", 2],
      ["Bridesmaids", 1]
    ]
  },
  {
    id: "profile2",
    label: "Profile 2 — Dark Thriller / Drama",
    ratings: [
      ["Zodiac", 5],
      ["Gone Girl", 5],
      ["Prisoners", 5],
      ["Sicario", 4],
      ["Nightcrawler", 4],
      ["La La Land", 1],
      ["Notting Hill", 1],
      ["Toy Story", 2],
      ["Pitch Perfect", 1],
      ["Thor: Ragnarok", 2]
    ]
  },
  {
    id: "profile3",
    label: "Profile 3 — Fun Comedy User",
    ratings: [
      ["Superbad", 5],
      ["Game Night", 5],
      ["Hot Fuzz", 5],
      ["School of Rock", 4],
      ["The Nice Guys", 4],
      ["There Will Be Blood", 1],
      ["Zodiac", 2],
      ["Prisoners", 1],
      ["The Revenant", 1],
      ["Blade Runner 2049", 2]
    ]
  },
  {
    id: "profile4",
    label: "Profile 4 — Emotional Romance / Drama",
    ratings: [
      ["About Time", 5],
      ["Before Sunrise", 5],
      ["La La Land", 4],
      ["Brooklyn", 4],
      ["Good Will Hunting", 4],
      ["John Wick", 1],
      ["The Raid", 1],
      ["Se7en", 1],
      ["Mad Max: Fury Road", 2],
      ["Dredd", 1]
    ]
  }
];

function getDefaultAvailableServices() {
  return {
    netflix: true,
    prime: true,
    nowtv: true,
    disney: true
  };
}

function normalizeServiceKey(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) return "";
  if (normalized === "hbo") return "nowtv";
  return SUPPORTED_SERVICES.includes(normalized) ? normalized : "";
}

function uniqueValues(values) {
  return [...new Set(values)];
}

function shuffleArray(values) {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function createSeededRandom(seed) {
  let value = 0;

  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return function nextRandom() {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
// =========================
// App State
// =========================

let movies = [];
let isDataLoaded = false;
let dataLoadError = "";
let visibleCount = PAGE_SIZE;

let ratings = {};
let availableServices = getDefaultAvailableServices();
let seenMovies = {};
let watchlistMovies = {};
let currentRecommendations = null;

let isDevMode = false;
let devSearchQuery = "";
let devProfileMessage = "";
let skippedMovieState = {};
let ratingSessionStep = 0;
let pendingFollowUp = null;
let dismissedRecommendationIds = [];
let isBrowsingMoreFilms = false;

// =========================
// Boot
// =========================

document.addEventListener("DOMContentLoaded", () => {
  loadRatings();
  loadServicePreferences();
  loadSeenMovies();
  loadWatchlistMovies();
  loadDailyRecommendation();
  loadPendingFollowUp();
  loadDevModePreference();
  connectResetButton();
  connectHiddenDevModeToggle();
  loadMovies();
});

// =========================
// Data Loading
// =========================

function loadMovies() {
  fetch("movies.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load movies.json (${response.status})`);
      }
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        throw new Error("movies.json is not an array.");
      }

      const validatedMovies = data.map(normalizeMovie).filter(Boolean);

      if (validatedMovies.length === 0) {
        throw new Error("movies.json loaded but contains no valid movie records.");
      }

      movies = validatedMovies;
      isDataLoaded = true;
      dataLoadError = "";

      pruneSkippedMovieState();
      renderApp();
    })
    .catch((error) => {
      console.error("Movie data load failed:", error);
      movies = [];
      isDataLoaded = false;
      dataLoadError = error.message || "Unknown error loading movies.json";
      renderApp();
    });
}


// =========================
// Normalization / display helpers
// =========================
function normalizeMovie(movie, index) {
  if (!movie || typeof movie !== "object") {
    return null;
  }

  const id = Number(movie.id);
  const title = typeof movie.title === "string" ? movie.title.trim() : "";
  const genre = typeof movie.genre === "string" ? movie.genre.trim() : "";
  const tone = typeof movie.tone === "string" ? movie.tone.trim() : "";

  const streaming = Array.isArray(movie.streaming)
    ? uniqueValues(movie.streaming.map(normalizeServiceKey).filter(Boolean))
    : [];

  const ukProviders = Array.isArray(movie.ukProviders)
    ? uniqueValues(movie.ukProviders.map(normalizeServiceKey).filter(Boolean))
    : [];

  const tmdbId =
    movie.tmdbId !== undefined &&
    movie.tmdbId !== null &&
    String(movie.tmdbId).trim() !== ""
      ? Number(movie.tmdbId)
      : null;

  const poster =
    typeof movie.poster === "string" && movie.poster.trim() !== ""
      ? movie.poster.trim()
      : "";

  const energy = normalizeEnumValue(movie.energy, ALLOWED_ENERGY_VALUES, DEFAULT_ENERGY);
  const weight = normalizeEnumValue(movie.weight, ALLOWED_WEIGHT_VALUES, DEFAULT_WEIGHT);
  const style = normalizeEnumValue(movie.style, ALLOWED_STYLE_VALUES, DEFAULT_STYLE);
  const humor = normalizeEnumValue(movie.humor, ALLOWED_HUMOR_VALUES, DEFAULT_HUMOR);

  if (!id || !title || !genre || !tone) {
    console.warn("Skipping invalid movie record at index:", index, movie);
    return null;
  }

  const ukProviderLabels = Array.isArray(movie.ukProviderLabels)
    ? movie.ukProviderLabels
        .filter((label) => typeof label === "string" && label.trim() !== "")
        .map((label) => label.trim())
    : [];

  const year =
    movie.year !== undefined &&
    movie.year !== null &&
    String(movie.year).trim() !== ""
      ? Number(movie.year)
      : null;

  const originalTitle =
    typeof movie.originalTitle === "string" && movie.originalTitle.trim() !== ""
      ? movie.originalTitle.trim()
      : "";

  return {
    ...movie,
    id,
    title,
    genre,
    tone,
    streaming,
    poster,
    tmdbId: Number.isFinite(tmdbId) ? tmdbId : null,
    energy,
    weight,
    style,
    humor,
    year: Number.isFinite(year) ? year : null,
    originalTitle,
    ukProviders,
    ukProviderLabels,
    ukAvailabilitySource:
      typeof movie.ukAvailabilitySource === "string" ? movie.ukAvailabilitySource : ""
  };
}
function normalizeEnumValue(rawValue, allowedValues, fallbackValue) {
  if (typeof rawValue !== "string") {
    return fallbackValue;
  }

  const normalized = rawValue.trim().toLowerCase();
  return allowedValues.includes(normalized) ? normalized : fallbackValue;
}
function formatDisplayLabel(value) {
  if (value === undefined || value === null) return "";

  const serviceKey = normalizeServiceKey(value);
  if (serviceKey) {
    return SERVICE_LABELS[serviceKey] || serviceKey;
  }

  return String(value)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
function formatDisplayList(values) {
  if (!Array.isArray(values)) return "";
  return values.map(formatDisplayLabel).filter(Boolean).join(", ");
}
function getDisplayServicesForMovie(movie) {
  if (!movie) return [];

  const matchedUkProviders = Array.isArray(movie.ukProviders)
    ? movie.ukProviders.filter((service) => availableServices[service])
    : [];

  if (matchedUkProviders.length > 0) {
    return uniqueValues(matchedUkProviders.map(normalizeServiceKey).filter(Boolean));
  }

  const legacyStreaming = Array.isArray(movie.streaming) ? movie.streaming : [];
  return uniqueValues(legacyStreaming.map(normalizeServiceKey).filter(Boolean));
}
function getMatchedUkProviderLabels(movie) {
  return getDisplayServicesForMovie(movie).map(formatDisplayLabel);
}
// =========================
// Poster helpers
// =========================
function loadTmdbPosterPathCache() {
  try {
    const raw = localStorage.getItem(TMDB_POSTER_PATH_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}
function saveTmdbPosterPathCache(cache) {
  try {
    localStorage.setItem(TMDB_POSTER_PATH_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // fail silently
  }
}
function buildTmdbPosterUrlFromPath(posterPath) {
  if (!posterPath) return "";
  return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
}

async function fetchTmdbMovieDetailsById(tmdbId) {
  if (!tmdbId || !TMDB_API_KEY) return null;

  const url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(String(tmdbId))}?api_key=${encodeURIComponent(TMDB_API_KEY)}&language=en-US`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
async function searchTmdbMovieByTitle(title) {
  if (!title || !TMDB_API_KEY) return null;

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${encodeURIComponent(TMDB_API_KEY)}&language=en-US&query=${encodeURIComponent(title)}&include_adult=false`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  if (results.length === 0) {
    return null;
  }

  const normalizedTarget = title.toLowerCase().replace(/[^a-z0-9]/g, "");

  const exactMatch =
    results.find((item) => {
      const candidate = String(item?.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return candidate === normalizedTarget;
    }) ||
    results.find((item) => {
      const candidate = String(item?.original_title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return candidate === normalizedTarget;
    });

  return exactMatch || results[0];
}
async function fetchTmdbPosterPath(movieOrTmdbId) {
  const movie =
    typeof movieOrTmdbId === "object" && movieOrTmdbId !== null
      ? movieOrTmdbId
      : null;

  const tmdbId = movie ? movie.tmdbId : movieOrTmdbId;
  const title = movie?.title ? String(movie.title).trim() : "";

  if (!TMDB_API_KEY) {
    console.warn("TMDB poster fetch skipped: missing API key");
    return "";
  }

  try {
    if (tmdbId) {
      const byId = await fetchTmdbMovieDetailsById(tmdbId);

      if (byId?.poster_path) {
        console.log("TMDB poster fetch success by id", {
          title,
          tmdbId,
          matchedTitle: byId.title,
          posterPath: byId.poster_path
        });
        return byId.poster_path;
      }

      console.warn("TMDB id lookup failed or had no poster, trying title search", {
        title,
        tmdbId
      });
    }

    const byTitle = await searchTmdbMovieByTitle(title);

    if (byTitle?.poster_path) {
      console.log("TMDB poster fetch success by title search", {
        title,
        matchedTitle: byTitle.title,
        matchedId: byTitle.id,
        posterPath: byTitle.poster_path
      });
      return byTitle.poster_path;
    }

    console.warn("TMDB poster fetch failed completely", {
      title,
      tmdbId
    });
    return "";
  } catch (error) {
    console.warn("TMDB poster fetch threw an error", {
      title,
      tmdbId,
      error: String(error)
    });
    return "";
  }
}
function resolvePosterSrc(movie) {
  const localPoster =
    typeof movie?.poster === "string" && movie.poster.trim() !== ""
      ? movie.poster.trim()
      : "";

  if (!movie?.tmdbId) {
    return Promise.resolve(localPoster);
  }

  const cache = loadTmdbPosterPathCache();
  const cacheKey = String(movie.tmdbId);

  if (cache[cacheKey]) {
    return Promise.resolve(buildTmdbPosterUrlFromPath(cache[cacheKey]));
  }

  return fetchTmdbPosterPath(movie).then((posterPath) => {
    if (posterPath) {
      cache[cacheKey] = posterPath;
      saveTmdbPosterPathCache(cache);
      return buildTmdbPosterUrlFromPath(posterPath);
    }

    return localPoster;
  });
}
function hydratePosterElement(img, movie) {
  if (!img || !movie) return;

  resolvePosterSrc(movie).then((posterSrc) => {
    if (!img || !img.isConnected) return;

    if (posterSrc) {
      img.src = posterSrc;
      img.setAttribute("data-poster-stage", movie.tmdbId ? "tmdb" : "local");
      return;
    }

    const fallbackMarkup = renderPosterFallbackMarkup(movie.title);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = fallbackMarkup;
    const fallbackNode = wrapper.firstElementChild;

    if (fallbackNode && img.parentNode) {
      img.replaceWith(fallbackNode);
    }
  });
}
function scrollAppToTop() {
  window.scrollTo(0, 0);
}
// =========================
// Render functions
// =========================
function renderApp() {
  const screen = document.getElementById("app-screen");
  if (!screen) return;

  if (!isDataLoaded) {
    screen.innerHTML = `
      <section class="section-card">
        <h3 class="section-title">Movie data not loaded</h3>
        <p class="section-copy">
          ${escapeHtml(dataLoadError || "movies.json could not be loaded.")}
        </p>
        <p class="section-copy" style="margin-top: 8px;">
          Check that movies.json exists, contains valid movie objects, and is being served from your local project.
        </p>
      </section>
    `;
    return;
  }

  pruneSkippedMovieState();

  const ratedCount = Object.keys(ratings).length;
  const candidateCount = getRecommendationCandidates().length;
  const skippedCount = getActiveSkippedMovieCount();
  const watchlistCount = Object.keys(watchlistMovies).length;
  const showServiceControls = !currentRecommendations && ratedCount < MIN_RATINGS;

  screen.innerHTML = `
    ${showServiceControls ? `
      <section class="section-card">
        <h3 class="section-title">Available services</h3>
        <p class="section-copy">Choose the streaming platforms you have access to:</p>
        <div class="service-controls" id="service-controls"></div>
        <p class="section-copy" style="margin-top: 8px;">Total catalog: ${movies.length} films</p>
        ${skippedCount > 0 ? `<p class="section-copy" style="margin-top: 8px;">Skipped for now: ${skippedCount}</p>` : ""}
        ${watchlistCount > 0 ? `<p class="section-copy" style="margin-top: 8px;">Saved for later: ${watchlistCount}</p>` : ""}
      </section>
    ` : ""}
    ${renderPendingFollowUpCard()}
    <div id="main-content"></div>
    ${renderWatchlistSection()}
  `;

  if (showServiceControls) {
    renderServiceCheckboxes();
  }

  const main = document.getElementById("main-content");
  if (!main) return;

  if (currentRecommendations) {
    renderPickScreen(main, ratedCount, candidateCount);
  } else if (ratedCount >= MIN_RATINGS && !isBrowsingMoreFilms) {
    renderRevealScreen(main, ratedCount, candidateCount);
  } else {
    renderRatingScreen(main, ratedCount, candidateCount);
  }

  wirePosterFallbacks(screen);

  if (isDevMode) {
    renderDevTestPanel(main);
  }
}
function renderRatingScreen(screen, ratedCount, candidateCount) {
  const currentMovie = getNextRatingMovie();
  const availableRatingCandidates = getRatingCandidates().length;
  const showUpdatedRecommendationCta = ratedCount >= MIN_RATINGS && isBrowsingMoreFilms;

  if (!currentMovie) {
    screen.innerHTML = `
      <section class="hero-card">
        <p class="hero-kicker">Nothing left to rate</p>
        <h2 class="hero-title">You have no more available films in the current filter set</h2>
        <p class="hero-text">Try changing services, or managing your watchlist.</p>
        <div class="progress-pill">Rated ${ratedCount} / ${MIN_RATINGS} needed</div>
        <div class="progress-pill">Available recommendation candidates: ${candidateCount}</div>
      </section>

      <section class="section-card">
        <div class="reveal-action-row">
          ${
            showUpdatedRecommendationCta
              ? `<button class="primary-btn" onclick="generateRecommendations()">Get updated recommendation</button>`
              : ""
          }
          <button class="ghost-btn" onclick="clearSkippedMovies()">Clear skipped queue</button>
        </div>
      </section>
    `;
    return;
  }

  const streamingLabels = formatDisplayList(getDisplayServicesForMovie(currentMovie));
  const progressPercent = Math.min((Math.min(ratedCount, MIN_RATINGS) / MIN_RATINGS) * 100, 100);

  screen.innerHTML = `
    <section class="hero-card">
      <p class="hero-kicker">${showUpdatedRecommendationCta ? "Keep refining" : "Rate 10 films"}</p>
      <h2 class="hero-title">${showUpdatedRecommendationCta ? "Improve your recommendation" : "Build your recommendation"}</h2>
      <p class="hero-text">
        ${
          showUpdatedRecommendationCta
            ? "Rate more films to sharpen the pick, then generate an updated recommendation whenever you are ready."
            : "Rate quickly and we will choose one strong pick from your available unseen films."
        }
      </p>
      <div class="progress-pill">Rated ${ratedCount} / ${MIN_RATINGS}</div>
      <div class="progress-pill">Available recommendation candidates: ${candidateCount}</div>
      <div class="progress-pill">Rating queue now: ${availableRatingCandidates}</div>
      <div class="rating-progress-track">
        <div class="rating-progress-fill" style="width: ${progressPercent}%"></div>
      </div>
    </section>

    ${
      showUpdatedRecommendationCta
        ? `
          <section class="section-card">
            <div class="reveal-action-row">
              <button class="primary-btn" onclick="generateRecommendations()">Get updated recommendation</button>
              <button class="ghost-btn" onclick="isBrowsingMoreFilms = false; renderApp(); scrollAppToTop();">Back to reveal screen</button>
            </div>
          </section>
        `
        : ""
    }

    <section class="movie-card stacked-rating-card">
      <div class="stacked-poster-wrap">
        ${renderPosterMarkup(currentMovie)}
      </div>

      <div class="stacked-content">
        <p class="movie-title">${escapeHtml(currentMovie.title)}</p>
        <p class="movie-meta">${escapeHtml(formatDisplayLabel(currentMovie.genre))} · ${escapeHtml(formatDisplayLabel(currentMovie.tone))}</p>
        <p class="service-meta">${escapeHtml(streamingLabels)}</p>
        <p class="section-copy" style="margin-top: 12px;">How much do you like this film?</p>

        <div class="stacked-rating-row">
          <button class="rating-btn" onclick="rateMovieAndAdvance(${currentMovie.id}, 1)">1</button>
          <button class="rating-btn" onclick="rateMovieAndAdvance(${currentMovie.id}, 2)">2</button>
          <button class="rating-btn" onclick="rateMovieAndAdvance(${currentMovie.id}, 3)">3</button>
          <button class="rating-btn" onclick="rateMovieAndAdvance(${currentMovie.id}, 4)">4</button>
          <button class="rating-btn" onclick="rateMovieAndAdvance(${currentMovie.id}, 5)">5</button>
        </div>

        <div class="stacked-actions">
          <button class="ghost-btn" onclick="skipMovie(${currentMovie.id})">Skip</button>
          <button class="ghost-btn" onclick="addToWatchlistAndAdvance(${currentMovie.id})">Save for later</button>
        </div>
      </div>
    </section>

    <section class="section-card">
      <h3 class="section-title">How this works</h3>
      <p class="section-copy">
        ${
          showUpdatedRecommendationCta
            ? "Each extra rating improves the signal. When you are happy with the additional ratings, generate an updated recommendation."
            : "Rated films count as watched and train the recommendation engine. Skip removes a film from future recommendations, while Save for later adds it to your watchlist."
        }
      </p>
      ${
        getActiveSkippedMovieCount() > 0
          ? `
            <div style="margin-top: 12px;">
              <button class="ghost-btn" onclick="clearSkippedMovies()">Clear skipped queue</button>
            </div>
          `
          : ""
      }
    </section>
  `;

  wirePosterFallbacks(screen);
}
function renderPendingFollowUpCard() {
  if (!pendingFollowUp || !pendingFollowUp.movieId) return "";

  return `
    <section class="section-card">
      <h3 class="section-title">Did you watch ${escapeHtml(pendingFollowUp.title)}?</h3>
      <p class="section-copy">Help improve your next recommendation with a quick rating.</p>

      <div class="rating-row" style="margin-top: 14px;">
        <button class="rating-btn" onclick="ratePendingFollowUp(1)">1</button>
        <button class="rating-btn" onclick="ratePendingFollowUp(2)">2</button>
        <button class="rating-btn" onclick="ratePendingFollowUp(3)">3</button>
        <button class="rating-btn" onclick="ratePendingFollowUp(4)">4</button>
        <button class="rating-btn" onclick="ratePendingFollowUp(5)">5</button>
      </div>

      <div style="margin-top: 12px;">
        <button class="ghost-btn" onclick="dismissPendingFollowUp()">Skip for now</button>
      </div>
    </section>
  `;
}
function renderWatchlistSection() {
  const watchlistItems = movies.filter((movie) => watchlistMovies[movie.id]);

  if (watchlistItems.length === 0) {
    return `
      <section class="section-card watchlist-section">
        <h3 class="section-title">Your watchlist</h3>
        <p class="section-copy">Save good picks for later so you do not lose them.</p>
      </section>
    `;
  }

  const watchlistMarkup = watchlistItems
    .map((movie) => {
      return `
        <article class="alt-card">
          <div class="alt-card-poster">
            ${renderPosterMarkup(movie)}
          </div>
          <div class="alt-card-body">
            <p class="alt-card-title">${escapeHtml(movie.title)}</p>
            <p class="alt-card-meta">${escapeHtml(formatDisplayLabel(movie.genre))} · ${escapeHtml(formatDisplayLabel(movie.tone))}</p>

            <div class="alt-card-actions">
              <button class="ghost-btn" onclick="watchFromWatchlist(${movie.id})">Watch now</button>
              <button class="ghost-btn" onclick="removeFromWatchlist(${movie.id})">Remove</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <section class="section-card watchlist-section">
      <h3 class="section-title">Your watchlist</h3>
      <div class="alt-card-list">
        ${watchlistMarkup}
      </div>
    </section>
  `;
}
function renderRevealScreen(screen, ratedCount, candidateCount) {
  screen.innerHTML = `
    <section class="hero-card">
      <p class="hero-kicker">Ready</p>
      <h2 class="hero-title">Reveal your recommendation</h2>
      <p class="hero-text">You have rated enough films to generate a pick.</p>
      <div class="progress-pill">Rated ${ratedCount} films</div>
      <div class="progress-pill">Available candidates: ${candidateCount}</div>
    </section>

    <section class="section-card">
      <div class="reveal-action-row">
        <button id="reveal-btn" class="primary-btn">Reveal Tonight's Pick</button>
        <button id="rate-more-btn" class="ghost-btn">Rate more films first</button>
      </div>
    </section>
  `;

  const revealButton = document.getElementById("reveal-btn");
  if (revealButton) {
    revealButton.addEventListener("click", generateRecommendations);
  }

  const rateMoreButton = document.getElementById("rate-more-btn");
  if (rateMoreButton) {
    rateMoreButton.addEventListener("click", returnToMovieList);
  }

  scrollAppToTop();
}
function renderPickScreen(screen, ratedCount, candidateCount) {
  if (!currentRecommendations || !currentRecommendations.topPick) {
    screen.innerHTML = `
      <section class="hero-card">
        <p class="hero-kicker">No candidates</p>
        <h2 class="hero-title">No recommendation available</h2>
        <p class="hero-text">There are no unwatched films available from your selected services.</p>
        <div class="progress-pill">Rated ${ratedCount} films</div>
        <div class="progress-pill">Available candidates: ${candidateCount}</div>
      </section>

      <section class="section-card">
        <p class="section-copy">Try changing services, seen state, or your watchlist.</p>
      </section>
    `;
    return;
  }

  const topPick = currentRecommendations.topPick;
  const topPickStreaming = formatDisplayList(getDisplayServicesForMovie(topPick));
  const displayConfidence = getDisplayConfidenceLabel(currentRecommendations.confidence);
  const confidenceClass = getConfidenceBadgeClass(currentRecommendations.confidence);
  const whyList = buildWhyItWorksList(topPick);
    const matchedProviderLabels = getMatchedUkProviderLabels(topPick);
  const availableTonightCopy =
    matchedProviderLabels.length > 0
      ? `Available on ${matchedProviderLabels.join(", ")}`
      : "Available on your selected services";

  const alternativesMarkup = currentRecommendations.alternatives
    .map((movie) => {
      return `
        <article class="alt-card alt-card-interactive">
          <div class="alt-card-poster">
            ${renderPosterMarkup(movie)}
          </div>
                    <div class="alt-card-body">
            <p class="alt-card-title">${escapeHtml(movie.title)}</p>
            <p class="alt-card-meta">${escapeHtml(formatDisplayLabel(movie.genre))} · ${escapeHtml(formatDisplayLabel(movie.tone))}</p>
            <p class="alt-card-reason">${escapeHtml(buildBackupReason(movie, topPick))}</p>

            <div class="alt-card-actions">
              <button class="ghost-btn" onclick="promoteAlternativeToTopPick(${movie.id})">Pick this instead</button>
              <button class="ghost-btn" onclick="addRecommendationToWatchlist(${movie.id})">Save for later</button>
              <button class="ghost-btn" onclick="markRecommendationSeen(${movie.id})">Seen it</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  screen.innerHTML = `
    <section class="pick-card premium-pick-card">
      <div class="pick-spotlight"></div>

      <div class="pick-poster-wrap">
        ${renderPosterMarkup(topPick)}
      </div>

      <div class="pick-main-content">
        <p class="pick-label">Tonight's Pick</p>
        <h2 class="pick-title">${escapeHtml(topPick.title)}</h2>
        <p class="pick-subtext">
          ${escapeHtml(formatDisplayLabel(topPick.genre))} · ${escapeHtml(formatDisplayLabel(topPick.tone))}${topPickStreaming ? ` · ${escapeHtml(topPickStreaming)}` : ""}
        </p>

        <div class="pick-confidence-row strong">
          <span class="confidence-pill ${escapeHtml(confidenceClass)}">${escapeHtml(displayConfidence)} • Based on your ratings</span>
          <span class="availability-pill">Available tonight in the UK</span>
        </div>

        <div class="availability-box">
          <p class="section-title">Available on your services</p>
          <div class="pick-confidence-row" style="margin-top: 12px;">
            ${matchedProviderLabels.length > 0
              ? matchedProviderLabels
                  .map((label) => `<span class="provider-chip">${escapeHtml(label)}</span>`)
                  .join("")
              : `<span class="provider-chip">${escapeHtml(availableTonightCopy)}</span>`}
          </div>
        </div>

        <div class="pick-watch-box">
          <p class="pick-watch-copy">This is your best next watch.</p>
        </div>

        <div class="pick-action-row">
          <button class="primary-btn" onclick="markRecommendationSeen(${topPick.id})">Play this tonight</button>
          <button class="ghost-btn" onclick="addRecommendationToWatchlist(${topPick.id})">Save for later</button>
          <button class="ghost-btn" onclick="dismissCurrentTopPick()">Not feeling it</button>
          <button class="ghost-btn" onclick="returnToMovieList()">Rate more films</button>
        </div>

        <div class="pick-info-grid">
          <div class="section-card pick-info-card">
            <h3 class="section-title">Why this works for you</h3>
            <ul class="why-list">
              ${whyList.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>

          <div class="section-card pick-info-card">
            <h3 class="section-title">Your taste profile</h3>
            <p class="section-copy">${escapeHtml(currentRecommendations.tasteProfile)}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-card alt-section">
      <h3 class="section-title">Backup options</h3>
      <div class="alt-card-list">
        ${alternativesMarkup || `<p class="section-copy">No alternatives available.</p>`}
      </div>
    </section>
  `;

  wirePosterFallbacks(screen);
}
function getDisplayConfidenceLabel(confidence) {
  if (confidence === "High") return "Strong Match";
  if (confidence === "Medium") return "Good Match";
  return "Early Match";
}
function getConfidenceBadgeClass(confidence) {
  if (confidence === "High") return "strong";
  if (confidence === "Medium") return "good";
  return "early";
}
function buildWhyItWorksList(topPick) {
  const lines = [];
  const profile = buildPreferenceProfile();
  const likedMovies = getTopLikedMovies(3);

  const genreScore = profile.genreScores[topPick.genre] || 0;
  const weightScore = profile.weightScores[topPick.weight] || 0;
  const styleScore = profile.styleScores[topPick.style] || 0;
  const humorScore = profile.humorScores[topPick.humor] || 0;

  if (genreScore >= 0.35) {
    lines.push(`You are rating ${topPick.genre.toLowerCase()} films strongly.`);
  }

  if (weightScore >= 0.25) {
    lines.push(`You are leaning toward ${topPick.weight} watches right now.`);
  }

  if (styleScore >= 0.25) {
    lines.push(`You are responding well to more ${topPick.style} films.`);
  }

  if (humorScore >= 0.3 && topPick.humor !== "none") {
    lines.push(`This also fits the humour level your ratings are pointing toward.`);
  }
    const likedMatch = likedMovies.find((movie) => {
    return (
      movie.genre === topPick.genre ||
      movie.style === topPick.style ||
      movie.weight === topPick.weight ||
      movie.humor === topPick.humor
    );
  });

  if (likedMatch) {
    lines.push(`It overlaps with films you rated highly like ${likedMatch.title}.`);
  }

  if (lines.length === 0) {
    lines.push("This was the strongest overall fit from your unseen films.");
  }

  return lines.slice(0, 3);
}
function buildBackupReason(movie, topPick) {
  if (movie.genre === topPick.genre && movie.tone !== topPick.tone) {
    return "Similar genre, different mood.";
  }

  if (movie.genre !== topPick.genre && movie.style === topPick.style) {
    return "Different lane, similar style.";
  }

  if (movie.weight !== topPick.weight) {
    return movie.weight === "light" ? "Lighter watch." : "Heavier watch.";
  }

  if (movie.humor !== topPick.humor) {
    return movie.humor === "high" ? "More humour." : "Less humour.";
  }

  return "Another strong fit from your profile.";
}
function promoteAlternativeToTopPick(movieId) {
  if (!currentRecommendations || !currentRecommendations.topPick) return;

  const replacement = currentRecommendations.alternatives.find((movie) => movie.id === movieId);
  if (!replacement) return;

  const oldTopPick = currentRecommendations.topPick;
  const remainingAlternatives = currentRecommendations.alternatives.filter((movie) => movie.id !== movieId);

  if (oldTopPick && !remainingAlternatives.some((movie) => movie.id === oldTopPick.id)) {
    remainingAlternatives.push(oldTopPick);
  }

  currentRecommendations.topPick = replacement;
  currentRecommendations.alternatives = remainingAlternatives.slice(0, 2);

  saveDailyRecommendation();
  renderApp();
}
function markRecommendationSeen(movieId) {
  if (!movieId) return;

  const source =
    currentRecommendations?.topPick?.id === movieId ? "top-pick" : "alternative";

  seenMovies[movieId] = true;
  delete skippedMovieState[movieId];

  createPendingFollowUp(movieId, source);

  visibleCount = PAGE_SIZE;
  dismissedRecommendationIds = [];
  saveSeenMovies();
  clearDailyRecommendation();
  devProfileMessage = "";

  generateRecommendations();
}
function returnToMovieList() {
  dismissedRecommendationIds = [];
  currentRecommendations = null;
  isBrowsingMoreFilms = true;
  renderApp();
  scrollAppToTop();
}
// =========================
// Dev / test helpers
// =========================
function renderDevTestPanel(parent) {
  if (!parent) return;

  const existingPanel = document.getElementById("dev-test-panel");
  if (existingPanel) {
    existingPanel.remove();
  }

  const panel = document.createElement("section");
  panel.id = "dev-test-panel";
  panel.className = "section-card";

  const searchResults = getDevSearchResults(devSearchQuery);
  const profileButtons = TEST_PROFILES.map((profile) => {
    return `<button class="ghost-btn" onclick="applyTestProfile('${escapeJsString(profile.id)}')">${escapeHtml(profile.label)}</button>`;
  }).join("");

  const resultMarkup = searchResults.length
    ? searchResults.map((movie) => {
        const isSeen = Boolean(seenMovies[movie.id]);
        const currentRating = ratings[movie.id];
        return `
          <div class="movie-card" style="margin-top: 12px;">
            <div class="movie-card-header">
              ${renderPosterMarkup(movie)}
              <div>
                <p class="movie-title">${escapeHtml(movie.title)}</p>
                <p class="movie-meta">${escapeHtml(movie.genre)} · ${escapeHtml(movie.tone)}</p>
                <p class="service-meta">${escapeHtml(movie.streaming.join(", "))}</p>
                <p class="movie-rating">${currentRating !== undefined ? `Your rating: ${currentRating}/5` : "Not rated yet"}${isSeen ? " · Watched" : ""}</p>
              </div>
            </div>
            <div class="rating-row">
              <button class="rating-btn" onclick="devApplyRating(${movie.id}, 1)">1</button>
              <button class="rating-btn" onclick="devApplyRating(${movie.id}, 2)">2</button>
              <button class="rating-btn" onclick="devApplyRating(${movie.id}, 3)">3</button>
              <button class="rating-btn" onclick="devApplyRating(${movie.id}, 4)">4</button>
              <button class="rating-btn" onclick="devApplyRating(${movie.id}, 5)">5</button>
            </div>
            <div class="stacked-actions" style="margin-top: 10px;">
              <button class="ghost-btn" onclick="devToggleSeen(${movie.id})">${isSeen ? "Undo watched" : "Mark watched"}</button>
              <button class="ghost-btn" onclick="devClearRating(${movie.id})">Clear rating</button>
            </div>
          </div>
        `;
      }).join("")
    : `<p class="section-copy" style="margin-top: 12px;">No matching films found.</p>`;
      panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap;">
      <div>
        <h3 class="section-title">Dev test mode</h3>
        <p class="section-copy">Stable search plus one-click test profiles.</p>
      </div>
      <button class="ghost-btn" onclick="toggleDevMode(false)">Hide dev mode</button>
    </div>

    ${
      devProfileMessage
        ? `<p class="section-copy" style="margin-top: 12px;">${escapeHtml(devProfileMessage)}</p>`
        : ""
    }

    <div style="margin-top: 16px;">
      <h4 class="section-title" style="font-size: 0.95rem;">Quick profile runner</h4>
      <div class="stacked-actions" style="margin-top: 10px;">
        ${profileButtons}
      </div>
    </div>

    <div style="margin-top: 18px;">
      <h4 class="section-title" style="font-size: 0.95rem;">Search specific films</h4>
      <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
        <input
          id="dev-search-input"
          type="text"
          value="${escapeAttribute(devSearchQuery)}"
          placeholder="Search films by title"
          style="flex: 1 1 280px; min-width: 220px; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: inherit; box-sizing: border-box;"
        />
        <button id="dev-search-btn" class="ghost-btn">Search</button>
        <button id="dev-clear-search-btn" class="ghost-btn">Clear</button>
      </div>
    </div>

    <div class="stacked-actions" style="margin-top: 12px;">
      <button class="ghost-btn" onclick="clearSkippedMovies()">Clear skipped queue</button>
      <button class="ghost-btn" onclick="clearDevSessionState()">Clear test ratings + watched</button>
    </div>

    ${resultMarkup}
  `;

  parent.appendChild(panel);
  wirePosterFallbacks(panel);
  connectDevSearchControls();
}
function connectDevSearchControls() {
  const input = document.getElementById("dev-search-input");
  const searchBtn = document.getElementById("dev-search-btn");
  const clearBtn = document.getElementById("dev-clear-search-btn");

  if (searchBtn && input) {
    searchBtn.addEventListener("click", () => {
      devSearchQuery = input.value || "";
      renderApp();
    });
  }

  if (clearBtn && input) {
    clearBtn.addEventListener("click", () => {
      devSearchQuery = "";
      devProfileMessage = "";
      renderApp();
    });
  }

  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        devSearchQuery = input.value || "";
        renderApp();
      }
    });
  }
}
function getDevSearchResults(query) {
  const normalized = String(query || "").trim().toLowerCase();

  if (!normalized) {
    return getRecommendationCandidates().slice(0, DEV_SEARCH_RESULT_LIMIT);
  }

  return movies
    .filter((movie) => movie.title.toLowerCase().includes(normalized))
    .slice(0, DEV_SEARCH_RESULT_LIMIT);
}
function wirePosterFallbacks(rootElement) {
  rootElement.querySelectorAll(".poster").forEach((img) => {
    if (img.dataset.posterBound === "true") return;
    img.dataset.posterBound = "true";

    const movieId = Number(img.getAttribute("data-movie-id"));
    const movie = movies.find((item) => item.id === movieId);

    img.addEventListener("error", () => {
      const title = img.getAttribute("data-title") || "Poster unavailable";
      const localPoster = img.getAttribute("data-local-poster") || "";
      const stage = img.getAttribute("data-poster-stage") || "";

      if (stage === "tmdb" && localPoster) {
        img.src = localPoster;
        img.setAttribute("data-poster-stage", "local");
        return;
      }

      img.outerHTML = renderPosterFallbackMarkup(title);
    });

    if (movie && movie.tmdbId) {
      hydratePosterElement(img, movie);
    }
  });
}
function renderPosterMarkup(movie) {
  const localPoster =
    typeof movie.poster === "string" && movie.poster.trim() !== ""
      ? movie.poster.trim()
      : "";

  return `
    <img
      class="poster"
      src="${escapeAttribute(localPoster)}"
      alt="${escapeAttribute(movie.title)} poster"
      data-title="${escapeAttribute(movie.title)}"
      data-movie-id="${escapeAttribute(movie.id)}"
      data-local-poster="${escapeAttribute(localPoster)}"
      data-poster-stage="initial"
      loading="lazy"
      referrerpolicy="no-referrer"
    />
  `;
}
function renderPosterFallbackMarkup(title) {
  return `
    <div class="poster poster-fallback" aria-label="${escapeAttribute(title)} poster unavailable">
      <span class="poster-fallback-title">No Poster</span>
      <span class="poster-fallback-brand">NoScroll</span>
    </div>
  `;
}
function getNextRatingMovie() {
  const candidates = getRatingCandidates();
  if (candidates.length === 0) return null;

  const ratedCount = Object.keys(ratings).length;

  if (ratedCount < MIN_RATINGS) {
    const balancedOpeningQueue = buildBalancedOpeningQueue(candidates);
    return balancedOpeningQueue[0] || candidates[0] || null;
  }

  const shuffled = getStableShuffledCandidates(candidates);
  return shuffled[0] || candidates[0] || null;
}
function buildBalancedOpeningQueue(candidates = getRatingCandidates()) {
  const selected = [];
  const selectedIds = new Set();

  OPENING_BUCKETS.forEach((bucket) => {
    const bucketCandidates = shuffleArray(
      candidates.filter((movie) => {
        return !selectedIds.has(movie.id) && bucket.match(movie);
      })
    );

    bucketCandidates.slice(0, bucket.count).forEach((movie) => {
      selected.push(movie);
      selectedIds.add(movie.id);
    });
  });

  if (selected.length < MIN_RATINGS) {
    const fallbackCandidates = shuffleArray(
      candidates.filter((movie) => !selectedIds.has(movie.id))
    );

    fallbackCandidates.slice(0, MIN_RATINGS - selected.length).forEach((movie) => {
      selected.push(movie);
      selectedIds.add(movie.id);
    });
  }

  return shuffleArray(selected);
}
function getRatingCandidates() {
  const baseCandidates = movies.filter((movie) => {
    if (seenMovies[movie.id]) return false;
    if (watchlistMovies[movie.id]) return false;
    return true;
  });

  const unskippedCandidates = baseCandidates.filter((movie) => !isMovieSkippedForNow(movie.id));
  const candidates = unskippedCandidates.length > 0 ? unskippedCandidates : baseCandidates;

  return applyNewLibraryRatingBoost(candidates);
}
function applyNewLibraryRatingBoost(candidates) {
  if (!Array.isArray(candidates) || candidates.length <= 1) {
    return candidates || [];
  }

  const ratedCount = Object.keys(ratings).length;

  // Only gently boost the new expansion batch during early rating.
  if (ratedCount >= 30) {
    return candidates;
  }

  const expansionCandidates = candidates.filter((movie) => movie.id >= 251 && movie.id <= 304);
  const existingCandidates = candidates.filter((movie) => movie.id < 251 || movie.id > 304);

  if (expansionCandidates.length === 0 || existingCandidates.length === 0) {
    return candidates;
  }

  const boosted = [];
  const shuffledExpansion = getStableShuffledCandidates(expansionCandidates);
  const shuffledExisting = getStableShuffledCandidates(existingCandidates);

  let expansionIndex = 0;
  let existingIndex = 0;

  while (
    boosted.length < candidates.length &&
    (expansionIndex < shuffledExpansion.length || existingIndex < shuffledExisting.length)
  ) {
    // Roughly 1 new expansion film for every 3 existing films.
    for (let i = 0; i < 3 && existingIndex < shuffledExisting.length; i += 1) {
      boosted.push(shuffledExisting[existingIndex]);
      existingIndex += 1;
    }

    if (expansionIndex < shuffledExpansion.length) {
      boosted.push(shuffledExpansion[expansionIndex]);
      expansionIndex += 1;
    }
  }

  return boosted;
}
function getRecommendationCandidates() {
  return movies.filter((movie) => {
    if (seenMovies[movie.id]) return false;
    if (watchlistMovies[movie.id]) return false;

    const ukProviders = Array.isArray(movie.ukProviders) ? movie.ukProviders : [];

    return ukProviders.some((service) => availableServices[service]);
  });
}
function getStableShuffledCandidates(candidates) {
  if (!Array.isArray(candidates) || candidates.length <= 1) {
    return candidates || [];
  }

  const seedBase = `${getTodayKey()}-${Object.keys(ratings).length}`;
  const copy = [...candidates];
  const rand = createSeededRandom(seedBase);

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rand() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}
// =========================
// User actions
// =========================
function rateMovie(movieId, rating) {
  ratings[movieId] = rating;
  seenMovies[movieId] = true;
  delete skippedMovieState[movieId];
  advanceSessionStep();

  saveRatings();
  saveSeenMovies();
  clearDailyRecommendation();
  devProfileMessage = "";
  dismissedRecommendationIds = [];

  renderApp();
}
function rateMovieAndAdvance(movieId, rating) {
  rateMovie(movieId, rating);
}
function markWatchedAndAdvance(movieId) {
  if (!seenMovies[movieId]) {
    seenMovies[movieId] = true;
  }

  delete watchlistMovies[movieId];
  delete skippedMovieState[movieId];
  advanceSessionStep();
  saveSeenMovies();
  saveWatchlistMovies();
  clearDailyRecommendation();
  dismissedRecommendationIds = [];
  devProfileMessage = "";
  renderApp();
}
function addToWatchlistAndAdvance(movieId) {
  if (!movieId) return;

  watchlistMovies[movieId] = true;
  delete skippedMovieState[movieId];
  advanceSessionStep();
  saveWatchlistMovies();
  clearDailyRecommendation();
  dismissedRecommendationIds = [];
  devProfileMessage = "";
  renderApp();
}
function addRecommendationToWatchlist(movieId) {
  if (!movieId) return;

  watchlistMovies[movieId] = true;
  delete skippedMovieState[movieId];
  saveWatchlistMovies();
  clearDailyRecommendation();
  dismissedRecommendationIds = [];
  devProfileMessage = "";
  currentRecommendations = null;
  generateRecommendations();
}
function removeFromWatchlist(movieId) {
  if (!movieId) return;

  delete watchlistMovies[movieId];
  saveWatchlistMovies();
  clearDailyRecommendation();
  renderApp();
}
function markWatchlistItemSeen(movieId) {
  if (!movieId) return;

  delete watchlistMovies[movieId];
  seenMovies[movieId] = true;
  delete skippedMovieState[movieId];
  saveWatchlistMovies();
  saveSeenMovies();
  clearDailyRecommendation();
  dismissedRecommendationIds = [];
  renderApp();
}
function watchFromWatchlist(movieId) {
  if (!movieId) return;

  delete watchlistMovies[movieId];
  seenMovies[movieId] = true;
  delete skippedMovieState[movieId];

  createPendingFollowUp(movieId, "watchlist");

  saveWatchlistMovies();
  saveSeenMovies();
  clearDailyRecommendation();
  dismissedRecommendationIds = [];
  renderApp();
}
function skipMovie(movieId) {
  if (!movieId) return;

  seenMovies[movieId] = true;
  delete watchlistMovies[movieId];
  delete skippedMovieState[movieId];

  advanceSessionStep();
  saveSeenMovies();
  saveWatchlistMovies();
  clearDailyRecommendation();
  dismissedRecommendationIds = [];
  devProfileMessage = "";

  renderApp();
}
function clearSkippedMovies() {
  skippedMovieState = {};
  renderApp();
}
function isMovieSkippedForNow(movieId) {
  const state = skippedMovieState[movieId];
  if (!state) return false;

  if (ratingSessionStep >= state.releaseStep) {
    delete skippedMovieState[movieId];
    return false;
  }

  return true;
}
function getActiveSkippedMovieCount() {
  pruneSkippedMovieState();
  return Object.keys(skippedMovieState).length;
}
function pruneSkippedMovieState() {
  Object.keys(skippedMovieState).forEach((movieId) => {
    const numericMovieId = Number(movieId);
    const state = skippedMovieState[movieId];
    const movieStillExists = movies.some((movie) => movie.id === numericMovieId);

    if (!state || !movieStillExists || seenMovies[numericMovieId] || ratingSessionStep >= state.releaseStep) {
      delete skippedMovieState[movieId];
    }
  });
}
function advanceSessionStep() {
  ratingSessionStep += 1;
  pruneSkippedMovieState();
}
// =========================
// Recommendation engine
// =========================
function convertRatingToSignal(rating) {
  if (rating === 5) return 2.2;
  if (rating === 4) return 1.2;
  if (rating === 3) return 0;
  if (rating === 2) return -1.4;
  return -2.2;
}
function buildPreferenceProfile() {
  const genreTotals = {};
  const genreCounts = {};
  const toneTotals = {};
  const toneCounts = {};
  const energyTotals = {};
  const energyCounts = {};
  const weightTotals = {};
  const weightCounts = {};
  const styleTotals = {};
  const styleCounts = {};
  const humorTotals = {};
  const humorCounts = {};

  const ratedMovies = getRatedMovies();

  ratedMovies.forEach((movie) => {
    const rating = ratings[movie.id];
    const signal = convertRatingToSignal(rating);

    addSignal(genreTotals, genreCounts, movie.genre, signal);
    addSignal(toneTotals, toneCounts, movie.tone, signal);
    addSignal(energyTotals, energyCounts, movie.energy, signal);
    addSignal(weightTotals, weightCounts, movie.weight, signal);
    addSignal(styleTotals, styleCounts, movie.style, signal);
    addSignal(humorTotals, humorCounts, movie.humor, signal);
  });

  return {
    genreScores: averageSignalMap(genreTotals, genreCounts),
    toneScores: averageSignalMap(toneTotals, toneCounts),
    energyScores: averageSignalMap(energyTotals, energyCounts),
    weightScores: averageSignalMap(weightTotals, weightCounts),
    styleScores: averageSignalMap(styleTotals, styleCounts),
    humorScores: averageSignalMap(humorTotals, humorCounts),
    ratedMovies
  };
}
function addSignal(totalMap, countMap, key, signal) {
  totalMap[key] = (totalMap[key] || 0) + signal;
  countMap[key] = (countMap[key] || 0) + 1;
}
function averageSignalMap(totalMap, countMap) {
  const result = {};
  Object.keys(totalMap).forEach((key) => {
    result[key] = totalMap[key] / countMap[key];
  });
  return result;
}
function getRatedMovies() {
  return movies.filter((movie) => ratings[movie.id] !== undefined);
}
function getTopLikedMovies(limit = 5) {
  return getRatedMovies()
    .filter((movie) => ratings[movie.id] >= 4)
    .sort((a, b) => ratings[b.id] - ratings[a.id])
    .slice(0, limit);
}
function getDistinctPositiveCount(scoreMap, threshold = 0.25) {
  return Object.values(scoreMap).filter((score) => score > threshold).length;
}
function isComedyHeavyProfile(profile) {
  const comedyScore = profile.genreScores["Comedy"] || 0;
  const funToneScore = profile.toneScores["fun"] || 0;
  const humorHighScore = profile.humorScores["high"] || 0;
  const humorMediumScore = profile.humorScores["medium"] || 0;

  return (
    comedyScore >= 0.45 ||
    humorHighScore >= 0.45 ||
    (comedyScore >= 0.25 && humorMediumScore >= 0.2) ||
    (funToneScore >= 0.45 && humorHighScore >= 0.25)
  );
}
function scoreCandidateMovie(movie, profile, topLikedMovies) {
  let score = 0;

  const genreScore = profile.genreScores[movie.genre] || 0;
  const toneScore = profile.toneScores[movie.tone] || 0;
  const energyScore = profile.energyScores[movie.energy] || 0;
  const weightScore = profile.weightScores[movie.weight] || 0;
  const styleScore = profile.styleScores[movie.style] || 0;
  const humorScore = profile.humorScores[movie.humor] || 0;
  const isComedyProfile = isComedyHeavyProfile(profile);
  const emotionalToneScore = profile.toneScores["emotional"] || 0;

  const positiveGenreCount = getDistinctPositiveCount(profile.genreScores);
  const positiveStyleCount = getDistinctPositiveCount(profile.styleScores);
  const positiveWeightCount = getDistinctPositiveCount(profile.weightScores, 0.2);
  const positiveHumorCount = getDistinctPositiveCount(profile.humorScores, 0.2);
  const comedyHeavyProfile = isComedyHeavyProfile(profile);

  score += genreScore * 1.4;
  score += energyScore * 0.9;
  score += weightScore * 1.0;
  score += styleScore * 1.1;

  if (isComedyProfile) {
    score += toneScore * 1.6;
    score += humorScore * 2.2;
  } else {
    score += toneScore * 1.2;
    score += humorScore * 1.2;
  }

  if (emotionalToneScore > 0.3) {
    score += toneScore * 1.5;
  }

  if (movie.humor === "high") {
    score += 0.3;
  }

  let sameGenreLikedCount = 0;
  let sameToneLikedCount = 0;
  let sameEnergyLikedCount = 0;
  let sameWeightLikedCount = 0;
  let sameStyleLikedCount = 0;
  let sameHumorLikedCount = 0;
  let exactProfileLikedCount = 0;

  topLikedMovies.forEach((likedMovie) => {
    const sameGenre = likedMovie.genre === movie.genre;
    const sameTone = likedMovie.tone === movie.tone;
    const sameEnergy = likedMovie.energy === movie.energy;
    const sameWeight = likedMovie.weight === movie.weight;
    const sameStyle = likedMovie.style === movie.style;
    const sameHumor = likedMovie.humor === movie.humor;

    if (sameGenre) {
      sameGenreLikedCount += 1;
      score += 0.9;
    }

    if (sameTone) {
      sameToneLikedCount += 1;
      score += 0.12;
    }

    if (sameEnergy) {
      sameEnergyLikedCount += 1;
      score += 0.14;
    }

    if (sameWeight) {
      sameWeightLikedCount += 1;
      score += 0.45;
    }

    if (sameStyle) {
      sameStyleLikedCount += 1;
      score += 0.38;
    }

    if (sameHumor) {
      sameHumorLikedCount += 1;
      score += 0.55;
    }

    if (sameGenre && sameWeight && sameStyle) {
      exactProfileLikedCount += 1;
      score += 0.7;
    }
  });

  if (genreScore < -0.35) score -= 2.4;
  if (toneScore < -0.35) score -= 0.9;
  if (energyScore < -0.35) score -= 0.6;
  if (weightScore < -0.3) score -= 1.6;
  if (styleScore < -0.3) score -= 1.25;
  if (humorScore < -0.3) score -= 1.65;

  if (genreScore <= 0 && weightScore > 0.4 && styleScore > 0.4) {
    score -= 0.65;
  }

  if (genreScore <= 0 && sameGenreLikedCount === 0 && sameStyleLikedCount > 0) {
    score -= 0.75;
  }

  if (genreScore <= 0 && sameGenreLikedCount === 0 && sameWeightLikedCount > 0 && movie.weight !== "light") {
    score -= 0.5;
  }

  if (positiveGenreCount >= 2 && genreScore <= 0) {
    score -= 0.45;
  }

  if (positiveStyleCount >= 2 && styleScore <= 0) {
    score -= 0.35;
  }

  if (positiveWeightCount >= 2 && weightScore <= 0) {
    score -= 0.25;
  }

  if (positiveHumorCount >= 2 && humorScore <= 0) {
    score -= 0.4;
  }

  if (movie.weight === "heavy" && weightScore < 0.1 && toneScore < 0.1) {
    score -= 0.55;
  }

  if (movie.style === "heightened" && styleScore < 0.1 && toneScore < 0.1) {
    score -= 0.4;
  }

  if (movie.style === "spectacle" && genreScore <= 0 && weightScore <= 0) {
    score -= 0.35;
  }

  if (comedyHeavyProfile) {
    if (movie.humor === "high") score += 1.1;
    if (movie.humor === "medium") score += 0.45;
    if (movie.humor === "low") score -= 0.55;
    if (movie.humor === "none") score -= 1.35;

    if (movie.genre === "Comedy" && movie.humor === "high") {
      score += 0.9;
    }

    if (
      movie.genre !== "Comedy" &&
      movie.humor !== "high" &&
      movie.style === "heightened" &&
      movie.weight === "light"
    ) {
      score -= 0.7;
    }

    if (movie.genre !== "Comedy" && movie.humor === "low" && sameHumorLikedCount === 0) {
      score -= 0.6;
    }

    if (movie.humor === "low" && movie.weight === "light" && movie.style === "heightened") {
      score -= 0.35;
    }
  }

  if (!comedyHeavyProfile && movie.genre !== "Comedy" && movie.humor === "high" && genreScore < 0.15) {
    score -= 0.2;
  }

  if (exactProfileLikedCount >= 2) {
    score += 0.55;
  }

  score += stableTieBreaker(movie.id);

  return {
    ...movie,
    recommendationScore: Number(score.toFixed(4))
  };
}
function stableTieBreaker(movieId) {
  const today = getTodayKey();
  const seed = `${today}-${movieId}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  }

  return hash / 100000;
}
function pickWithDiversity(sortedMovies) {
  const result = [];

  if (sortedMovies.length === 0) return result;

  result.push(sortedMovies[0]);

  for (let i = 1; i < sortedMovies.length; i++) {
    const candidate = sortedMovies[i];

    const duplicateProfile = result.some((picked) => {
      return (
        picked.genre === candidate.genre &&
        picked.weight === candidate.weight &&
        picked.style === candidate.style &&
        picked.humor === candidate.humor
      );
    });

    if (!duplicateProfile) {
      result.push(candidate);
    }

    if (result.length === 3) break;
  }

  let fallbackIndex = 1;
  while (result.length < 3 && fallbackIndex < sortedMovies.length) {
    const fallbackMovie = sortedMovies[fallbackIndex];
    if (!result.includes(fallbackMovie)) {
      result.push(fallbackMovie);
    }
    fallbackIndex++;
  }

  return result;
}
function getTopPreference(scores, minimumScore = 0.15) {
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!entries.length || entries[0][1] < minimumScore) return null;

  return {
    label: entries[0][0],
    score: entries[0][1]
  };
}
function getTopDislike(scores, maximumScore = -0.15) {
  const entries = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  if (!entries.length || entries[0][1] > maximumScore) return null;

  return {
    label: entries[0][0],
    score: entries[0][1]
  };
}
function buildRecommendationReason(topPick, profile, topLikedMovies) {
  const parts = [];

  const genreScore = profile.genreScores[topPick.genre] || 0;
  const weightScore = profile.weightScores[topPick.weight] || 0;
  const styleScore = profile.styleScores[topPick.style] || 0;
  const humorScore = profile.humorScores[topPick.humor] || 0;
  const comedyHeavyProfile = isComedyHeavyProfile(profile);

  if (genreScore > 0.45) {
    parts.push(`you rate ${topPick.genre} films strongly`);
  }

  if (comedyHeavyProfile && humorScore > 0.35) {
    parts.push(`you are clearly responding to films with stronger humour`);
  } else if (weightScore > 0.35) {
    parts.push(`you are leaning toward ${topPick.weight} watches`);
  }

  if (styleScore > 0.35) {
    parts.push(`you are responding well to more ${topPick.style} films`);
  }

  const matchedLikedMovie = topLikedMovies.find((movie) => {
    return (
      movie.genre === topPick.genre ||
      movie.weight === topPick.weight ||
      movie.style === topPick.style ||
      movie.humor === topPick.humor
    );
  });

  if (matchedLikedMovie) {
    parts.push(`it overlaps with films you rated highly like ${matchedLikedMovie.title}`);
  }

  if (parts.length === 0) {
    return "This was the strongest overall fit from your unseen films on selected services.";
  }

  return `We chose this because ${parts.join(", ")}.`;
}
function buildTasteProfile(profile) {
  const topGenre = getTopPreference(profile.genreScores);
  const topWeight = getTopPreference(profile.weightScores, 0.2);
  const topStyle = getTopPreference(profile.styleScores, 0.2);
  const topHumor = getTopPreference(profile.humorScores, 0.2);
  const dislikedGenre = getTopDislike(profile.genreScores);
  const dislikedWeight = getTopDislike(profile.weightScores, -0.2);

  const segments = [];

  if (topGenre && topWeight) {
    segments.push(`You currently lean toward ${topWeight.label} ${topGenre.label.toLowerCase()} films.`);
  } else if (topGenre) {
    segments.push(`You currently lean toward ${topGenre.label.toLowerCase()} films.`);
  } else {
    segments.push("Your taste profile is still forming.");
  }

  if (topHumor && topHumor.label !== "low" && topHumor.label !== "none") {
    segments.push(`You are also showing a preference for more humour-led picks.`);
  } else if (topStyle) {
    segments.push(`You are also showing a preference for more ${topStyle.label} films.`);
  }

  if (dislikedGenre) {
    segments.push(`You are rating ${dislikedGenre.label.toLowerCase()} films lower than most.`);
  }

  if (dislikedWeight) {
    segments.push(`You are not leaning toward ${dislikedWeight.label} watches right now.`);
  }

  return segments.join(" ");
}
function buildWatchContext(topPick, profile) {
  const genreScore = profile.genreScores[topPick.genre] || 0;
  const weightScore = profile.weightScores[topPick.weight] || 0;
  const styleScore = profile.styleScores[topPick.style] || 0;
  const humorScore = profile.humorScores[topPick.humor] || 0;
  const comedyHeavyProfile = isComedyHeavyProfile(profile);

  if (comedyHeavyProfile && humorScore > 0.45 && topPick.humor === "high") {
    return "A strong comedy-first match with the level of humour your profile is pointing toward.";
  }

  if (genreScore > 0.65 && weightScore > 0.45 && styleScore > 0.35) {
    return `A strong fit for tonight: ${topPick.weight}, ${topPick.style}, and clearly in your preferred lane.`;
  }

  if (genreScore > 0.65 && weightScore > 0.35) {
    return `A strong ${topPick.genre.toLowerCase()} match with the right viewing weight for you tonight.`;
  }

  if (styleScore > 0.45 && weightScore > 0.35) {
    return `A solid style and viewing-weight match from your available services.`;
  }

  return "A balanced pick from what is available to you right now.";
}
function buildConfidenceLabel(ratedCount, topScore, secondScore, profile, topPick, topLikedMovies) {
  if (!topPick) return "Low";

  const scoreGap = topScore - secondScore;
  const preferenceStrength = calculatePreferenceStrength(profile);

  if (
    ratedCount >= 10 &&
    scoreGap > 0.15 &&
    preferenceStrength > 0.6
  ) {
    return "High";
  }

  if (
    ratedCount >= 6 &&
    scoreGap > 0.08 &&
    preferenceStrength > 0.4
  ) {
    return "Medium";
  }

  return "Low";
}
function calculatePreferenceStrength(profile) {
  if (!profile) return 0;

  const maxPositiveScore = (scoreMap) => {
    if (!scoreMap || typeof scoreMap !== "object") return 0;

    const values = Object.values(scoreMap)
      .filter((value) => typeof value === "number" && Number.isFinite(value));

    if (values.length === 0) return 0;

    return Math.max(0, ...values);
  };

  const genreStrength = maxPositiveScore(profile.genreScores);
  const toneStrength = maxPositiveScore(profile.toneScores);
  const styleStrength = maxPositiveScore(profile.styleScores);
  const weightStrength = maxPositiveScore(profile.weightScores);
  const humorStrength = maxPositiveScore(profile.humorScores);

  const weightedAverage =
    genreStrength * 0.3 +
    toneStrength * 0.2 +
    styleStrength * 0.2 +
    weightStrength * 0.15 +
    humorStrength * 0.15;

  return Math.min(weightedAverage, 1);
}
function generateRecommendations() {
  const candidates = getRecommendationCandidates().filter(
    (movie) => !dismissedRecommendationIds.includes(movie.id)
  );

  if (candidates.length === 0) {
    currentRecommendations = {
      topPick: null,
      alternatives: [],
      confidence: "Low",
      reason: "No suitable candidates were available.",
      tasteProfile: "Your taste profile is still forming.",
      watchContext: "No available watch context."
    };

    saveDailyRecommendation();
    isBrowsingMoreFilms = false;
    renderApp();
    scrollAppToTop();
    return;
  }

  const profile = buildPreferenceProfile();
  const topLikedMovies = getTopLikedMovies(5);

  const scored = candidates.map((movie) =>
    scoreCandidateMovie(movie, profile, topLikedMovies)
  );
  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

  const selected = pickWithDiversity(scored);
  const topPick = selected[0] || null;
  const ratedCount = Object.keys(ratings).length;
  const topScore = scored[0]?.recommendationScore || 0;
  const secondScore = scored[1]?.recommendationScore || 0;

  currentRecommendations = {
    topPick,
    alternatives: selected.slice(1, 3),
    confidence: topPick
      ? buildConfidenceLabel(ratedCount, topScore, secondScore, profile, topPick, topLikedMovies)
      : "Low",
    reason: topPick
      ? buildRecommendationReason(topPick, profile, topLikedMovies)
      : "No suitable recommendation reason available.",
    tasteProfile: buildTasteProfile(profile),
    watchContext: topPick
      ? buildWatchContext(topPick, profile)
      : "No available watch context."
  };

  saveDailyRecommendation();
  isBrowsingMoreFilms = false;
  renderApp();
  scrollAppToTop();
}
function renderServiceCheckboxes() {
  const container = document.getElementById("service-controls");
  if (!container) return;

  container.innerHTML = SUPPORTED_SERVICES
    .map((serviceKey) => {
      const checked = availableServices[serviceKey] ? "checked" : "";
      const label = SERVICE_LABELS[serviceKey] || serviceKey;

      return `
        <label>
          <input type="checkbox" value="${escapeAttribute(serviceKey)}" ${checked} />
          ${escapeHtml(label)}
        </label>
      `;
    })
    .join("");

  container.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.addEventListener("change", (event) => {
      toggleService(event.target.value);
    });
  });
}
function toggleService(serviceKey) {
  const normalizedServiceKey = normalizeServiceKey(serviceKey);
  if (!normalizedServiceKey) return;

  availableServices[normalizedServiceKey] = !availableServices[normalizedServiceKey];
  saveServicePreferences();
  visibleCount = PAGE_SIZE;
  clearDailyRecommendation();
  devProfileMessage = "";
  dismissedRecommendationIds = [];
  renderApp();
}
function toggleSeenState(movieId) {
  if (seenMovies[movieId]) {
    delete seenMovies[movieId];
  } else {
    seenMovies[movieId] = true;
    delete skippedMovieState[movieId];
  }

  visibleCount = PAGE_SIZE;
  saveSeenMovies();
  clearDailyRecommendation();
  devProfileMessage = "";
  renderApp();
}
function devApplyRating(movieId, rating) {
  rateMovie(movieId, rating);
}
function devToggleSeen(movieId) {
  toggleSeenState(movieId);
}
function devClearRating(movieId) {
  delete ratings[movieId];
  delete seenMovies[movieId];
  delete skippedMovieState[movieId];
  saveRatings();
  saveSeenMovies();
  clearDailyRecommendation();
  devProfileMessage = "";
  renderApp();
}
function clearDevSessionState() {
  const confirmClear = confirm("Clear all ratings and watched state for this test run?");
  if (!confirmClear) return;

  ratings = {};
  seenMovies = {};
  watchlistMovies = {};
  currentRecommendations = null;
  skippedMovieState = {};
  ratingSessionStep = 0;
  visibleCount = PAGE_SIZE;
  devProfileMessage = "";
  dismissedRecommendationIds = [];
  isBrowsingMoreFilms = false;

  localStorage.removeItem(RATINGS_STORAGE_KEY);
  localStorage.removeItem(SEEN_STORAGE_KEY);
  localStorage.removeItem(WATCHLIST_STORAGE_KEY);
  localStorage.removeItem(DAILY_STORAGE_KEY);

  clearPendingFollowUp();

  renderApp();
}
function applyTestProfile(profileId) {
  const profile = TEST_PROFILES.find((item) => item.id === profileId);
  if (!profile) {
    devProfileMessage = "Test profile not found.";
    renderApp();
    return;
  }
  clearPendingFollowUp();

  const confirmApply = confirm(
    `Apply ${profile.label}? This will clear current ratings, watched state, skipped queue, and today's recommendation.`
  );

  if (!confirmApply) return;

  ratings = {};
  seenMovies = {};
  watchlistMovies = {};
  currentRecommendations = null;
  skippedMovieState = {};
  ratingSessionStep = 0;
  visibleCount = PAGE_SIZE;
  dismissedRecommendationIds = [];
  isBrowsingMoreFilms = false;
  availableServices = {
    netflix: true,
    prime: true,
    nowtv: true,
    disney: true
  };

  const missingTitles = [];

  profile.ratings.forEach(([title, rating]) => {
    const movie = findMovieByTitle(title);
    if (!movie) {
      missingTitles.push(title);
      return;
    }

    ratings[movie.id] = rating;
    seenMovies[movie.id] = true;
  });

  saveRatings();
  saveSeenMovies();
  saveServicePreferences();
  clearDailyRecommendation();

  if (Object.keys(ratings).length >= MIN_RATINGS) {
    generateRecommendations();
  } else {
    devProfileMessage = `${profile.label} applied, but not enough ratings were found to generate a recommendation.`;
    renderApp();
    return;
  }

  const missingNote = missingTitles.length
    ? ` Missing titles: ${missingTitles.join(", ")}.`
    : "";

  devProfileMessage = `${profile.label} applied and recommendation generated.${missingNote}`;
  renderApp();
}
function findMovieByTitle(title) {
  const normalizedTarget = normalizeTitle(title);
  return movies.find((movie) => normalizeTitle(movie.title) === normalizedTarget) || null;
}
function normalizeTitle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[’]/g, "'")
    .replace(/[“”]/g, '"');
}
function connectHiddenDevModeToggle() {
  document.addEventListener("keydown", (event) => {
    if (event.shiftKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      toggleDevMode();
    }
  });
}
function toggleDevMode(forceState) {
  if (typeof forceState === "boolean") {
    isDevMode = forceState;
  } else {
    isDevMode = !isDevMode;
  }

  localStorage.setItem(DEV_MODE_STORAGE_KEY, JSON.stringify(isDevMode));
  renderApp();
}
function loadDevModePreference() {
  const raw = localStorage.getItem(DEV_MODE_STORAGE_KEY);

  if (!raw) {
    isDevMode = false;
    return;
  }

  try {
    isDevMode = Boolean(JSON.parse(raw));
  } catch (error) {
    isDevMode = false;
    localStorage.removeItem(DEV_MODE_STORAGE_KEY);
  }
}
// =========================
// Storage helpers
// =========================
function getTodayKey() {
  return new Date().toDateString();
}
function savePendingFollowUp() {
  if (!pendingFollowUp) {
    localStorage.removeItem(PENDING_FOLLOW_UP_STORAGE_KEY);
    return;
  }

  localStorage.setItem(PENDING_FOLLOW_UP_STORAGE_KEY, JSON.stringify(pendingFollowUp));
}
function loadPendingFollowUp() {
  const raw = localStorage.getItem(PENDING_FOLLOW_UP_STORAGE_KEY);

  if (!raw) {
    pendingFollowUp = null;
    return;
  }

  try {
    pendingFollowUp = JSON.parse(raw) || null;
  } catch (error) {
    pendingFollowUp = null;
    localStorage.removeItem(PENDING_FOLLOW_UP_STORAGE_KEY);
  }
}
function clearPendingFollowUp() {
  pendingFollowUp = null;
  localStorage.removeItem(PENDING_FOLLOW_UP_STORAGE_KEY);
}
function saveDailyRecommendation() {
  const payload = {
    date: getTodayKey(),
    data: currentRecommendations
  };
  localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(payload));
}
function loadDailyRecommendation() {
  const raw = localStorage.getItem(DAILY_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);

    if (parsed.date === getTodayKey()) {
      currentRecommendations = parsed.data;
    } else {
      clearDailyRecommendation();
    }
  } catch (error) {
    clearDailyRecommendation();
  }
}
function createPendingFollowUp(movieId, source = "top-pick") {
  const movie = movies.find((item) => item.id === movieId);
  if (!movie) return;

  pendingFollowUp = {
    movieId,
    title: movie.title,
    createdAt: Date.now(),
    source
  };

  savePendingFollowUp();
}
function clearDailyRecommendation() {
  currentRecommendations = null;
  localStorage.removeItem(DAILY_STORAGE_KEY);
}
function saveRatings() {
  localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));
}
function ratePendingFollowUp(rating) {
  if (!pendingFollowUp || !pendingFollowUp.movieId) return;

  const movieId = pendingFollowUp.movieId;

  ratings[movieId] = rating;
  seenMovies[movieId] = true;
  delete skippedMovieState[movieId];

  saveRatings();
  saveSeenMovies();
  clearPendingFollowUp();
  clearDailyRecommendation();
  dismissedRecommendationIds = [];
  devProfileMessage = "";

  renderApp();
}
function dismissPendingFollowUp() {
  clearPendingFollowUp();
  renderApp();
}
function loadRatings() {
  const raw = localStorage.getItem(RATINGS_STORAGE_KEY);

  if (!raw) {
    ratings = {};
    return;
  }

  try {
    ratings = JSON.parse(raw) || {};
  } catch (error) {
    ratings = {};
    localStorage.removeItem(RATINGS_STORAGE_KEY);
  }
}
function saveSeenMovies() {
  localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(seenMovies));
}
function loadSeenMovies() {
  const raw = localStorage.getItem(SEEN_STORAGE_KEY);

  if (!raw) {
    seenMovies = {};
    return;
  }

  try {
    seenMovies = JSON.parse(raw) || {};
  } catch (error) {
    seenMovies = {};
    localStorage.removeItem(SEEN_STORAGE_KEY);
  }
}
function saveWatchlistMovies() {
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlistMovies));
}
function loadWatchlistMovies() {
  const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);

  if (!raw) {
    watchlistMovies = {};
    return;
  }

  try {
    watchlistMovies = JSON.parse(raw) || {};
  } catch (error) {
    watchlistMovies = {};
    localStorage.removeItem(WATCHLIST_STORAGE_KEY);
  }
}
function saveServicePreferences() {
  localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(availableServices));
}
function loadServicePreferences() {
  const raw = localStorage.getItem(SERVICES_STORAGE_KEY);

  if (!raw) {
    availableServices = getDefaultAvailableServices();
    return;
  }

  try {
    const parsed = JSON.parse(raw) || {};

    availableServices = {
      ...getDefaultAvailableServices(),
      ...parsed
    };

    if ("hbo" in availableServices && !("nowtv" in parsed)) {
      availableServices.nowtv = Boolean(availableServices.hbo);
    }

    delete availableServices.hbo;

    SUPPORTED_SERVICES.forEach((serviceKey) => {
      availableServices[serviceKey] = Boolean(availableServices[serviceKey]);
    });
  } catch (error) {
    availableServices = getDefaultAvailableServices();
    localStorage.removeItem(SERVICES_STORAGE_KEY);
  }
}
function connectResetButton() {
  const btn = document.getElementById("reset-btn");
  if (!btn) return;

  btn.addEventListener("click", resetApp);
}
function resetApp() {
  const confirmReset = confirm(
    "Are you sure you want to reset all ratings, watched state, services, and recommendations?"
  );

  if (!confirmReset) return;

  ratings = {};
  seenMovies = {};
  watchlistMovies = {};
  availableServices = {
    netflix: true,
    prime: true,
    nowtv: true,
    disney: true
  };
  currentRecommendations = null;
  skippedMovieState = {};
  ratingSessionStep = 0;
  visibleCount = PAGE_SIZE;
  devProfileMessage = "";
  pendingFollowUp = null;
  dismissedRecommendationIds = [];
  isBrowsingMoreFilms = false;

  localStorage.removeItem(RATINGS_STORAGE_KEY);
  localStorage.removeItem(SEEN_STORAGE_KEY);
  localStorage.removeItem(WATCHLIST_STORAGE_KEY);
  localStorage.removeItem(SERVICES_STORAGE_KEY);
  localStorage.removeItem(DAILY_STORAGE_KEY);
  localStorage.removeItem(PENDING_FOLLOW_UP_STORAGE_KEY);

  renderApp();
}
// =========================
// Utility helpers
// =========================
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttribute(value) {
  return escapeHtml(value);
}
function escapeJsString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}
function dismissCurrentTopPick() {
  if (!currentRecommendations || !currentRecommendations.topPick) return;

  const movieId = currentRecommendations.topPick.id;

  if (!dismissedRecommendationIds.includes(movieId)) {
    dismissedRecommendationIds.push(movieId);
  }

  currentRecommendations = null;
  generateRecommendations();
}
window.rateMovie = rateMovie;
window.toggleSeenState = toggleSeenState;
window.rateMovieAndAdvance = rateMovieAndAdvance;
window.markWatchedAndAdvance = markWatchedAndAdvance;
window.skipMovie = skipMovie;
window.clearSkippedMovies = clearSkippedMovies;
window.toggleDevMode = toggleDevMode;
window.devApplyRating = devApplyRating;
window.devToggleSeen = devToggleSeen;
window.devClearRating = devClearRating;
window.clearDevSessionState = clearDevSessionState;
window.applyTestProfile = applyTestProfile;
window.promoteAlternativeToTopPick = promoteAlternativeToTopPick;
window.markRecommendationSeen = markRecommendationSeen;
window.returnToMovieList = returnToMovieList;
window.ratePendingFollowUp = ratePendingFollowUp;
window.dismissPendingFollowUp = dismissPendingFollowUp;
window.dismissCurrentTopPick = dismissCurrentTopPick;
window.addToWatchlistAndAdvance = addToWatchlistAndAdvance;
window.addRecommendationToWatchlist = addRecommendationToWatchlist;
window.removeFromWatchlist = removeFromWatchlist;
window.markWatchlistItemSeen = markWatchlistItemSeen;
window.watchFromWatchlist = watchFromWatchlist;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}