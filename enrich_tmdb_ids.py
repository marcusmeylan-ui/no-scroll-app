#!/usr/bin/env python3
"""
Enrich an existing NoScroll movies.json with TMDB IDs.

Reads your current movies.json, preserves all fields exactly,
and adds only "tmdbId" where a TMDB match is found.

Usage:
  python enrich_tmdb_ids.py --api-key  --input movies.json --output movies.tmdb.enriched.json

Outputs:
  - movies.tmdb.enriched.json
  - tmdb_enrichment_report.json
"""

import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
from copy import deepcopy
from pathlib import Path

TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie"
USER_AGENT = "NoScrollTMDBEnricher/1.0"

MANUAL_OVERRIDES = {
    # Add only if needed after first pass, e.g.
    # "The Lion King": 8587,
}

def normalize_title(value: str) -> str:
    return (
        str(value or "")
        .strip()
        .lower()
        .replace("’", "'")
        .replace("“", '"')
        .replace("”", '"')
    )

def fetch_json(url: str) -> dict:
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def search_tmdb(api_key: str, title: str) -> list:
    params = {
        "api_key": api_key,
        "query": title,
        "include_adult": "false",
        "language": "en-US",
        "page": "1",
    }
    url = TMDB_SEARCH_URL + "?" + urllib.parse.urlencode(params)
    data = fetch_json(url)
    return data.get("results", []) if isinstance(data, dict) else []

def choose_result(title: str, results: list) -> tuple:
    """
    Returns: (tmdb_id, confidence, matched_title, release_date)
    confidence: override / exact / strong / fallback / none
    """
    if not results:
        return None, "none", "", ""

    norm_target = normalize_title(title)

    for item in results:
      candidate_title = item.get("title") or item.get("original_title") or ""
      if normalize_title(candidate_title) == norm_target:
          return item.get("id"), "exact", candidate_title, item.get("release_date", "")

    scored = []
    for item in results:
        candidate_title = item.get("title") or item.get("original_title") or ""
        norm_candidate = normalize_title(candidate_title)
        score = 0.0

        if norm_candidate.startswith(norm_target):
            score += 5
        if norm_target.startswith(norm_candidate):
            score += 4
        if norm_target in norm_candidate:
            score += 3
        if norm_candidate in norm_target:
            score += 2

        popularity = item.get("popularity") or 0
        try:
            score += min(float(popularity), 100.0) / 100.0
        except Exception:
            pass

        scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    best_score, best = scored[0]
    best_title = best.get("title") or best.get("original_title") or ""

    if best_score >= 5:
        return best.get("id"), "strong", best_title, best.get("release_date", "")

    return best.get("id"), "fallback", best_title, best.get("release_date", "")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-key", required=True, help="TMDB API key")
    parser.add_argument("--input", default="movies.json", help="Source movies.json path")
    parser.add_argument("--output", default="movies.tmdb.enriched.json", help="Output enriched JSON path")
    parser.add_argument("--report", default="tmdb_enrichment_report.json", help="Output report JSON path")
    parser.add_argument("--delay", type=float, default=0.12, help="Delay between TMDB requests")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    movies = json.loads(input_path.read_text(encoding="utf-8"))
    if not isinstance(movies, list):
        print("Input JSON must be an array", file=sys.stderr)
        sys.exit(1)

    enriched = []
    report = {
        "total": len(movies),
        "matched": 0,
        "override": 0,
        "exact": 0,
        "strong": 0,
        "fallback": 0,
        "none": 0,
        "items": []
    }

    for idx, movie in enumerate(movies, start=1):
        movie_copy = deepcopy(movie)
        title = movie_copy.get("title", "")

        confidence = "none"
        matched_title = ""
        release_date = ""

        if title in MANUAL_OVERRIDES:
            movie_copy["tmdbId"] = MANUAL_OVERRIDES[title]
            confidence = "override"
            matched_title = title
        else:
            try:
                results = search_tmdb(args.api_key, title)
                tmdb_id, confidence, matched_title, release_date = choose_result(title, results)
                if tmdb_id is not None:
                    movie_copy["tmdbId"] = tmdb_id
            except Exception:
                confidence = "none"

        if "tmdbId" in movie_copy:
            report["matched"] += 1
        report[confidence] += 1

        report["items"].append({
            "id": movie_copy.get("id"),
            "title": title,
            "tmdbId": movie_copy.get("tmdbId"),
            "confidence": confidence,
            "matchedTitle": matched_title,
            "releaseDate": release_date,
        })

        enriched.append(movie_copy)
        print(f"[{idx}/{len(movies)}] {title} -> {movie_copy.get('tmdbId')} ({confidence})")
        time.sleep(max(args.delay, 0.0))

    Path(args.output).write_text(json.dumps(enriched, ensure_ascii=False, indent=2), encoding="utf-8")
    Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print()
    print(f"Wrote enriched file: {args.output}")
    print(f"Wrote report: {args.report}")
    print(f"Matched: {report['matched']}/{report['total']}")
    print(f"Breakdown -> override: {report['override']}, exact: {report['exact']}, strong: {report['strong']}, fallback: {report['fallback']}, none: {report['none']}")

if __name__ == "__main__":
    main()
