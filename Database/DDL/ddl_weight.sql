CREATE TABLE IF NOT EXISTS weight (
    datauuid             TEXT PRIMARY KEY,
    weight               REAL,
    create_time          TEXT,
    time_offset          TEXT,
    deviceuuid           TEXT
);
