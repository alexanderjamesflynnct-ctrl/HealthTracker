CREATE TABLE IF NOT EXISTS pedometer_day_summary (
    datauuid             TEXT PRIMARY KEY,
    day_time             TEXT,
    step_count           INTEGER,
    distance             REAL,
    calorie              REAL,
    deviceuuid           TEXT
);
