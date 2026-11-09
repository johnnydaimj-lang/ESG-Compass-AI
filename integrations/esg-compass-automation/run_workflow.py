#!/usr/bin/env python3
"""Fetch ESG Compass updates and prepare an automation payload for another AI."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
DEFAULT_API_BASE = "https://esg-compass-ai.vercel.app/api/v1/public"
DEFAULT_CONFIG: dict[str, Any] = {
    "api_base": DEFAULT_API_BASE,
    "lookback_days": 7,
    "overlap_hours": 24,
    "minimum_score": 60,
    "page_size": 50,
    "max_pages": 20,
    "request_timeout_seconds": 30,
    "retries": 3,
    "processed_keys_limit": 10000,
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
        return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed
    except ValueError:
        return None


def load_json(path: Path, fallback: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return fallback


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def load_config(explicit: str | None) -> dict[str, Any]:
    config = dict(DEFAULT_CONFIG)
    config.update(load_json(ROOT / "config.json", {}))
    if explicit:
        config.update(load_json(Path(explicit).resolve(), {}))
    env_base = os.environ.get("ESG_COMPASS_API_BASE", "").strip()
    if env_base:
        config["api_base"] = env_base
    return config


def request_json(url: str, timeout: int, retries: int) -> dict[str, Any]:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        request = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "ESG-Compass-Automation/1.0",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code == 429:
                retry_after = int(error.headers.get("Retry-After", "60"))
                time.sleep(max(retry_after, 60))
            elif 400 <= error.code < 500:
                break
            else:
                time.sleep(min(2 ** attempt, 20))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            last_error = error
            time.sleep(min(2 ** attempt, 20))
    raise RuntimeError(f"ESG Compass API request failed: {url}: {last_error}")


def fetch_contents(
    api_base: str,
    since: str,
    curated: bool,
    config: dict[str, Any],
) -> list[dict[str, Any]]:
    page = 1
    items: list[dict[str, Any]] = []
    while page <= int(config["max_pages"]):
        params = urllib.parse.urlencode(
            {
                "curated": "true" if curated else "false",
                "since": since,
                "page": page,
                "pageSize": int(config["page_size"]),
            }
        )
        payload = request_json(
            f"{api_base.rstrip('/')}/contents?{params}",
            int(config["request_timeout_seconds"]),
            int(config["retries"]),
        )
        page_items = payload.get("items") or []
        items.extend(page_items)
        if not (payload.get("pagination") or {}).get("hasMore"):
            break
        page += 1
    return items


def dedupe_key(item: dict[str, Any]) -> str:
    link = str(item.get("link") or "").strip()
    if link:
        parsed = urllib.parse.urlsplit(link)
        query = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
        query = [(key, value) for key, value in query if not key.lower().startswith("utm_")]
        canonical = urllib.parse.urlunsplit(
            (
                parsed.scheme.lower(),
                parsed.netloc.lower(),
                parsed.path.rstrip("/"),
                urllib.parse.urlencode(query),
                "",
            )
        )
        if canonical:
            return canonical
    return "title:" + str(item.get("title") or "").strip().lower()


def processing_key(item: dict[str, Any]) -> str:
    raw = dedupe_key(item)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def normalise_item(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(item.get("id") or ""),
        "title": str(item.get("displayTitle") or item.get("titleZh") or item.get("title") or "").strip(),
        "summary": str(item.get("displaySummary") or item.get("summaryZh") or item.get("summary") or "").strip(),
        "reason": str(item.get("reason") or "").strip() if item.get("recommended") else "",
        "contentType": str(item.get("contentType") or "").strip(),
        "region": str(item.get("region") or "").strip(),
        "esgTopic": str(item.get("esgTopic") or "").strip(),
        "publishedAt": str(item.get("publishedAt") or "").strip(),
        "sourceName": str(item.get("sourceName") or "").strip(),
        "score": int(item.get("score") or 0),
        "recommended": bool(item.get("recommended")),
        "link": str(item.get("link") or item.get("articleUrl") or item.get("sourceUrl") or "").strip(),
        "sourceRefs": item.get("sourceRefs") or [],
        "zones": item.get("zones") or [],
    }


def render_digest(run_at: str, items: list[dict[str, Any]]) -> str:
    lines = [
        "# ESG Compass 自动追踪",
        "",
        f"- 运行时间：{run_at}",
        f"- 本轮新增事件：{len(items)}",
        f"- 精选事件：{sum(1 for item in items if item['recommended'])}",
        "",
    ]
    if not items:
        lines.append("本轮没有符合条件的新事件。")
        return "\n".join(lines) + "\n"

    for index, item in enumerate(items, 1):
        tag = "精选" if item["recommended"] else "跟踪"
        lines.extend(
            [
                f"## {index}. {item['title']}",
                "",
                f"- 类型：{item['contentType']}｜地区：{item['region']}｜评分：{item['score']}｜标记：{tag}",
                f"- 来源：{item['sourceName']}",
                f"- 时间：{item['publishedAt']}",
                "",
                item["summary"],
                "",
            ]
        )
        if item["reason"]:
            lines.extend([f"推荐理由：{item['reason']}", ""])
        lines.extend([f"原文：{item['link']}", ""])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", help="Path to a JSON config file")
    parser.add_argument("--reset", action="store_true", help="Ignore stored cursor and processed keys")
    args = parser.parse_args()

    config = load_config(args.config)
    api_base = str(config["api_base"]).rstrip("/")
    state_path = ROOT / "state" / "state.json"
    output_dir = ROOT / "out"
    state = {"cursor": None, "processed_keys": [], "last_run_at": None}
    if not args.reset:
        loaded_state = load_json(state_path, state)
        if isinstance(loaded_state, dict):
            state.update(loaded_state)

    now = utc_now()
    cursor_time = parse_time(state.get("cursor"))
    if cursor_time:
        since_time = cursor_time - timedelta(hours=int(config["overlap_hours"]))
    else:
        since_time = now - timedelta(days=int(config["lookback_days"]))
    since = iso(since_time)

    curated_items = fetch_contents(api_base, since, True, config)
    ordinary_items = fetch_contents(api_base, since, False, config)
    merged = {str(item.get("id") or ""): item for item in curated_items + ordinary_items if item.get("id")}

    processed = set(str(key) for key in state.get("processed_keys", []))
    minimum_score = int(config["minimum_score"])
    deduped: dict[str, dict[str, Any]] = {}
    for item in merged.values():
        normalised = normalise_item(item)
        if not normalised["id"] or not normalised["title"]:
            continue
        if not normalised["recommended"] and normalised["score"] < minimum_score:
            continue
        key = dedupe_key(normalised)
        current = deduped.get(key)
        if current is None or (
            normalised["recommended"],
            normalised["score"],
            normalised["publishedAt"],
        ) > (
            current["recommended"],
            current["score"],
            current["publishedAt"],
        ):
            deduped[key] = normalised

    selected: list[dict[str, Any]] = []
    for normalised in deduped.values():
        key = processing_key(normalised)
        if key in processed:
            continue
        normalised["processingKey"] = key
        selected.append(normalised)

    selected.sort(
        key=lambda item: (
            item["recommended"],
            item["score"],
            item["publishedAt"],
        ),
        reverse=True,
    )

    run_at = iso(now)
    status = request_json(
        f"{api_base}/status",
        int(config["request_timeout_seconds"]),
        int(config["retries"]),
    )
    next_cursor = state.get("cursor")
    candidate_times = [parse_time(item["publishedAt"]) for item in selected]
    candidate_times = [value for value in candidate_times if value is not None]
    if candidate_times:
        next_cursor = iso(max(candidate_times))

    payload = {
        "ok": True,
        "runAt": run_at,
        "apiBase": api_base,
        "since": since,
        "nextCursor": next_cursor,
        "status": status.get("status") or {},
        "counts": {
            "fetched": len(merged),
            "selected": len(selected),
            "curated": sum(1 for item in selected if item["recommended"]),
        },
        "instructions": {
            "language": "zh-CN",
            "voice": "third-person editorial",
            "evidence": "Use only fields present in each item. Never invent facts.",
            "output": "Create a concise work-platform update and preserve every item link.",
        },
        "items": selected,
    }

    write_json(output_dir / "latest_run.json", payload)
    write_json(output_dir / "ai_payload.json", payload)
    (output_dir / "latest_digest.md").write_text(render_digest(run_at, selected), encoding="utf-8")

    new_keys = [item["processingKey"] for item in selected]
    state["cursor"] = next_cursor or state.get("cursor")
    state["last_run_at"] = run_at
    state["processed_keys"] = (list(processed) + new_keys)[-int(config["processed_keys_limit"]):]
    write_json(state_path, state)

    print(
        json.dumps(
            {
                "ok": True,
                "fetched": len(merged),
                "selected": len(selected),
                "curated": payload["counts"]["curated"],
                "output": "out/ai_payload.json",
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False), file=sys.stderr)
        raise SystemExit(1)
