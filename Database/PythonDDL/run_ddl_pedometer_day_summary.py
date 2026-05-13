import sqlite3
from pathlib import Path

DB_PATH  = Path(__file__).parent.parent / "health.db"
DDL_PATH = Path(__file__).parent.parent / "DDL" / "ddl_pedometer_day_summary.sql"

ddl = DDL_PATH.read_text(encoding="utf-8")

conn = sqlite3.connect(DB_PATH)
conn.executescript(ddl)
conn.close()

print(f"Executed {DDL_PATH.name} against {DB_PATH}")
