#!/usr/bin/env node

/**
 * Validate NoScroll library expansion stage file.
 *
 * Default input:
 *   ./library_expansion_stage.json
 *
 * Usage:
 *   node scripts/validate-stage.js
 *   node scripts/validate-stage.js path/to/library_expansion_stage.json
 */

const fs = require("fs");
const path = require("path");

const INPUT_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(process.cwd(), "library_expansion_stage.json");

const ALLOWED_ENERGY_VALUES = new Set(["low", "medium", "high"]);
const ALLOWED_WEIGHT_VALUES = new Set(["light", "balanced", "heavy"]);
const ALLOWED_STYLE_VALUES = new Set([
  "grounded",
  "heightened",
  "quirky",
  "cerebral",
  "spectacle"
]);
const ALLOWED_HUMOR_VALUES = new Set(["none", "low", "medium", "high"]);

const REQUIRED_FIELDS = [
  "sourceBucket",
  "title",
  "year",
  "genre",
  "tone",
  "energy",
  "weight",
  "style",
  "humor",
  "streaming",
  "tmdbId",
  "poster"
];

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    fail(`Could not read or parse JSON: ${filePath}\n${error.message}`);
  }
}

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
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

function normalizeTitleKey(value) {
  return normalizePunctuation(value).replace(/[^a-z0-9]/g, "");
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function addMapHit(map, key, payload) {
  if (!key) return;
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(payload);
}

function formatEntryRef(entry, index) {
  return `${entry.title || "<missing title>"} [index ${index}]`;
}

function validateRequiredFields(entry, index, errors) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in entry)) {
      errors.push(`${formatEntryRef(entry, index)} missing required field "${field}"`);
    }
  }
}

function validateTypes(entry, index, errors, warnings) {
  if (typeof entry.sourceBucket !== "string" || !entry.sourceBucket.trim()) {
    errors.push(`${formatEntryRef(entry, index)} has invalid sourceBucket`);
  }

  if (typeof entry.title !== "string" || !entry.title.trim()) {
    errors.push(`${formatEntryRef(entry, index)} has invalid title`);
  }

  if ("originalTitle" in entry && entry.originalTitle !== null) {
    if (typeof entry.originalTitle !== "string") {
      errors.push(`${formatEntryRef(entry, index)} has non-string originalTitle`);
    }
  }

  if (!Number.isInteger(entry.year) || entry.year < 1888 || entry.year > 2100) {
    errors.push(`${formatEntryRef(entry, index)} has invalid year "${entry.year}"`);
  }

  if (typeof entry.genre !== "string" || !entry.genre.trim()) {
    errors.push(`${formatEntryRef(entry, index)} has invalid genre`);
  }

  if (typeof entry.tone !== "string" || !entry.tone.trim()) {
    errors.push(`${formatEntryRef(entry, index)} has invalid tone`);
  }

  if (!Array.isArray(entry.streaming)) {
    errors.push(`${formatEntryRef(entry, index)} has invalid streaming field (must be array)`);
  } else if (entry.streaming.length > 0) {
    for (const service of entry.streaming) {
      if (typeof service !== "string") {
        errors.push(`${formatEntryRef(entry, index)} has non-string streaming value`);
      }
    }
  } else {
    warnings.push(`${formatEntryRef(entry, index)} has empty streaming array (allowed for stage file)`);
  }

  if (!(entry.tmdbId === null || Number.isInteger(entry.tmdbId))) {
    errors.push(`${formatEntryRef(entry, index)} has invalid tmdbId "${entry.tmdbId}"`);
  }

  if (typeof entry.poster !== "string") {
    errors.push(`${formatEntryRef(entry, index)} has invalid poster field (must be string)`);
  }

  if ("ukProviders" in entry && !Array.isArray(entry.ukProviders)) {
    errors.push(`${formatEntryRef(entry, index)} has invalid ukProviders (must be array)`);
  }

  if ("ukProviderLabels" in entry && !Array.isArray(entry.ukProviderLabels)) {
    errors.push(`${formatEntryRef(entry, index)} has invalid ukProviderLabels (must be array)`);
  }

  if ("ukAvailabilitySource" in entry && typeof entry.ukAvailabilitySource !== "string") {
    errors.push(`${formatEntryRef(entry, index)} has invalid ukAvailabilitySource (must be string)`);
  }
}

function validateEnums(entry, index, errors) {
  if (!ALLOWED_ENERGY_VALUES.has(entry.energy)) {
    errors.push(
      `${formatEntryRef(entry, index)} has invalid energy "${entry.energy}" (allowed: low, medium, high)`
    );
  }

  if (!ALLOWED_WEIGHT_VALUES.has(entry.weight)) {
    errors.push(
      `${formatEntryRef(entry, index)} has invalid weight "${entry.weight}" (allowed: light, balanced, heavy)`
    );
  }

  if (!ALLOWED_STYLE_VALUES.has(entry.style)) {
    errors.push(
      `${formatEntryRef(entry, index)} has invalid style "${entry.style}" (allowed: grounded, heightened, quirky, cerebral, spectacle)`
    );
  }

  if (!ALLOWED_HUMOR_VALUES.has(entry.humor)) {
    errors.push(
      `${formatEntryRef(entry, index)} has invalid humor "${entry.humor}" (allowed: none, low, medium, high)`
    );
  }
}

function validateWhitespaceAndCleanup(entry, index, warnings) {
  const fieldsToTrim = ["sourceBucket", "title", "originalTitle", "genre", "tone", "poster"];

  for (const field of fieldsToTrim) {
    if (typeof entry[field] === "string" && entry[field] !== entry[field].trim()) {
      warnings.push(`${formatEntryRef(entry, index)} field "${field}" has leading/trailing whitespace`);
    }
  }
}

function validateDuplicateSignals(entries, errors, warnings) {
  const titleMap = new Map();
  const titleYearMap = new Map();
  const originalTitleMap = new Map();
  const crossAliasMap = new Map();

  entries.forEach((entry, index) => {
    const titleKey = normalizeTitleKey(entry.title);
    const originalTitleKey = normalizeTitleKey(entry.originalTitle);
    const titleYearKey = titleKey && Number.isInteger(entry.year) ? `${titleKey}__${entry.year}` : "";

    addMapHit(titleMap, titleKey, { entry, index });
    addMapHit(titleYearMap, titleYearKey, { entry, index });

    if (originalTitleKey) {
      addMapHit(originalTitleMap, originalTitleKey, { entry, index });
    }

    if (titleKey && originalTitleKey && titleKey !== originalTitleKey) {
      addMapHit(crossAliasMap, `${titleKey}=>${originalTitleKey}`, { entry, index });
    }
  });

  for (const [, hits] of titleMap.entries()) {
    if (hits.length > 1) {
      errors.push(
        `Duplicate stage title detected: ${hits.map(({ entry, index }) => formatEntryRef(entry, index)).join(" | ")}`
      );
    }
  }

  for (const [, hits] of titleYearMap.entries()) {
    if (hits.length > 1) {
      errors.push(
        `Duplicate stage title+year detected: ${hits.map(({ entry, index }) => formatEntryRef(entry, index)).join(" | ")}`
      );
    }
  }

  for (const [, hits] of originalTitleMap.entries()) {
    if (hits.length > 1) {
      warnings.push(
        `Repeated originalTitle detected: ${hits.map(({ entry, index }) => formatEntryRef(entry, index)).join(" | ")}`
      );
    }
  }

  const titleKeys = new Map();
  const originalKeys = new Map();

  entries.forEach((entry, index) => {
    const titleKey = normalizeTitleKey(entry.title);
    const originalTitleKey = normalizeTitleKey(entry.originalTitle);

    if (titleKey) addMapHit(titleKeys, titleKey, { entry, index });
    if (originalTitleKey) addMapHit(originalKeys, originalTitleKey, { entry, index });
  });

  for (const [key, titleHits] of titleKeys.entries()) {
    const originalHits = originalKeys.get(key);
    if (originalHits && originalHits.length > 0) {
      const titleRefs = titleHits.map(({ entry, index }) => formatEntryRef(entry, index)).join(" | ");
      const originalRefs = originalHits.map(({ entry, index }) => formatEntryRef(entry, index)).join(" | ");
      warnings.push(
        `Possible alias collision: a stage title matches another stage originalTitle.\n  title side: ${titleRefs}\n  originalTitle side: ${originalRefs}`
      );
    }
  }
}

function main() {
  const data = readJson(INPUT_PATH);

  if (!Array.isArray(data)) {
    fail(`Stage file must be a JSON array: ${INPUT_PATH}`);
  }

  const errors = [];
  const warnings = [];

  data.forEach((entry, index) => {
    if (!isPlainObject(entry)) {
      errors.push(`Entry at index ${index} is not an object`);
      return;
    }

    validateRequiredFields(entry, index, errors);
    validateTypes(entry, index, errors, warnings);
    validateEnums(entry, index, errors);
    validateWhitespaceAndCleanup(entry, index, warnings);
  });

  validateDuplicateSignals(data, errors, warnings);

  console.log(`\nValidated ${data.length} stage entries from ${INPUT_PATH}\n`);

  if (warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
    console.log("");
  }

  if (errors.length > 0) {
    console.log("Errors:");
    for (const error of errors) {
      console.log(`- ${error}`);
    }
    console.log("");
    process.exit(1);
  }

  console.log("✅ Stage file passed validation.\n");
}

main();