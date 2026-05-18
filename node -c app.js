[1mdiff --git a/app.js b/app.js[m
[1mindex 35a29a4..c2c9dda 100644[m
[1m--- a/app.js[m
[1m+++ b/app.js[m
[36m@@ -621,7 +621,7 @@[m [mfunction renderApp() {[m
     ${showServiceControls ? `[m
       <section class="section-card">[m
         <h3 class="section-title">Available services</h3>[m
[31m-        <p class="section-copy">Choose the streaming platforms you have access to:</p>[m
[32m+[m[32m        <p class="section-copy">Choose the streaming platforms you have access to. Availability may vary by subscription tier or regional catalogue updates.</p>[m
         <div class="service-controls" id="service-controls"></div>[m
         <p class="section-copy" style="margin-top: 8px;">Total catalog: ${movies.length} films</p>[m
         ${skippedCount > 0 ? `<p class="section-copy" style="margin-top: 8px;">Skipped for now: ${skippedCount}</p>` : ""}[m
[36m@@ -679,6 +679,11 @@[m [mfunction renderRatingScreen(screen, ratedCount, candidateCount) {[m
           <button class="ghost-btn" onclick="clearSkippedMovies()">Clear skipped queue</button>[m
         </div>[m
       </section>[m
[32m+[m[32m      <div class="section-card">[m
[32m+[m[32m  <button id="share-pick-btn" class="secondary-btn">[m
[32m+[m[32m    Share this recommendation[m
[32m+[m[32m  </button>[m
[32m+[m[32m</div>[m
     `;[m
     return;[m
   }[m
[36m@@ -694,7 +699,7 @@[m [mfunction renderRatingScreen(screen, ratedCount, candidateCount) {[m
         ${[m
           showUpdatedRecommendationCta[m
             ? "Rate more films to sharpen the pick, then generate an updated recommendation whenever you are ready."[m
[31m-            : "Rate quickly and we will choose one strong pick from your available unseen films."[m
[32m+[m[32m            : "Rated films are treated as already watched and help NoScroll learn your preferences."[m
         }[m
       </p>[m
       <div class="progress-pill">Rated ${ratedCount} / ${MIN_RATINGS}</div>[m
[36m@@ -832,7 +837,7 @@[m [mfunction renderRevealScreen(screen, ratedCount, candidateCount) {[m
     <section class="hero-card">[m
       <p class="hero-kicker">Ready</p>[m
       <h2 class="hero-title">Reveal your recommendation</h2>[m
[31m-      <p class="hero-text">You have rated enough films to generate a pick.</p>[m
[32m+[m[32m      <p class="hero-text">You have rated enough films to generate a pick. Rate more films if you want a stronger match.</p>[m
       <div class="progress-pill">Rated ${ratedCount} films</div>[m
       <div class="progress-pill">Available candidates: ${candidateCount}</div>[m
     </section>[m
[36m@@ -899,11 +904,18 @@[m [mconst backupLabels = ["Closest match", "Something different", "Wildcard pick"];[m
 <p class="alt-card-reason">${escapeHtml(backupLabels[index] || "Backup pick")}</p>[m
 <p class="alt-card-meta">${escapeHtml(formatDisplayLabel(movie.genre))} · ${escapeHtml(formatDisplayLabel(movie.tone))}</p>            <p class="alt-card-reason">${escapeHtml(buildBackupReason(movie, topPick))}</p>[m
 [m
[31m-            <div class="alt-card-actions">[m
[31m-              <button class="ghost-btn" onclick="promoteAlternativeToTopPick(${movie.id})">Pick this instead</button>[m
[31m-              <button class="ghost-btn" onclick="addRecommendationToWatchlist(${movie.id})">Save for later</button>[m
[31m-              <button class="ghost-btn" onclick="markRecommendationSeen(${movie.id})">Seen it</button>[m
[31m-            </div>[m
[32m+[m[32m            <div class="alt-card-actions compact-alt-actions">[m
[32m+[m[32m              <button class="ghost-btn compact-action-btn" onclick="promoteAlternativeToTopPick(${movie.id})">[m
[32m+[m[32m  Pick this[m
[32m+[m[32m</button>[m
[32m+[m
[32m+[m[32m<button class="ghost-btn compact-action-btn" onclick="addRecommendationToWatchlist(${movie.id})">[m
[32m+[m[32m  Save[m
[32m+[m[32m</button>[m
[32m+[m
[32m+[m[32m<button class="ghost-btn compact-action-btn" onclick="markRecommendationSeen(${movie.id})">[m
[32m+[m[32m  Seen[m
[32m+[m[32m</button>[m
           </div>[m
         </article>[m
       `;[m
[36m@@ -931,7 +943,7 @@[m [mconst backupLabels = ["Closest match", "Something different", "Wildcard pick"];[m
 [m
 [m
 [m
[31m-        <div class="availability-box">[m
[32m+[m[32m                <div class="availability-box">[m
           <p class="section-title">Available on your services</p>[m
           <div class="pick-confidence-row" style="margin-top: 12px;">[m
             ${matchedProviderLabels.length > 0[m
[36m@@ -940,17 +952,43 @@[m [mconst backupLabels = ["Closest match", "Something different", "Wildcard pick"];[m
                   .join("")[m
               : `<span class="provider-chip">${escapeHtml(availableTonightCopy)}</span>`}[m
           </div>[m
[32m+[m[32m          <p class="section-copy" style="margin-top: 10px; font-size: 0.85rem;">[m
[32m+[m[32m            Availability can occasionally vary by subscription tier and provider catalogue updates.[m
[32m+[m[32m          </p>[m
         </div>[m
 [m
         <div class="pick-watch-box">[m
[31m-          <p class="pick-watch-copy">This is your best next watch.</p>[m
[32m+[m[32m          <p class="pick-watch-copy">Tonights suggested viewing! Seen it already? Hit rate more/mark seen to improve your next recommendation.</p>[m
         </div>[m
 [m
[31m-        <div class="pick-action-row">[m
[31m-  <button class="primary-btn" onclick="markRecommendationSeen(${topPick.id})">Play this tonight</button>[m
[31m-  <button class="ghost-btn" onclick="addRecommendationToWatchlist(${topPick.id})">Save for later</button>[m
[31m-  <button class="ghost-btn" onclick="dismissCurrentTopPick()">Not feeling it</button>[m
[31m-  <button class="ghost-btn" onclick="returnToMovieList()">Rate more films</button>[m
[32m+[m[32m       <div class="pick-primary-action">[m
[32m+[m[32m  <button class="primary-btn cinematic-primary-btn" onclick="markRecommendationSeen(${topPick.id})">[m
[32m+[m[32m    Play this tonight[m
[32m+[m[32m  </button>[m
[32m+[m[32m</div>[m
[32m+[m
[32m+[m[32m<div class="pick-secondary-actions">[m
[32m+[m[32m  <button class="ghost-btn compact-action-btn" onclick="addRecommendationToWatchlist(${topPick.id})">[m
[32m+[m[32m    Save[m
[32m+[m[32m  </button>[m
[32m+[m
[32m+[m[32m  <button class="ghost-btn compact-action-btn" onclick="shareTonightPick()">[m
[32m+[m[32m    Share[m
[32m+[m[32m  </button>[m
[32m+[m
[32m+[m[32m  <button class="ghost-btn compact-action-btn" onclick="dismissCurrentTopPick()">[m
[32m+[m[32m    Not feeling it[m
[32m+[m[32m  </button>[m
[32m+[m[32m</div>[m
[32m+[m
[32m+[m[32m<div class="pick-tertiary-actions">[m
[32m+[m[32m  <button class="text-action-btn" onclick="returnToMovieList()">[m
[32m+[m[32m    Rate more films / mark seen[m
[32m+[m[32m  </button>[m
[32m+[m
[32m+[m[32m  <button class="text-action-btn" onclick="sendTesterFeedback()">[m
[32m+[m[32m    Send feedback[m
[32m+[m[32m  </button>[m
 </div>[m
 [m
 [m
[36m@@ -973,9 +1011,12 @@[m [mconst backupLabels = ["Closest match", "Something different", "Wildcard pick"];[m
 [m
     <section class="section-card alt-section">[m
       <h3 class="section-title">Because you liked this, you might also enjoy:</h3>[m
[31m-      <div class="alt-card-list">[m
[31m-        ${alternativesMarkup || `<p class="section-copy">No alternatives available.</p>`}[m
[31m-      </div>[m
[32m+[m[32m      <p class="section-copy" style="margin-top: 8px;">[m
[32m+[m[32m        Backup options also use your selected services, but availability can vary by subscription tier.[m
[32m+[m[32m      </p>[m
[32m+[m[32m      <div class="alt-card-list compact-alternatives-rail">[m
[32m+[m[32m  ${alternativesMarkup || `<p class="section-copy">No alternatives available.</p>`}[m
[32m+[m[32m</div>[m
     </section>[m
   `;[m
 [m
[36m@@ -1111,7 +1152,6 @@[m [mfunction markRecommendationSeen(movieId) {[m
   generateRecommendations();[m
 }[m
 function returnToMovieList() {[m
[31m-  dismissedRecommendationIds = [];[m
   currentRecommendations = null;[m
   isBrowsingMoreFilms = true;[m
   renderApp();[m
[36m@@ -2641,18 +2681,121 @@[m [mfunction escapeJsString(value) {[m
     .replace(/\\/g, "\\\\")[m
     .replace(/'/g, "\\'");[m
 }[m
[32m+[m[32mfunction rememberDismissedRecommendationIds(movieIds) {[m
[32m+[m[32m  if (!Array.isArray(movieIds)) return;[m
[32m+[m
[32m+[m[32m  movieIds.forEach((movieId) => {[m
[32m+[m[32m    const numericMovieId = Number(movieId);[m
[32m+[m
[32m+[m[32m    if (numericMovieId && !dismissedRecommendationIds.includes(numericMovieId)) {[m
[32m+[m[32m      dismissedRecommendationIds.push(numericMovieId);[m
[32m+[m[32m    }[m
[32m+[m[32m  });[m
[32m+[m[32m}[m
 function dismissCurrentTopPick() {[m
   if (!currentRecommendations || !currentRecommendations.topPick) return;[m
 [m
[31m-  const movieId = currentRecommendations.topPick.id;[m
[32m+[m[32m  const visibleRecommendationIds = [[m
[32m+[m[32m    currentRecommendations.topPick.id,[m
[32m+[m[32m    ...(Array.isArray(currentRecommendations.alternatives)[m
[32m+[m[32m      ? currentRecommendations.alternatives.map((movie) => movie.id)[m
[32m+[m[32m      : [])[m
[32m+[m[32m  ];[m
 [m
[31m-  if (!dismissedRecommendationIds.includes(movieId)) {[m
[31m-    dismissedRecommendationIds.push(movieId);[m
[31m-  }[m
[32m+[m[32m  rememberDismissedRecommendationIds(visibleRecommendationIds);[m
 [m
   currentRecommendations = null;[m
[32m+[m[32m  clearDailyRecommendation();[m
   generateRecommendations();[m
 }[m
[32m+[m[32mfunction getNoScrollAppUrl() {[m
[32m+[m[32m  return window.location.origin + window.location.pathname;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mfunction buildTonightPickShareText() {[m
[32m+[m[32m  if (!currentRecommendations || !currentRecommendations.topPick) {[m
[32m+[m[32m    return "";[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  const topPick = currentRecommendations.topPick;[m
[32m+[m[32m  const ratedCount = Object.keys(ratings).length;[m
[32m+[m[32m  const confidencePercent = getConfidencePercent(currentRecommendations.confidence, ratedCount);[m
[32m+[m[32m  const providerLabels = getMatchedUkProviderLabels(topPick);[m
[32m+[m[32m  const providersCopy = providerLabels.length > 0 ? providerLabels.join(", ") : "your selected services";[m
[32m+[m
[32m+[m[32m  return [[m
[32m+[m[32m    `NoScroll picked ${topPick.title} for me tonight.`,[m
[32m+[m[32m    `${confidencePercent}% match.`,[m
[32m+[m[32m    `Available on: ${providersCopy}.`,[m
[32m+[m[32m    getNoScrollAppUrl()[m
[32m+[m[32m  ].join("\n");[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32masync function shareTonightPick() {[m
[32m+[m[32m  const shareText = buildTonightPickShareText();[m
[32m+[m
[32m+[m[32m  if (!shareText) {[m
[32m+[m[32m    alert("No recommendation is available to share yet.");[m
[32m+[m[32m    return;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  const title = currentRecommendations.topPick.title;[m
[32m+[m
[32m+[m[32m  try {[m
[32m+[m[32m    if (navigator.share) {[m
[32m+[m[32m      await navigator.share({[m
[32m+[m[32m        title: `NoScroll pick: ${title}`,[m
[32m+[m[32m        text: shareText,[m
[32m+[m[32m        url: getNoScrollAppUrl()[m
[32m+[m[32m      });[m
[32m+[m[32m      return;[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    if (navigator.clipboard && navigator.clipboard.writeText) {[m
[32m+[m[32m      await navigator.clipboard.writeText(shareText);[m
[32m+[m[32m      alert("Recommendation copied to clipboard.");[m
[32m+[m[32m      return;[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    window.prompt("Copy your recommendation:", shareText);[m
[32m+[m[32m  } catch (error) {[m
[32m+[m[32m    console.warn("Share failed:", error);[m
[32m+[m[32m  }[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mfunction sendTesterFeedback() {[m
[32m+[m[32m  const feedbackEmail = "marc.meylan@outlook.com";[m
[32m+[m[32m  const topPick = currentRecommendations?.topPick;[m
[32m+[m[32m  const ratedCount = Object.keys(ratings).length;[m
[32m+[m[32m  const confidencePercent = currentRecommendations[m
[32m+[m[32m    ? getConfidencePercent(currentRecommendations.confidence, ratedCount)[m
[32m+[m[32m    : "";[m
[32m+[m
[32m+[m[32m  const providerLabels = topPick ? getMatchedUkProviderLabels(topPick) : [];[m
[32m+[m[32m  const providersCopy = providerLabels.length > 0 ? providerLabels.join(", ") : "Not available";[m
[32m+[m
[32m+[m[32m  const subject = "NoScroll tester feedback";[m
[32m+[m[32m  const body = [[m
[32m+[m[32m    "NoScroll tester feedback",[m
[32m+[m[32m    "",[m
[32m+[m[32m    `Current pick: ${topPick?.title || "No active pick"}`,[m
[32m+[m[32m    `Match: ${confidencePercent ? `${confidencePercent}%` : "Not available"}`,[m
[32m+[m[32m    `Providers: ${providersCopy}`,[m
[32m+[m[32m    `App URL: ${getNoScrollAppUrl()}`,[m
[32m+[m[32m    "",[m
[32m+[m[32m    "What worked well?",[m
[32m+[m[32m    "",[m
[32m+[m[32m    "What felt wrong or confusing?",[m
[32m+[m[32m    "",[m
[32m+[m[32m    "Was the recommendation accurate?",[m
[32m+[m[32m    "",[m
[32m+[m[32m    "Any provider/availability issue?",[m
[32m+[m[32m    "",[m
[32m+[m[32m    "Other comments:"[m
[32m+[m[32m  ].join("\n");[m
[32m+[m
[32m+[m[32m  window.location.href = `mailto:${encodeURIComponent(feedbackEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;[m
[32m+[m[32m}[m
 window.rateMovie = rateMovie;[m
 window.toggleSeenState = toggleSeenState;[m
 window.rateMovieAndAdvance = rateMovieAndAdvance;[m
[36m@@ -2670,8 +2813,7 @@[m [mwindow.markRecommendationSeen = markRecommendationSeen;[m
 window.returnToMovieList = returnToMovieList;[m
 window.ratePendingFollowUp = ratePendingFollowUp;[m
 window.dismissPendingFollowUp = dismissPendingFollowUp;[m
[31m-window.dismissCurrentTopPick = dismissCurrentTopPick;[m
[31m-window.addToWatchlistAndAdvance = addToWatchlistAndAdvance;[m
[32m+[m
 window.addRecommendationToWatchlist = addRecommendationToWatchlist;[m
 window.removeFromWatchlist = removeFromWatchlist;[m
 window.markWatchlistItemSeen = markWatchlistItemSeen;[m
[1mdiff --git a/style.css b/style.css[m
[1mindex b8c2914..038b33c 100644[m
[1m--- a/style.css[m
[1m+++ b/style.css[m
[36m@@ -1070,4 +1070,817 @@[m [mmain {[m
 }[m
 .section-card {[m
   margin-bottom: 20px;[m
[31m-}[m
\ No newline at end of file[m
[32m+[m[32m}[m
[32m+[m[32m/* =========================================================[m
[32m+[m[32m   NoScroll V2 Foundation — Controlled Cinematic Direction[m
[32m+[m[32m   Safe CSS-only visual foundation pass[m
[32m+[m[32m   ========================================================= */[m
[32m+[m
[32m+[m[32m:root {[m
[32m+[m[32m  --bg: #070b14;[m
[32m+[m[32m  --bg-elevated: rgba(255, 255, 255, 0.045);[m
[32m+[m[32m  --bg-elevated-strong: rgba(255, 255, 255, 0.075);[m
[32m+[m[32m  --bg-soft: rgba(255, 255, 255, 0.035);[m
[32m+[m[32m  --bg-dark-soft: rgba(0, 0, 0, 0.22);[m
[32m+[m
[32m+[m[32m  --border: rgba(255, 255, 255, 0.085);[m
[32m+[m[32m  --border-strong: rgba(255, 255, 255, 0.16);[m
[32m+[m
[32m+[m[32m  --text: #f8f7fb;[m
[32m+[m[32m  --text-soft: rgba(248, 247, 251, 0.72);[m
[32m+[m[32m  --text-muted: rgba(248, 247, 251, 0.50);[m
[32m+[m
[32m+[m[32m  --accent: #ffffff;[m
[32m+[m[32m  --accent-dark: #080b13;[m
[32m+[m
[32m+[m[32m  --violet-bg: rgba(139, 92, 246, 0.18);[m
[32m+[m[32m  --violet-border: rgba(167, 139, 250, 0.30);[m
[32m+[m[32m  --violet-text: #d8c7ff;[m
[32m+[m
[32m+[m[32m  --purple-glow: rgba(126, 87, 255, 0.22);[m
[32m+[m[32m  --blue-glow: rgba(28, 147, 255, 0.12);[m
[32m+[m
[32m+[m[32m  --shadow-xl: 0 28px 70px rgba(0, 0, 0, 0.42);[m
[32m+[m[32m  --shadow-lg: 0 18px 46px rgba(0, 0, 0, 0.30);[m
[32m+[m
[32m+[m[32m  --content-width: 980px;[m
[32m+[m
[32m+[m[32m  --font-ui: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;[m
[32m+[m[32m  --font-display: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mhtml {[m
[32m+[m[32m  background: var(--bg);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mbody {[m
[32m+[m[32m  font-family: var(--font-ui);[m
[32m+[m[32m  background:[m
[32m+[m[32m    radial-gradient(circle at 82% 0%, rgba(126, 87, 255, 0.14), transparent 30%),[m
[32m+[m[32m    radial-gradient(circle at 8% 100%, rgba(35, 163, 255, 0.08), transparent 34%),[m
[32m+[m[32m    linear-gradient(180deg, #070b14 0%, #08111d 100%);[m
[32m+[m[32m  text-rendering: optimizeLegibility;[m
[32m+[m[32m  -webkit-font-smoothing: antialiased;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* App shell / mobile chrome */[m
[32m+[m[32m.app-shell {[m
[32m+[m[32m  min-height: 100vh;[m
[32m+[m[32m  padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.phone-frame {[m
[32m+[m[32m  width: 100%;[m
[32m+[m[32m  max-width: 980px;[m
[32m+[m[32m  margin: 0 auto;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.top-bar {[m
[32m+[m[32m  display: flex;[m
[32m+[m[32m  align-items: center;[m
[32m+[m[32m  justify-content: space-between;[m
[32m+[m[32m  gap: 14px;[m
[32m+[m[32m  width: 100%;[m
[32m+[m[32m  max-width: var(--content-width);[m
[32m+[m[32m  margin: 0 auto;[m
[32m+[m[32m  padding: 18px 20px 4px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.brand-block {[m
[32m+[m[32m  min-width: 0;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.logo-row {[m
[32m+[m[32m  display: flex;[m
[32m+[m[32m  align-items: center;[m
[32m+[m[32m  gap: 10px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.logo-row h1 {[m
[32m+[m[32m  margin: 0;[m
[32m+[m[32m  font-family: var(--font-display);[m
[32m+[m[32m  font-size: clamp(1.45rem, 5vw, 1.9rem);[m
[32m+[m[32m  line-height: 1;[m
[32m+[m[32m  font-weight: 750;[m
[32m+[m[32m  letter-spacing: -0.045em;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.subtitle {[m
[32m+[m[32m  margin: 5px 0 0;[m
[32m+[m[32m  color: var(--text-muted);[m
[32m+[m[32m  font-size: 0.88rem;[m
[32m+[m[32m  line-height: 1.25;[m
[32m+[m[32m  white-space: nowrap;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.spotlight-icon {[m
[32m+[m[32m  display: none;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m#reset-btn {[m
[32m+[m[32m  width: auto;[m
[32m+[m[32m  flex: 0 0 auto;[m
[32m+[m[32m  min-height: 42px;[m
[32m+[m[32m  padding: 10px 15px;[m
[32m+[m[32m  border-radius: var(--radius-pill);[m
[32m+[m[32m  background: rgba(255, 255, 255, 0.055);[m
[32m+[m[32m  border-color: rgba(255, 255, 255, 0.08);[m
[32m+[m[32m  color: var(--text);[m
[32m+[m[32m  box-shadow: none;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Main screen rhythm */[m
[32m+[m[32m#app-screen {[m
[32m+[m[32m  max-width: var(--content-width);[m
[32m+[m[32m  padding: 22px 20px 88px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m#app-screen > * + *,[m
[32m+[m[32m#main-content > * + *,[m
[32m+[m[32m.section-stack > * + * {[m
[32m+[m[32m  margin-top: 18px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Typography hierarchy */[m
[32m+[m[32m.hero-kicker,[m
[32m+[m[32m.pick-label,[m
[32m+[m[32m.section-eyebrow,[m
[32m+[m[32m.section-overline {[m
[32m+[m[32m  color: var(--violet-text);[m
[32m+[m[32m  font-size: 0.72rem;[m
[32m+[m[32m  letter-spacing: 0.22em;[m
[32m+[m[32m  font-weight: 650;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.hero-title,[m
[32m+[m[32m.pick-title {[m
[32m+[m[32m  font-family: var(--font-display);[m
[32m+[m[32m  font-size: clamp(1.85rem, 7vw, 3rem);[m
[32m+[m[32m  line-height: 1.02;[m
[32m+[m[32m  font-weight: 760;[m
[32m+[m[32m  letter-spacing: -0.055em;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.section-title {[m
[32m+[m[32m  font-size: 1rem;[m
[32m+[m[32m  font-weight: 700;[m
[32m+[m[32m  letter-spacing: -0.025em;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.hero-text,[m
[32m+[m[32m.section-copy {[m
[32m+[m[32m  line-height: 1.55;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.movie-title,[m
[32m+[m[32m.alt-card-title {[m
[32m+[m[32m  font-weight: 740;[m
[32m+[m[32m  letter-spacing: -0.035em;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Calmer surfaces */[m
[32m+[m[32m.section-card,[m
[32m+[m[32m.hero-card,[m
[32m+[m[32m.pick-card,[m
[32m+[m[32m.movie-card,[m
[32m+[m[32m.alt-card {[m
[32m+[m[32m  background:[m
[32m+[m[32m    linear-gradient(180deg, rgba(255, 255, 255, 0.052), rgba(255, 255, 255, 0.034));[m
[32m+[m[32m  border-color: var(--border);[m
[32m+[m[32m  box-shadow: var(--shadow-lg);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.section-card,[m
[32m+[m[32m.hero-card,[m
[32m+[m[32m.pick-card {[m
[32m+[m[32m  border-radius: 26px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.movie-card,[m
[32m+[m[32m.alt-card {[m
[32m+[m[32m  border-radius: 24px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.section-card {[m
[32m+[m[32m  padding: 20px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.hero-card {[m
[32m+[m[32m  padding: 24px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-card {[m
[32m+[m[32m  padding: 24px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* V2 controlled cinematic spotlight */[m
[32m+[m[32m.premium-pick-card {[m
[32m+[m[32m  background:[m
[32m+[m[32m    radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.24), transparent 38%),[m
[32m+[m[32m    radial-gradient(circle at 0% 100%, rgba(28, 147, 255, 0.10), transparent 34%),[m
[32m+[m[32m    linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.032));[m
[32m+[m[32m  border-color: rgba(167, 139, 250, 0.18);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-spotlight {[m
[32m+[m[32m  opacity: 0.75;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Pills and chips */[m
[32m+[m[32m.progress-pill,[m
[32m+[m[32m.confidence-pill,[m
[32m+[m[32m.availability-pill,[m
[32m+[m[32m.provider-chip,[m
[32m+[m[32m.availability-chip {[m
[32m+[m[32m  min-height: 38px;[m
[32m+[m[32m  padding: 9px 13px;[m
[32m+[m[32m  border-radius: var(--radius-pill);[m
[32m+[m[32m  background: rgba(255, 255, 255, 0.055);[m
[32m+[m[32m  border-color: rgba(255, 255, 255, 0.085);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.confidence-pill.strong,[m
[32m+[m[32m.confidence-pill.good,[m
[32m+[m[32m.confidence-pill.early {[m
[32m+[m[32m  background: var(--violet-bg);[m
[32m+[m[32m  border-color: var(--violet-border);[m
[32m+[m[32m  color: var(--violet-text);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.availability-pill {[m
[32m+[m[32m  background: rgba(56, 189, 248, 0.13);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Buttons */[m
[32m+[m[32m.primary-btn,[m
[32m+[m[32m.ghost-btn,[m
[32m+[m[32m.rating-btn,[m
[32m+[m[32m.seen-btn {[m
[32m+[m[32m  min-height: 48px;[m
[32m+[m[32m  border-radius: 18px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.primary-btn {[m
[32m+[m[32m  background: linear-gradient(135deg, #ffffff 0%, #f2e6d3 100%);[m
[32m+[m[32m  color: #080b13;[m
[32m+[m[32m  font-weight: 750;[m
[32m+[m[32m  box-shadow: 0 14px 34px rgba(255, 255, 255, 0.10);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.ghost-btn {[m
[32m+[m[32m  background: rgba(255, 255, 255, 0.055);[m
[32m+[m[32m  border-color: rgba(255, 255, 255, 0.085);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.rating-btn {[m
[32m+[m[32m  min-width: 50px;[m
[32m+[m[32m  height: 50px;[m
[32m+[m[32m  border-radius: 17px;[m
[32m+[m[32m  font-size: 1rem;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Rating screen refinement */[m
[32m+[m[32m.stacked-rating-card {[m
[32m+[m[32m  background:[m
[32m+[m[32m    linear-gradient(180deg, rgba(255, 255, 255, 0.052), rgba(255, 255, 255, 0.032));[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.stacked-content .movie-title {[m
[32m+[m[32m  font-size: clamp(1.55rem, 6vw, 2rem);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.stacked-rating-row {[m
[32m+[m[32m  gap: 10px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Recommendation supporting boxes */[m
[32m+[m[32m.pick-watch-box,[m
[32m+[m[32m.availability-box {[m
[32m+[m[32m  background: rgba(0, 0, 0, 0.18);[m
[32m+[m[32m  border-color: rgba(255, 255, 255, 0.075);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-info-card {[m
[32m+[m[32m  background: rgba(255, 255, 255, 0.038);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Service selector polish */[m
[32m+[m[32m.service-controls {[m
[32m+[m[32m  gap: 10px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.service-controls label {[m
[32m+[m[32m  min-height: 48px;[m
[32m+[m[32m  border-radius: 17px;[m
[32m+[m[32m  background: rgba(255, 255, 255, 0.045);[m
[32m+[m[32m  border-color: rgba(255, 255, 255, 0.08);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Poster refinement */[m
[32m+[m[32m.poster,[m
[32m+[m[32m.poster-fallback {[m
[32m+[m[32m  border-radius: 22px;[m
[32m+[m[32m  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Mobile foundation */[m
[32m+[m[32m@media (max-width: 640px) {[m
[32m+[m[32m  .top-bar {[m
[32m+[m[32m    padding: 16px 16px 2px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .logo-row h1 {[m
[32m+[m[32m    font-size: 1.65rem;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .subtitle {[m
[32m+[m[32m    max-width: 210px;[m
[32m+[m[32m    overflow: hidden;[m
[32m+[m[32m    text-overflow: ellipsis;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  #reset-btn {[m
[32m+[m[32m    min-height: 40px;[m
[32m+[m[32m    padding: 9px 14px;[m
[32m+[m[32m    font-size: 0.88rem;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  #app-screen {[m
[32m+[m[32m    padding: 18px 14px 88px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  #app-screen > * + *,[m
[32m+[m[32m  #main-content > * + *,[m
[32m+[m[32m  .section-stack > * + * {[m
[32m+[m[32m    margin-top: 16px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .section-card,[m
[32m+[m[32m  .hero-card,[m
[32m+[m[32m  .pick-card {[m
[32m+[m[32m    padding: 18px;[m
[32m+[m[32m    border-radius: 24px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .hero-title,[m
[32m+[m[32m  .pick-title {[m
[32m+[m[32m    font-size: clamp(1.85rem, 10vw, 2.35rem);[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .hero-text,[m
[32m+[m[32m  .section-copy {[m
[32m+[m[32m    font-size: 0.96rem;[m
[32m+[m[32m    line-height: 1.52;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .progress-pill {[m
[32m+[m[32m    margin-top: 10px;[m
[32m+[m[32m    margin-right: 6px;[m
[32m+[m[32m    white-space: normal;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .primary-btn,[m
[32m+[m[32m  .ghost-btn {[m
[32m+[m[32m    width: 100%;[m
[32m+[m[32m    min-height: 52px;[m
[32m+[m[32m    justify-content: center;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .rating-btn {[m
[32m+[m[32m    min-width: 0;[m
[32m+[m[32m    width: 100%;[m
[32m+[m[32m    height: 50px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .stacked-rating-row {[m
[32m+[m[32m    grid-template-columns: repeat(5, minmax(0, 1fr));[m
[32m+[m[32m    width: 100%;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .stacked-actions,[m
[32m+[m[32m  .reveal-action-row,[m
[32m+[m[32m  .pick-action-row,[m
[32m+[m[32m  .alt-card-actions {[m
[32m+[m[32m    display: grid;[m
[32m+[m[32m    grid-template-columns: 1fr;[m
[32m+[m[32m    gap: 10px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .stacked-poster-wrap,[m
[32m+[m[32m  .pick-poster-wrap {[m
[32m+[m[32m    max-width: 230px;[m
[32m+[m[32m    margin: 0 auto;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .alt-card {[m
[32m+[m[32m    grid-template-columns: 92px minmax(0, 1fr);[m
[32m+[m[32m    align-items: start;[m
[32m+[m[32m    padding: 14px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .alt-card-poster {[m
[32m+[m[32m    max-width: 92px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .alt-card-actions {[m
[32m+[m[32m    margin-top: 12px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .service-controls {[m
[32m+[m[32m    flex-direction: column;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .service-controls label {[m
[32m+[m[32m    width: 100%;[m
[32m+[m[32m  }[m
[32m+[m[32m}[m
[32m+[m[32m/* =========================================================[m
[32m+[m[32m   NoScroll V2 — Recommendation Hierarchy Refinement[m
[32m+[m[32m   ========================================================= */[m
[32m+[m
[32m+[m[32m/* Primary recommendation CTA */[m
[32m+[m[32m.pick-primary-action {[m
[32m+[m[32m  margin-top: 22px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.cinematic-primary-btn {[m
[32m+[m[32m  width: 100%;[m
[32m+[m[32m  min-height: 58px;[m
[32m+[m[32m  border-radius: 22px;[m
[32m+[m[32m  font-size: 1rem;[m
[32m+[m[32m  font-weight: 760;[m
[32m+[m[32m  letter-spacing: -0.02em;[m
[32m+[m[32m  background:[m
[32m+[m[32m    linear-gradient(135deg, #ffffff 0%, #efe2cb 100%);[m
[32m+[m[32m  box-shadow:[m
[32m+[m[32m    0 18px 42px rgba(255,255,255,0.10),[m
[32m+[m[32m    0 8px 18px rgba(0,0,0,0.28);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Secondary actions */[m
[32m+[m[32m.pick-secondary-actions {[m
[32m+[m[32m  display: grid;[m
[32m+[m[32m  grid-template-columns: repeat(3, minmax(0, 1fr));[m
[32m+[m[32m  gap: 10px;[m
[32m+[m[32m  margin-top: 12px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-action-btn {[m
[32m+[m[32m  min-height: 46px;[m
[32m+[m[32m  border-radius: 16px;[m
[32m+[m[32m  padding: 10px 12px;[m
[32m+[m[32m  font-size: 0.9rem;[m
[32m+[m[32m  font-weight: 640;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Tertiary utility actions */[m
[32m+[m[32m.pick-tertiary-actions {[m
[32m+[m[32m  display: flex;[m
[32m+[m[32m  justify-content: center;[m
[32m+[m[32m  gap: 18px;[m
[32m+[m[32m  margin-top: 18px;[m
[32m+[m[32m  flex-wrap: wrap;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.text-action-btn {[m
[32m+[m[32m  appearance: none;[m
[32m+[m[32m  border: none;[m
[32m+[m[32m  background: transparent;[m
[32m+[m[32m  color: var(--text-muted);[m
[32m+[m[32m  font-size: 0.9rem;[m
[32m+[m[32m  cursor: pointer;[m
[32m+[m[32m  transition:[m
[32m+[m[32m    color var(--transition),[m
[32m+[m[32m    opacity var(--transition);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.text-action-btn:hover {[m
[32m+[m[32m  color: var(--text);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Recommendation card refinement */[m
[32m+[m[32m.pick-subtext {[m
[32m+[m[32m  margin-top: 10px;[m
[32m+[m[32m  font-size: 0.98rem;[m
[32m+[m[32m  line-height: 1.45;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-confidence-row {[m
[32m+[m[32m  margin-top: 16px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Reduce vertical heaviness */[m
[32m+[m[32m.pick-watch-box,[m
[32m+[m[32m.availability-box,[m
[32m+[m[32m.pick-info-card {[m
[32m+[m[32m  margin-top: 16px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Alternative recommendation refinement */[m
[32m+[m[32m.alt-card {[m
[32m+[m[32m  align-items: center;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alt-actions {[m
[32m+[m[32m  display: flex;[m
[32m+[m[32m  flex-wrap: wrap;[m
[32m+[m[32m  gap: 8px;[m
[32m+[m[32m  margin-top: 14px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alt-actions .compact-action-btn {[m
[32m+[m[32m  flex: 1 1 auto;[m
[32m+[m[32m  min-width: 0;[m
[32m+[m[32m  min-height: 40px;[m
[32m+[m[32m  font-size: 0.84rem;[m
[32m+[m[32m  padding: 8px 10px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Cleaner metadata rhythm */[m
[32m+[m[32m.alt-card-title {[m
[32m+[m[32m  font-size: 1rem;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.alt-card-meta,[m
[32m+[m[32m.alt-card-reason {[m
[32m+[m[32m  line-height: 1.35;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m/* Mobile refinement */[m
[32m+[m[32m@media (max-width: 640px) {[m
[32m+[m[32m  .pick-secondary-actions {[m
[32m+[m[32m    grid-template-columns: 1fr;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .pick-tertiary-actions {[m
[32m+[m[32m    gap: 10px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .text-action-btn {[m
[32m+[m[32m    width: 100%;[m
[32m+[m[32m    min-height: 36px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .compact-alt-actions {[m
[32m+[m[32m    display: grid;[m
[32m+[m[32m    grid-template-columns: repeat(3, minmax(0, 1fr));[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .compact-alt-actions .compact-action-btn {[m
[32m+[m[32m    width: 100%;[m
[32m+[m[32m  }[m
[32m+[m[32m}[m
[32m+[m[32m/* =========================================================[m
[32m+[m[32m   NoScroll V2 — Cinematic Compression Pass[m
[32m+[m[32m   Additive override only[m
[32m+[m[32m   ========================================================= */[m
[32m+[m
[32m+[m[32m.pick-card.premium-pick-card {[m
[32m+[m[32m  grid-template-columns: 1fr;[m
[32m+[m[32m  max-width: 720px;[m
[32m+[m[32m  margin: 0 auto;[m
[32m+[m[32m  padding: 28px 20px 24px;[m
[32m+[m[32m  border-radius: 32px;[m
[32m+[m[32m  text-align: center;[m
[32m+[m[32m  background:[m
[32m+[m[32m    radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.30), transparent 42%),[m
[32m+[m[32m    linear-gradient(180deg, rgba(17, 20, 31, 0.96), rgba(10, 12, 20, 0.98));[m
[32m+[m[32m  border-color: rgba(255, 255, 255, 0.08);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-card .pick-poster-wrap {[m
[32m+[m[32m  width: min(100%, 320px);[m
[32m+[m[32m  max-width: 320px;[m
[32m+[m[32m  margin: 0 auto 20px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-card .pick-main-content {[m
[32m+[m[32m  width: 100%;[m
[32m+[m[32m  max-width: 620px;[m
[32m+[m[32m  margin: 0 auto;[m
[32m+[m[32m  padding-top: 0;[m
[32m+[m[32m  display: flex;[m
[32m+[m[32m  flex-direction: column;[m
[32m+[m[32m  align-items: center;[m
[32m+[m[32m  gap: 14px;[m
[32m+[m[32m  text-align: center;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-title {[m
[32m+[m[32m  font-size: clamp(2.4rem, 7vw, 4.2rem);[m
[32m+[m[32m  line-height: 0.96;[m
[32m+[m[32m  letter-spacing: -0.045em;[m
[32m+[m[32m  font-weight: 800;[m
[32m+[m[32m  margin: 0;[m
[32m+[m[32m  text-wrap: balance;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-subtext {[m
[32m+[m[32m  color: var(--text-soft);[m
[32m+[m[32m  font-size: 1rem;[m
[32m+[m[32m  line-height: 1.45;[m
[32m+[m[32m  margin: -2px 0 0;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-confidence-row {[m
[32m+[m[32m  justify-content: center;[m
[32m+[m[32m  margin-top: 0;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.availability-box,[m
[32m+[m[32m.pick-watch-box {[m
[32m+[m[32m  width: 100%;[m
[32m+[m[32m  margin-top: 0;[m
[32m+[m[32m  padding: 16px;[m
[32m+[m[32m  border-radius: 22px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-primary-action {[m
[32m+[m[32m  width: 100%;[m
[32m+[m[32m  margin-top: 4px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-secondary-actions {[m
[32m+[m[32m  display: flex;[m
[32m+[m[32m  justify-content: center;[m
[32m+[m[32m  gap: 10px;[m
[32m+[m[32m  flex-wrap: wrap;[m
[32m+[m[32m  margin-top: -2px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-action-btn {[m
[32m+[m[32m  width: auto;[m
[32m+[m[32m  min-height: 42px;[m
[32m+[m[32m  padding: 0 16px;[m
[32m+[m[32m  border-radius: 999px;[m
[32m+[m[32m  background: rgba(255,255,255,0.05);[m
[32m+[m[32m  border: 1px solid rgba(255,255,255,0.07);[m
[32m+[m[32m  color: var(--text-soft);[m
[32m+[m[32m  font-size: 0.95rem;[m
[32m+[m[32m  font-weight: 600;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-tertiary-actions {[m
[32m+[m[32m  margin-top: 0;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-info-grid {[m
[32m+[m[32m  width: 100%;[m
[32m+[m[32m  display: grid;[m
[32m+[m[32m  grid-template-columns: 1fr;[m
[32m+[m[32m  gap: 14px;[m
[32m+[m[32m  margin-top: 4px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pick-info-card {[m
[32m+[m[32m  margin-top: 0;[m
[32m+[m[32m  padding: 18px;[m
[32m+[m[32m  border-radius: 22px;[m
[32m+[m[32m  background: rgba(255,255,255,0.035);[m
[32m+[m[32m  border: 1px solid rgba(255,255,255,0.07);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m@media (max-width: 640px) {[m
[32m+[m[32m  .pick-card.premium-pick-card {[m
[32m+[m[32m    padding: 22px 16px 20px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .pick-card .pick-poster-wrap {[m
[32m+[m[32m    max-width: 280px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .pick-title {[m
[32m+[m[32m    font-size: clamp(2.35rem, 13vw, 3.15rem);[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .pick-secondary-actions {[m
[32m+[m[32m    display: grid;[m
[32m+[m[32m    grid-template-columns: repeat(3, minmax(0, 1fr));[m
[32m+[m[32m    width: 100%;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .compact-action-btn {[m
[32m+[m[32m    width: 100%;[m
[32m+[m[32m    padding: 0 10px;[m
[32m+[m[32m    font-size: 0.88rem;[m
[32m+[m[32m  }[m
[32m+[m[32m}[m
[32m+[m[32m/* =========================================================[m
[32m+[m[32m   NoScroll V2 — Compact Alternatives Rail[m
[32m+[m[32m   ========================================================= */[m
[32m+[m
[32m+[m[32m.compact-alternatives-rail {[m
[32m+[m[32m  display: flex;[m
[32m+[m[32m  gap: 16px;[m
[32m+[m[32m  overflow-x: auto;[m
[32m+[m[32m  padding: 4px 2px 8px;[m
[32m+[m[32m  scroll-snap-type: x proximity;[m
[32m+[m[32m  scrollbar-width: none;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alternatives-rail::-webkit-scrollbar {[m
[32m+[m[32m  display: none;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alternatives-rail .alt-card {[m
[32m+[m[32m  flex: 0 0 285px;[m
[32m+[m[32m  min-width: 285px;[m
[32m+[m
[32m+[m[32m  display: flex;[m
[32m+[m[32m  flex-direction: column;[m
[32m+[m[32m  gap: 14px;[m
[32m+[m
[32m+[m[32m  padding: 16px;[m
[32m+[m
[32m+[m[32m  border-radius: 26px;[m
[32m+[m
[32m+[m[32m  background:[m
[32m+[m[32m    linear-gradient([m
[32m+[m[32m      180deg,[m
[32m+[m[32m      rgba(255,255,255,0.045),[m
[32m+[m[32m      rgba(255,255,255,0.025)[m
[32m+[m[32m    );[m
[32m+[m
[32m+[m[32m  border: 1px solid rgba(255,255,255,0.07);[m
[32m+[m
[32m+[m[32m  scroll-snap-align: start;[m
[32m+[m
[32m+[m[32m  transition:[m
[32m+[m[32m    transform 0.18s ease,[m
[32m+[m[32m    border-color 0.18s ease;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alternatives-rail .alt-card:hover {[m
[32m+[m[32m  transform: translateY(-2px);[m
[32m+[m[32m  border-color: rgba(255,255,255,0.12);[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alternatives-rail .alt-card-poster {[m
[32m+[m[32m  width: 100%;[m
[32m+[m[32m  max-width: 100%;[m
[32m+[m[32m  aspect-ratio: 2 / 3;[m
[32m+[m[32m  overflow: hidden;[m
[32m+[m[32m  border-radius: 18px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alternatives-rail .alt-card-poster img {[m
[32m+[m[32m  width: 100%;[m
[32m+[m[32m  height: 100%;[m
[32m+[m[32m  object-fit: cover;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alternatives-rail .alt-card-content {[m
[32m+[m[32m  display: flex;[m
[32m+[m[32m  flex-direction: column;[m
[32m+[m[32m  gap: 8px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alternatives-rail .alt-card-title {[m
[32m+[m[32m  font-size: 1.2rem;[m
[32m+[m[32m  line-height: 1.05;[m
[32m+[m[32m  letter-spacing: -0.03em;[m
[32m+[m[32m  font-weight: 720;[m
[32m+[m[32m  margin: 0;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alternatives-rail .alt-card-meta {[m
[32m+[m[32m  color: var(--text-soft);[m
[32m+[m[32m  font-size: 0.92rem;[m
[32m+[m[32m  line-height: 1.35;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alternatives-rail .alt-card-reason {[m
[32m+[m[32m  color: var(--text-muted);[m
[32m+[m[32m  font-size: 0.9rem;[m
[32m+[m[32m  line-height: 1.45;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alternatives-rail .compact-alt-actions {[m
[32m+[m[32m  display: grid;[m
[32m+[m[32m  grid-template-columns: repeat(3, minmax(0, 1fr));[m
[32m+[m[32m  gap: 8px;[m
[32m+[m[32m  margin-top: 4px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.compact-alternatives-rail .compact-action-btn {[m
[32m+[m[32m  min-height: 38px;[m
[32m+[m[32m  padding: 0 10px;[m
[32m+[m[32m  font-size: 0.82rem;[m
[32m+[m[32m  border-radius: 14px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m@media (max-width: 640px) {[m
[32m+[m[32m  .compact-alternatives-rail {[m
[32m+[m[32m    margin-right: -2px;[m
[32m+[m[32m    padding-right: 2px;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .compact-alternatives-rail .alt-card {[m
[32m+[m[32m    flex: 0 0 82vw;[m
[32m+[m[32m    min-width: 82vw;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  .compact-alternatives-rail .alt-card-title {[m
[32m+[m[32m    font-size: 1.1rem;[m
[32m+[m[32m  }[m
[32m+[m[32m}[m
