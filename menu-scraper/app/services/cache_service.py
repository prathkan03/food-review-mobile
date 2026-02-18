import json
import sqlite3
import time
from pathlib import Path

from app.config import settings

DB_PATH = Path(__file__).resolve().parent.parent.parent / "cache.db"


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS menu_cache (
            restaurant_key TEXT PRIMARY KEY,
            dishes_json TEXT NOT NULL,
            source_url TEXT,
            created_at REAL NOT NULL
        )
    """)
    return conn


def get_cached(restaurant_key: str) -> tuple[list[dict], str | None] | None:
    """Return (dishes, source_url) if a valid cache entry exists, else None."""
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT dishes_json, source_url, created_at FROM menu_cache WHERE restaurant_key = ?",
            (restaurant_key,),
        ).fetchone()
        if row is None:
            return None
        dishes_json, source_url, created_at = row
        age_days = (time.time() - created_at) / 86400
        if age_days > settings.cache_ttl_days:
            conn.execute("DELETE FROM menu_cache WHERE restaurant_key = ?", (restaurant_key,))
            conn.commit()
            return None
        return json.loads(dishes_json), source_url
    finally:
        conn.close()


def set_cached(restaurant_key: str, dishes: list[dict], source_url: str | None) -> None:
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT OR REPLACE INTO menu_cache (restaurant_key, dishes_json, source_url, created_at) VALUES (?, ?, ?, ?)",
            (restaurant_key, json.dumps(dishes), source_url, time.time()),
        )
        conn.commit()
    finally:
        conn.close()
