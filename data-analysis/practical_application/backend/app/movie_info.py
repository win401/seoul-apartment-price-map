from __future__ import annotations

import json
import os
import re
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen


TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
TMDB_MOVIE_URL = "https://www.themoviedb.org/movie"


def _clean_title(title: str) -> str:
    title = re.sub(r"\([^)]*\)", "", title)
    title = re.sub(r"[.:：\-–—]+$", "", title)
    title = re.sub(r"\s+", " ", title)
    return title.strip()


def _request_tmdb(query: str, api_key: str) -> dict[str, Any] | None:
    params = urlencode(
        {
            "api_key": api_key,
            "query": query,
            "language": "ko-KR",
            "include_adult": "false",
            "page": "1",
        }
    )
    request = Request(
        f"{TMDB_SEARCH_URL}?{params}",
        headers={"Accept": "application/json"},
    )

    try:
        with urlopen(request, timeout=5) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception:
        return None


def fetch_movie_info(title: str) -> dict[str, Any]:
    api_key = os.getenv("TMDB_API_KEY", "").strip()
    if not api_key or not title:
        return {
            "source": "tmdb",
            "matched": False,
            "posterUrl": "",
            "overview": "",
            "releaseDate": "",
            "tmdbUrl": "",
            "matchedTitle": "",
        }

    candidates = []
    raw_title = title.strip()
    cleaned_title = _clean_title(raw_title)
    for candidate in (raw_title, cleaned_title):
        if candidate and candidate not in candidates:
            candidates.append(candidate)

    for candidate in candidates:
        payload = _request_tmdb(candidate, api_key)
        results = (payload or {}).get("results") or []
        if not results:
            continue

        movie = results[0]
        poster_path = movie.get("poster_path") or ""
        movie_id = movie.get("id")
        return {
            "source": "tmdb",
            "matched": True,
            "posterUrl": f"{TMDB_IMAGE_BASE}{poster_path}" if poster_path else "",
            "overview": movie.get("overview") or "",
            "releaseDate": movie.get("release_date") or "",
            "tmdbUrl": f"{TMDB_MOVIE_URL}/{movie_id}" if movie_id else "",
            "matchedTitle": movie.get("title") or movie.get("name") or candidate,
        }

    return {
        "source": "tmdb",
        "matched": False,
        "posterUrl": "",
        "overview": "",
        "releaseDate": "",
        "tmdbUrl": "",
        "matchedTitle": "",
    }
