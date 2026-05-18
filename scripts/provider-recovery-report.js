#!/usr/bin/env node

/**
 * NoScroll Provider Recovery Report
 *
 * Analyses movies.json and identifies high-value films missing supported UK providers.
 *
 * Usage:
 *   node scripts/provider-recovery-report.js
 */

const fs = require("fs");
const path = require("path");

const MOVIES_PATH = path.resolve(process.cwd(), "movies.json");
const OUTPUT_PATH = path.resolve(process.cwd(), "provider_recovery_report.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hasProviders(movie) {
  return Array.isArray(movie.ukProviders) && movie.ukProviders.length > 0;
}

function getPriorityScore(movie) {
  let score = 0;

  if (movie.pathwayRole === "anchor") score += 100;
  if (movie.pathwayRole === "bridge") score += 70;
  if (movie.pathwayRole === "discovery") score += 35;

  const tags = Array.isArray(movie.tags) ? movie.tags : [];

  if (tags.includes("anchor")) score += 30;
  if (tags.includes("mainstream")) score += 25;
  if (tags.includes("smart-blockbuster")) score += 25;
  if (tags.includes("cult-crime")) score += 20;
  if (tags.includes("paranoid")) score += 20;
  if (tags.includes("atmospheric-horror")) score += 20;
  if (tags.includes("rewatchable")) score += 20;
  if (tags.includes("bridge")) score += 15;
  if (tags.includes("discovery")) score += 5;

  if (movie.sourceBucket) score += 10;
  if (movie.tmdbId) score += 10;
  if (movie.poster) score += 5;

  return score;
}

function bucketLabel(movie) {
  return movie.sourceBucket || "Unbucketed / Legacy";
}

function roleLabel(movie) {
  return movie.pathwayRole || "legacy";
}

function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function percentage(part, total) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function main() {
  if (!fs.existsSync(MOVIES_PATH)) {
    console.error(`Could not find movies.json at: ${MOVIES_PATH}`);
    process.exit(1);
  }

  const movies = readJson(MOVIES_PATH);

  if (!Array.isArray(movies)) {
    console.error("movies.json must be a JSON array.");
    process.exit(1);
  }

  const withProviders = movies.filter(hasProviders);
  const missingProviders = movies.filter((movie) => !hasProviders(movie));

  const tagged = movies.filter(
    (movie) => movie.sourceBucket || movie.pathwayRole || Array.isArray(movie.tags)
  );

  const missingTagged = missingProviders.filter(
    (movie) => movie.sourceBucket || movie.pathwayRole || Array.isArray(movie.tags)
  );

  const priorityRecovery = missingProviders
    .map((movie) => ({
      title: movie.title,
      year: movie.year || null,
      sourceBucket: movie.sourceBucket || null,
      pathwayRole: movie.pathwayRole || null,
      tags: Array.isArray(movie.tags) ? movie.tags : [],
      tmdbId: movie.tmdbId || null,
      ukAvailabilitySource: movie.ukAvailabilitySource || null,
      priorityScore: getPriorityScore(movie)
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore || String(a.title).localeCompare(String(b.title)));

  const missingAnchors = priorityRecovery.filter((movie) => movie.pathwayRole === "anchor");
  const missingBridges = priorityRecovery.filter((movie) => movie.pathwayRole === "bridge");
  const missingDiscoveries = priorityRecovery.filter((movie) => movie.pathwayRole === "discovery");

  const bucketTotals = countBy(tagged, bucketLabel);
  const bucketMissing = countBy(missingTagged, bucketLabel);

  const bucketCoverage = Object.keys(bucketTotals)
    .sort()
    .map((bucket) => {
      const total = bucketTotals[bucket];
      const missing = bucketMissing[bucket] || 0;
      const supported = total - missing;

      return {
        bucket,
        total,
        supported,
        missing,
        coverage: percentage(supported, total),
        missingPercent: percentage(missing, total)
      };
    })
    .sort((a, b) => b.missing - a.missing);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalMovies: movies.length,
      providerSupported: withProviders.length,
      missingProviders: missingProviders.length,
      providerCoverage: percentage(withProviders.length, movies.length),
      taggedMovies: tagged.length,
      taggedMissingProviders: missingTagged.length
    },
    missingByPathwayRole: countBy(missingProviders, roleLabel),
    missingByBucket: bucketMissing,
    bucketCoverage,
    priorityRecovery,
    top50PriorityRecovery: priorityRecovery.slice(0, 50),
    missingAnchors,
    missingBridges,
    missingDiscoveries
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log("");
  console.log("NoScroll Provider Recovery Report");
  console.log("--------------------------------");
  console.log(`Total movies:        ${movies.length}`);
  console.log(`Provider-supported:  ${withProviders.length}`);
  console.log(`Missing providers:   ${missingProviders.length}`);
  console.log(`Provider coverage:   ${percentage(withProviders.length, movies.length)}`);
  console.log(`Tagged movies:       ${tagged.length}`);
  console.log("");

  console.log("Missing providers by pathway role:");
  const byRole = countBy(missingProviders, roleLabel);
  Object.entries(byRole)
    .sort((a, b) => b[1] - a[1])
    .forEach(([role, count]) => {
      console.log(`- ${role}: ${count}`);
    });

  console.log("");
  console.log("Top 25 recovery targets:");
  priorityRecovery.slice(0, 25).forEach((movie, index) => {
    const bucket = movie.sourceBucket || "Legacy";
    const role = movie.pathwayRole || "legacy";
    const year = movie.year ? ` (${movie.year})` : "";
    console.log(
      `${String(index + 1).padStart(2, "0")}. ${movie.title}${year} — ${bucket} / ${role} / score ${movie.priorityScore}`
    );
  });

  console.log("");
  console.log("Worst bucket coverage:");
  bucketCoverage.slice(0, 10).forEach((bucket) => {
    console.log(
      `- ${bucket.bucket}: ${bucket.supported}/${bucket.total} supported (${bucket.coverage}), ${bucket.missing} missing`
    );
  });

  console.log("");
  console.log(`Wrote full report to: ${OUTPUT_PATH}`);
  console.log("");
}

main();