import csv
import sqlite3
from pathlib import Path

DB_PATH  = Path(__file__).parent.parent / "health.db"
CSV_PATH = Path(__file__).parent.parent.parent / "Samsung" / "com.samsung.health.weight.20260430011625.csv"

# Columns to load (excludes never-filled and rarely-used columns)
COLUMNS = [
    "datauuid",
    "weight",
    "create_time",
    "time_offset",
    "deviceuuid",
]

def parse_value(col, value):
    """Convert string value to the appropriate Python type, or None if empty."""
    if value is None or value.strip() == "":
        return None
    value = value.strip()
    integer_cols = set()
    float_cols   = {"weight"}
    if col in integer_cols:
        return int(value)
    if col in float_cols:
        return float(value)
    return value

with open(CSV_PATH, encoding="utf-8") as f:
    f.readline()  # skip metadata row
    reader = csv.DictReader(f)
    rows = list(reader)

placeholders = ", ".join(["?" for _ in COLUMNS])
col_names    = ", ".join(COLUMNS)
insert_sql   = f"INSERT INTO weight ({col_names}) VALUES ({placeholders})"

conn = sqlite3.connect(DB_PATH)
loaded = 0
for row in rows:
    values = [parse_value(col, row.get(col)) for col in COLUMNS]
    conn.execute(insert_sql, values)
    loaded += 1

conn.commit()
conn.close()

print(f"Loaded {loaded} rows into weight table.")
