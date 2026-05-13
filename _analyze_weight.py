import csv, json

path = 'Samsung/com.samsung.health.weight.20260430011625.csv'

with open(path, encoding='utf-8') as f:
    f.readline()  # skip row 1 (metadata)
    reader = csv.DictReader(f)
    rows = list(reader)

columns = list(rows[0].keys()) if rows else []

def infer_type(values):
    """Infer the dominant data type from a list of non-empty string values."""
    if not values:
        return "unknown"
    # Try integer
    try:
        [int(v) for v in values]
        return "integer"
    except ValueError:
        pass
    # Try float
    try:
        [float(v) for v in values]
        return "float"
    except ValueError:
        pass
    return "text"

results = []
for col in columns:
    filled = [row[col].strip() for row in rows if isinstance(row.get(col), str) and row[col].strip() != '']
    never_filled = 'Y' if len(filled) == 0 else 'N'
    data_type = infer_type(filled) if filled else 'unknown'
    results.append({
        'column': col,
        'data_type': data_type,
        'never_filled': never_filled
    })

with open('weight_column_analysis.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

print(f'Done. {len(results)} columns analyzed.')
