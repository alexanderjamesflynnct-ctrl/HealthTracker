import csv
import sqlite3
from pathlib import Path

DB_PATH  = Path(__file__).parent.parent / "health.db"
CSV_PATH = Path(__file__).parent.parent.parent / "Samsung" / "com.samsung.shealth.tracker.pedometer_day_summary.20260430011625.csv"

COLUMNS = [
    "datauuid",
    "day_time",
    "step_count",
    "distance",
    "calorie",
    "deviceuuid",
]

INTEGER_COLS = {"step_count"}
FLOAT_COLS   = {"distance", "speed", "calorie"}

def parse_value(col, value):
    if value is None or value.strip() == "":
        return None
    value = value.strip()
    if col == "day_time":
        from datetime import datetime, timezone
        return datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
    if col in INTEGER_COLS:
        return int(value)
    if col in FLOAT_COLS:
        return float(value)
    return value

with open(CSV_PATH, encoding="utf-8") as f:
    f.readline()  # skip metadata row
    reader = csv.DictReader(f)
    rows = list(reader)

placeholders = ", ".join(["?" for _ in COLUMNS])
col_names    = ", ".join(COLUMNS)
insert_sql   = f"INSERT INTO pedometer_day_summary ({col_names}) VALUES ({placeholders})"

conn = sqlite3.connect(DB_PATH)
loaded = 0
for row in rows:
    values = [parse_value(col, row.get(col)) for col in COLUMNS]
    conn.execute(insert_sql, values)
    loaded += 1

conn.commit()
conn.close()

print(f"Loaded {loaded} rows into pedometer_day_summary table.")
