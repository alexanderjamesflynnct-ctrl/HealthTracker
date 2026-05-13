using HealthTrackerAPI.Models;
using Microsoft.Data.Sqlite;

namespace HealthTrackerAPI.Data;

public class HealthDatabase
{
    private readonly string _connectionString;

    // Allowed sort columns mapped to their SQL column names (whitelist to prevent injection)
    private static readonly Dictionary<string, string> PedometerSortColumns = new(StringComparer.OrdinalIgnoreCase)
    {
        ["dayTime"]    = "day_time",
        ["stepCount"]  = "step_count",
        ["calorie"]    = "calorie",
    };

    public HealthDatabase(IConfiguration configuration)
    {
        var dbPath = configuration["DatabasePath"] ?? "../../../Database/health.db";
        _connectionString = $"Data Source={dbPath}";
    }

    // ── App Strings — table, seed, CRUD ──────────────────────────────────────
    public async Task EnsureAppStringsTableAsync()
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        const string createSql = """
            CREATE TABLE IF NOT EXISTS app_strings (
                application TEXT NOT NULL DEFAULT 'HealthTracker',
                page        TEXT NOT NULL,
                unique_id   TEXT NOT NULL,
                language    TEXT NOT NULL DEFAULT 'en',
                value       TEXT NOT NULL DEFAULT '',
                PRIMARY KEY (application, page, unique_id, language)
            )
            """;
        await using (var cmd = new SqliteCommand(createSql, connection))
            await cmd.ExecuteNonQueryAsync();

        const string auditSql = """
            CREATE TABLE IF NOT EXISTS app_strings_audit (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                application TEXT NOT NULL,
                page        TEXT NOT NULL,
                unique_id   TEXT NOT NULL,
                language    TEXT NOT NULL,
                old_value   TEXT NOT NULL DEFAULT '',
                new_value   TEXT NOT NULL DEFAULT '',
                changed_by_ip TEXT NOT NULL DEFAULT '',
                changed_at  TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """;
        await using (var cmd = new SqliteCommand(auditSql, connection))
            await cmd.ExecuteNonQueryAsync();
    }

    public async Task<IReadOnlyList<AppString>> GetAllStringsAsync(string language = "en")
    {
        var filterByLang = language != "all";
        var sql = filterByLang
            ? "SELECT application, page, unique_id, language, value FROM app_strings WHERE language = @lang ORDER BY page, unique_id"
            : "SELECT application, page, unique_id, language, value FROM app_strings ORDER BY page, unique_id, language";
        var results = new List<AppString>();
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        if (filterByLang) cmd.Parameters.AddWithValue("@lang", language);
        await using var rdr = await cmd.ExecuteReaderAsync();
        while (await rdr.ReadAsync())
        {
            results.Add(new AppString
            {
                Application = rdr.GetString(0),
                Page        = rdr.GetString(1),
                UniqueId    = rdr.GetString(2),
                Language    = rdr.GetString(3),
                Value       = rdr.GetString(4),
            });
        }
        return results;
    }

    public async Task<AppString?> GetStringAsync(string page, string uniqueId, string language = "en")
    {
        const string sql = """
            SELECT application, page, unique_id, language, value
            FROM app_strings
            WHERE page = @page AND unique_id = @uid AND language = @lang
            LIMIT 1
            """;
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        cmd.Parameters.AddWithValue("@page", page);
        cmd.Parameters.AddWithValue("@uid",  uniqueId);
        cmd.Parameters.AddWithValue("@lang", language);
        await using var rdr = await cmd.ExecuteReaderAsync();
        if (!await rdr.ReadAsync()) return null;
        return new AppString
        {
            Application = rdr.GetString(0),
            Page        = rdr.GetString(1),
            UniqueId    = rdr.GetString(2),
            Language    = rdr.GetString(3),
            Value       = rdr.GetString(4),
        };
    }

    public async Task<IReadOnlyList<StringAuditEntry>> GetStringAuditLogAsync()
    {
        const string sql = """
            SELECT id, page, unique_id, language, old_value, new_value, changed_by_ip, changed_at
            FROM app_strings_audit
            ORDER BY changed_at DESC
            """;
        var results = new List<StringAuditEntry>();
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        await using var rdr = await cmd.ExecuteReaderAsync();
        while (await rdr.ReadAsync())
        {
            results.Add(new StringAuditEntry
            {
                Id          = rdr.GetInt32(0),
                Page        = rdr.GetString(1),
                UniqueId    = rdr.GetString(2),
                Language    = rdr.GetString(3),
                OldValue    = rdr.GetString(4),
                NewValue    = rdr.GetString(5),
                ChangedByIp = rdr.GetString(6),
                ChangedAt   = rdr.GetString(7),
            });
        }
        return results;
    }

    public async Task UpsertStringAsync(string page, string uniqueId, string value, string language = "en", string ipAddress = "")
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        // Get old value for audit
        string oldValue = "";
        const string selectSql = "SELECT value FROM app_strings WHERE application = 'HealthTracker' AND page = @page AND unique_id = @uid AND language = @lang";
        await using (var selCmd = new SqliteCommand(selectSql, connection))
        {
            selCmd.Parameters.AddWithValue("@page", page);
            selCmd.Parameters.AddWithValue("@uid",  uniqueId);
            selCmd.Parameters.AddWithValue("@lang", language);
            var result = await selCmd.ExecuteScalarAsync();
            if (result is string s) oldValue = s;
        }

        // Upsert the string
        const string sql = """
            INSERT INTO app_strings (application, page, unique_id, language, value)
            VALUES ('HealthTracker', @page, @uid, @lang, @value)
            ON CONFLICT(application, page, unique_id, language) DO UPDATE SET
                value = excluded.value
            """;
        await using (var cmd = new SqliteCommand(sql, connection))
        {
            cmd.Parameters.AddWithValue("@page",  page);
            cmd.Parameters.AddWithValue("@uid",   uniqueId);
            cmd.Parameters.AddWithValue("@lang",  language);
            cmd.Parameters.AddWithValue("@value", value);
            await cmd.ExecuteNonQueryAsync();
        }

        // Log audit entry (only if value actually changed)
        if (oldValue != value)
        {
            const string auditSql = """
                INSERT INTO app_strings_audit (application, page, unique_id, language, old_value, new_value, changed_by_ip, changed_at)
                VALUES ('HealthTracker', @page, @uid, @lang, @oldVal, @newVal, @ip, datetime('now'))
                """;
            await using var auditCmd = new SqliteCommand(auditSql, connection);
            auditCmd.Parameters.AddWithValue("@page",   page);
            auditCmd.Parameters.AddWithValue("@uid",    uniqueId);
            auditCmd.Parameters.AddWithValue("@lang",   language);
            auditCmd.Parameters.AddWithValue("@oldVal", oldValue);
            auditCmd.Parameters.AddWithValue("@newVal", value);
            auditCmd.Parameters.AddWithValue("@ip",     ipAddress);
            await auditCmd.ExecuteNonQueryAsync();
        }
    }

    public async Task SeedStringsAsync(IReadOnlyList<AppString> strings)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        foreach (var s in strings)
        {
            const string sql = """
                INSERT OR IGNORE INTO app_strings (application, page, unique_id, language, value)
                VALUES (@app, @page, @uid, @lang, @value)
                """;
            await using var cmd = new SqliteCommand(sql, connection);
            cmd.Parameters.AddWithValue("@app",   s.Application);
            cmd.Parameters.AddWithValue("@page",  s.Page);
            cmd.Parameters.AddWithValue("@uid",   s.UniqueId);
            cmd.Parameters.AddWithValue("@lang",  s.Language);
            cmd.Parameters.AddWithValue("@value", s.Value);
            await cmd.ExecuteNonQueryAsync();
        }
    }

    // ── Paginated + filtered + sorted pedometer query ─────────────────────────
    public async Task<PagedResult<PedometerDaySummary>> GetPedometerPageAsync(
        int page,
        int pageSize,
        string? searchDayTime,
        string? searchStepCount,
        string? searchCalorie,
        string sortBy,
        string sortDir)
    {
        // Validate / default sort params
        if (!PedometerSortColumns.TryGetValue(sortBy, out var sortCol))
            sortCol = "day_time";
        var direction = sortDir.Equals("asc", StringComparison.OrdinalIgnoreCase) ? "ASC" : "DESC";

        // Build WHERE clause with parameterised LIKE filters
        var whereParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(searchDayTime))    whereParts.Add("COALESCE(day_time, '') LIKE @dayTime");
        if (!string.IsNullOrWhiteSpace(searchStepCount))  whereParts.Add("CAST(step_count AS TEXT) LIKE @stepCount");
        if (!string.IsNullOrWhiteSpace(searchCalorie))    whereParts.Add("CAST(calorie AS TEXT) LIKE @calorie");

        var where = whereParts.Count > 0 ? "WHERE " + string.Join(" AND ", whereParts) : "";

        var countSql = $"SELECT COUNT(*) FROM pedometer_day_summary {where}";
        var dataSql  = $"""
            SELECT datauuid, day_time, step_count, calorie
            FROM pedometer_day_summary
            {where}
            ORDER BY {sortCol} {direction}
            LIMIT @limit OFFSET @offset
            """;

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        // Helper to add filter params to a command
        void AddFilterParams(SqliteCommand cmd)
        {
            if (!string.IsNullOrWhiteSpace(searchDayTime))
                cmd.Parameters.AddWithValue("@dayTime",    $"%{searchDayTime}%");
            if (!string.IsNullOrWhiteSpace(searchStepCount))
                cmd.Parameters.AddWithValue("@stepCount",  $"%{searchStepCount}%");
            if (!string.IsNullOrWhiteSpace(searchCalorie))
                cmd.Parameters.AddWithValue("@calorie",    $"%{searchCalorie}%");
        }

        // Count
        int totalCount;
        await using (var countCmd = new SqliteCommand(countSql, connection))
        {
            AddFilterParams(countCmd);
            totalCount = Convert.ToInt32(await countCmd.ExecuteScalarAsync());
        }

        // Data
        var offset  = (page - 1) * pageSize;
        var results = new List<PedometerDaySummary>();

        await using (var dataCmd = new SqliteCommand(dataSql, connection))
        {
            AddFilterParams(dataCmd);
            dataCmd.Parameters.AddWithValue("@limit",  pageSize);
            dataCmd.Parameters.AddWithValue("@offset", offset);

            await using var reader = await dataCmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                results.Add(new PedometerDaySummary
                {
                    DataUuid  = reader.GetString(0),
                    DayTime   = reader.IsDBNull(1) ? null : reader.GetString(1),
                    StepCount = reader.IsDBNull(2) ? 0    : reader.GetInt32(2),
                    Calorie   = reader.IsDBNull(3) ? 0.0  : reader.GetDouble(3),
                });
            }
        }

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PagedResult<PedometerDaySummary>(results, totalCount, page, pageSize, totalPages);
    }

    // ── Dashboard stats (max per day, deduped) ────────────────────────────────
    public async Task<PedometerStats> GetPedometerStatsAsync(int year)
    {
        // All-time: best single day (max step_count per day_time, then overall max)
        const string allTimeSql = """
            SELECT day_time, MAX(step_count) as max_steps
            FROM pedometer_day_summary
            WHERE day_time IS NOT NULL
            GROUP BY day_time
            ORDER BY max_steps DESC
            LIMIT 1
            """;

        // Year: best single day and average across distinct days for the given year
        const string yearSql = """
            SELECT
                MAX(daily_max)                        AS year_max,
                MAX(CASE WHEN daily_max = (
                    SELECT MAX(daily_max) FROM (
                        SELECT day_time, MAX(step_count) AS daily_max
                        FROM pedometer_day_summary
                        WHERE day_time LIKE @yearPrefix
                        GROUP BY day_time
                    )
                ) THEN day_time ELSE NULL END)         AS best_date,
                CAST(ROUND(AVG(daily_max)) AS INTEGER) AS avg_steps,
                COUNT(*)                               AS distinct_days
            FROM (
                SELECT day_time, MAX(step_count) AS daily_max
                FROM pedometer_day_summary
                WHERE day_time LIKE @yearPrefix
                GROUP BY day_time
            )
            """;

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        // All-time best
        int    allTimeMax  = 0;
        string allTimeBest = "";
        await using (var cmd = new SqliteCommand(allTimeSql, connection))
        await using (var rdr = await cmd.ExecuteReaderAsync())
        {
            if (await rdr.ReadAsync())
            {
                allTimeBest = rdr.IsDBNull(0) ? "" : rdr.GetString(0);
                allTimeMax  = rdr.IsDBNull(1) ? 0  : rdr.GetInt32(1);
            }
        }

        // Year stats
        int    yearMax      = 0;
        string yearBest     = "";
        int    yearAvg      = 0;
        int    distinctDays = 0;
        await using (var cmd = new SqliteCommand(yearSql, connection))
        {
            cmd.Parameters.AddWithValue("@yearPrefix", $"{year}%");
            await using var rdr = await cmd.ExecuteReaderAsync();
            if (await rdr.ReadAsync())
            {
                yearMax      = rdr.IsDBNull(0) ? 0  : rdr.GetInt32(0);
                yearBest     = rdr.IsDBNull(1) ? "" : rdr.GetString(1);
                yearAvg      = rdr.IsDBNull(2) ? 0  : rdr.GetInt32(2);
                distinctDays = rdr.IsDBNull(3) ? 0  : rdr.GetInt32(3);
            }
        }

        return new PedometerStats(
            AllTimeMaxSteps:    allTimeMax,
            AllTimeBestDate:    allTimeBest,
            YearMaxSteps:       yearMax,
            YearBestDate:       yearBest,
            YearAvgStepsPerDay: yearAvg,
            YearDistinctDays:   distinctDays,
            Year:               year
        );
    }

    // ── Unpaginated pedometer (kept for backwards compat) ─────────────────────
    public async Task<IReadOnlyList<PedometerDaySummary>> GetPedometerSummariesAsync()
    {
        const string sql = """
            SELECT datauuid, day_time, step_count, calorie
            FROM pedometer_day_summary
            ORDER BY day_time DESC
            """;

        var results = new List<PedometerDaySummary>();

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqliteCommand(sql, connection);
        await using var reader  = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            results.Add(new PedometerDaySummary
            {
                DataUuid  = reader.GetString(0),
                DayTime   = reader.IsDBNull(1) ? null : reader.GetString(1),
                StepCount = reader.IsDBNull(2) ? 0    : reader.GetInt32(2),
                Calorie   = reader.IsDBNull(3) ? 0.0  : reader.GetDouble(3),
            });
        }

        return results;
    }

    // ── Activity monthly history — all months, oldest first ──────────────────
    public async Task<IReadOnlyList<MonthlyActivityStats>> GetActivityMonthlyHistoryAsync()
    {
        const string sql = """
            SELECT
                month,
                MIN(daily_max)                         AS min_steps,
                MAX(daily_max)                         AS max_steps,
                CAST(ROUND(AVG(daily_max)) AS INTEGER) AS avg_steps,
                COUNT(*)                               AS day_count
            FROM (
                SELECT day_time, MAX(step_count) AS daily_max,
                       SUBSTR(day_time, 1, 7) AS month
                FROM pedometer_day_summary
                WHERE day_time IS NOT NULL
                GROUP BY day_time
            )
            GROUP BY month
            ORDER BY month ASC
            """;

        var results = new List<MonthlyActivityStats>();
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        await using var rdr = await cmd.ExecuteReaderAsync();

        while (await rdr.ReadAsync())
        {
            var month = rdr.GetString(0);
            var label = DateTime.TryParse(month + "-01", out var dt)
                ? dt.ToString("MMM yyyy")
                : month;

            results.Add(new MonthlyActivityStats(
                Month:      month,
                MonthLabel: label,
                MinSteps:   rdr.IsDBNull(1) ? 0 : rdr.GetInt32(1),
                MaxSteps:   rdr.IsDBNull(2) ? 0 : rdr.GetInt32(2),
                AvgSteps:   rdr.IsDBNull(3) ? 0 : rdr.GetInt32(3),
                DayCount:   rdr.IsDBNull(4) ? 0 : rdr.GetInt32(4)
            ));
        }

        return results;
    }

    // ── Activity year-over-year for a specific month ──────────────────────────
    public async Task<IReadOnlyList<MonthlyActivityStats>> GetActivityYearOverYearAsync(int month)
    {
        var monthPad = month.ToString("D2");

        const string sql = """
            SELECT
                SUBSTR(day_time, 1, 4)                 AS year,
                MIN(daily_max)                         AS min_steps,
                MAX(daily_max)                         AS max_steps,
                CAST(ROUND(AVG(daily_max)) AS INTEGER) AS avg_steps,
                COUNT(*)                               AS day_count
            FROM (
                SELECT day_time, MAX(step_count) AS daily_max
                FROM pedometer_day_summary
                WHERE day_time IS NOT NULL
                  AND SUBSTR(day_time, 6, 2) = @month
                GROUP BY day_time
            )
            GROUP BY year
            ORDER BY year ASC
            """;

        var results = new List<MonthlyActivityStats>();
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        cmd.Parameters.AddWithValue("@month", monthPad);
        await using var rdr = await cmd.ExecuteReaderAsync();

        while (await rdr.ReadAsync())
        {
            var year = rdr.GetString(0);

            results.Add(new MonthlyActivityStats(
                Month:      year,
                MonthLabel: year,
                MinSteps:   rdr.IsDBNull(1) ? 0 : rdr.GetInt32(1),
                MaxSteps:   rdr.IsDBNull(2) ? 0 : rdr.GetInt32(2),
                AvgSteps:   rdr.IsDBNull(3) ? 0 : rdr.GetInt32(3),
                DayCount:   rdr.IsDBNull(4) ? 0 : rdr.GetInt32(4)
            ));
        }

        return results;
    }

    // ── Steps — get by date, add, replace ────────────────────────────────────
    public async Task<PedometerDaySummary?> GetStepsByDateAsync(string date)
    {
        const string sql = """
            SELECT datauuid, day_time, step_count, calorie
            FROM pedometer_day_summary
            WHERE day_time = @date
            ORDER BY step_count DESC
            LIMIT 1
            """;
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        cmd.Parameters.AddWithValue("@date", date);
        await using var rdr = await cmd.ExecuteReaderAsync();
        if (!await rdr.ReadAsync()) return null;
        return new PedometerDaySummary
        {
            DataUuid  = rdr.GetString(0),
            DayTime   = rdr.IsDBNull(1) ? null : rdr.GetString(1),
            StepCount = rdr.IsDBNull(2) ? 0    : rdr.GetInt32(2),
            Calorie   = rdr.IsDBNull(3) ? 0.0  : rdr.GetDouble(3),
        };
    }

    public async Task<PedometerDaySummary> AddStepsAsync(AddStepsRequest req)
    {
        var uuid = Guid.NewGuid().ToString();
        const string sql = """
            INSERT INTO pedometer_day_summary (datauuid, day_time, step_count, distance, calorie, deviceuuid)
            VALUES (@uuid, @dayTime, @stepCount, 0, 0, 'manual')
            """;
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        cmd.Parameters.AddWithValue("@uuid",      uuid);
        cmd.Parameters.AddWithValue("@dayTime",   req.DayTime);
        cmd.Parameters.AddWithValue("@stepCount", req.StepCount);
        await cmd.ExecuteNonQueryAsync();
        return new PedometerDaySummary { DataUuid = uuid, DayTime = req.DayTime, StepCount = req.StepCount, Calorie = 0 };
    }

    public async Task<PedometerDaySummary> ReplaceStepsAsync(string existingUuid, AddStepsRequest req)
    {
        const string deleteSql = "DELETE FROM pedometer_day_summary WHERE datauuid = @uuid";
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using (var cmd = new SqliteCommand(deleteSql, connection))
        {
            cmd.Parameters.AddWithValue("@uuid", existingUuid);
            await cmd.ExecuteNonQueryAsync();
        }
        return await AddStepsAsync(req);
    }

    // ── Activity yearly totals ────────────────────────────────────────────────
    public async Task<IReadOnlyList<YearlyStepTotal>> GetActivityYearlyTotalsAsync()
    {
        const string sql = """
            SELECT
                SUBSTR(day_time, 1, 4)      AS year,
                SUM(daily_max)              AS total_steps
            FROM (
                SELECT day_time, MAX(step_count) AS daily_max
                FROM pedometer_day_summary
                WHERE day_time IS NOT NULL
                GROUP BY day_time
            )
            GROUP BY year
            ORDER BY year ASC
            """;

        var results = new List<YearlyStepTotal>();
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        await using var rdr = await cmd.ExecuteReaderAsync();
        while (await rdr.ReadAsync())
            results.Add(new YearlyStepTotal(rdr.GetString(0), rdr.IsDBNull(1) ? 0 : rdr.GetInt32(1)));
        return results;
    }

    // ── Activity annual summary — one row per year, all months ───────────────
    public async Task<IReadOnlyList<MonthlyActivityStats>> GetActivityAnnualSummaryAsync()
    {
        const string sql = """
            SELECT
                SUBSTR(day_time, 1, 4)                 AS year,
                MIN(daily_max)                         AS min_steps,
                MAX(daily_max)                         AS max_steps,
                CAST(ROUND(AVG(daily_max)) AS INTEGER) AS avg_steps,
                COUNT(*)                               AS day_count
            FROM (
                SELECT day_time, MAX(step_count) AS daily_max
                FROM pedometer_day_summary
                WHERE day_time IS NOT NULL
                GROUP BY day_time
            )
            GROUP BY year
            ORDER BY year ASC
            """;

        var results = new List<MonthlyActivityStats>();
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        await using var rdr = await cmd.ExecuteReaderAsync();

        while (await rdr.ReadAsync())
        {
            var year = rdr.GetString(0);

            results.Add(new MonthlyActivityStats(
                Month:      year,
                MonthLabel: year,
                MinSteps:   rdr.IsDBNull(1) ? 0 : rdr.GetInt32(1),
                MaxSteps:   rdr.IsDBNull(2) ? 0 : rdr.GetInt32(2),
                AvgSteps:   rdr.IsDBNull(3) ? 0 : rdr.GetInt32(3),
                DayCount:   rdr.IsDBNull(4) ? 0 : rdr.GetInt32(4)
            ));
        }

        return results;
    }

    // ── Activity monthly stats (max-per-day deduped, rolling 12 months) ───────
    public async Task<ActivityStats> GetActivityStatsAsync()
    {
        // Group by day first (take max per day to dedupe devices),
        // then aggregate by month
        const string sql = """
            SELECT
                SUBSTR(day_time, 1, 7)          AS month,
                MIN(daily_max)                   AS min_steps,
                MAX(daily_max)                   AS max_steps,
                CAST(ROUND(AVG(daily_max)) AS INTEGER) AS avg_steps,
                COUNT(*)                         AS day_count
            FROM (
                SELECT day_time, MAX(step_count) AS daily_max
                FROM pedometer_day_summary
                WHERE day_time IS NOT NULL
                  AND day_time >= @cutoff
                GROUP BY day_time
            )
            GROUP BY month
            ORDER BY month DESC
            """;

        var cutoff = DateTime.UtcNow.AddMonths(-11).ToString("yyyy-MM-01");
        var monthly = new List<MonthlyActivityStats>();

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        await using var cmd = new SqliteCommand(sql, connection);
        cmd.Parameters.AddWithValue("@cutoff", cutoff);
        await using var rdr = await cmd.ExecuteReaderAsync();

        while (await rdr.ReadAsync())
        {
            var month = rdr.GetString(0);
            var label = DateTime.TryParse(month + "-01", out var dt)
                ? dt.ToString("MMM yyyy")
                : month;

            monthly.Add(new MonthlyActivityStats(
                Month:      month,
                MonthLabel: label,
                MinSteps:   rdr.IsDBNull(1) ? 0 : rdr.GetInt32(1),
                MaxSteps:   rdr.IsDBNull(2) ? 0 : rdr.GetInt32(2),
                AvgSteps:   rdr.IsDBNull(3) ? 0 : rdr.GetInt32(3),
                DayCount:   rdr.IsDBNull(4) ? 0 : rdr.GetInt32(4)
            ));
        }

        return new ActivityStats(monthly);
    }

    // ── Weight annual summary — one row per year, all months ─────────────────
    public async Task<IReadOnlyList<MonthlyWeightStats>> GetWeightAnnualSummaryAsync()
    {
        const double KgToLbs = 2.20462;
        const string sql = """
            SELECT
                SUBSTR(create_time, 1, 4)             AS year,
                MIN(weight)                            AS min_kg,
                MAX(weight)                            AS max_kg,
                AVG(weight)                            AS avg_kg,
                COUNT(*)                               AS cnt
            FROM weight
            WHERE weight IS NOT NULL AND weight > 0
              AND create_time IS NOT NULL
            GROUP BY year
            ORDER BY year ASC
            """;

        var results = new List<MonthlyWeightStats>();
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        await using var rdr = await cmd.ExecuteReaderAsync();

        while (await rdr.ReadAsync())
        {
            var year  = rdr.GetString(0);
            var minKg = rdr.IsDBNull(1) ? 0 : rdr.GetDouble(1);
            var maxKg = rdr.IsDBNull(2) ? 0 : rdr.GetDouble(2);
            var avgKg = rdr.IsDBNull(3) ? 0 : rdr.GetDouble(3);
            var cnt   = rdr.IsDBNull(4) ? 0 : rdr.GetInt32(4);

            results.Add(new MonthlyWeightStats(
                Month:       year,
                MonthLabel:  year,
                MinKg:       Math.Round(minKg, 1),
                MinLbs:      Math.Round(minKg * KgToLbs, 1),
                MaxKg:       Math.Round(maxKg, 1),
                MaxLbs:      Math.Round(maxKg * KgToLbs, 1),
                AvgKg:       Math.Round(avgKg, 1),
                AvgLbs:      Math.Round(avgKg * KgToLbs, 1),
                RecordCount: cnt
            ));
        }
        return results;
    }

    // ── Weight year-over-year for a specific month ────────────────────────────
    public async Task<IReadOnlyList<MonthlyWeightStats>> GetWeightYearOverYearAsync(int month)
    {
        const double KgToLbs = 2.20462;
        // Pad month to 2 digits for LIKE matching e.g. "%-04-%"
        var monthPad = month.ToString("D2");

        const string sql = """
            SELECT
                SUBSTR(create_time, 1, 4)            AS year,
                MIN(weight)                           AS min_kg,
                MAX(weight)                           AS max_kg,
                AVG(weight)                           AS avg_kg,
                COUNT(*)                              AS cnt
            FROM weight
            WHERE weight IS NOT NULL AND weight > 0
              AND create_time IS NOT NULL
              AND SUBSTR(create_time, 6, 2) = @month
            GROUP BY year
            ORDER BY year ASC
            """;

        var results = new List<MonthlyWeightStats>();
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        cmd.Parameters.AddWithValue("@month", monthPad);
        await using var rdr = await cmd.ExecuteReaderAsync();

        while (await rdr.ReadAsync())
        {
            var year   = rdr.GetString(0);
            var minKg  = rdr.IsDBNull(1) ? 0 : rdr.GetDouble(1);
            var maxKg  = rdr.IsDBNull(2) ? 0 : rdr.GetDouble(2);
            var avgKg  = rdr.IsDBNull(3) ? 0 : rdr.GetDouble(3);
            var cnt    = rdr.IsDBNull(4) ? 0 : rdr.GetInt32(4);

            // Use year as both month key and label
            results.Add(new MonthlyWeightStats(
                Month:       year,
                MonthLabel:  year,
                MinKg:       Math.Round(minKg, 1),
                MinLbs:      Math.Round(minKg * KgToLbs, 1),
                MaxKg:       Math.Round(maxKg, 1),
                MaxLbs:      Math.Round(maxKg * KgToLbs, 1),
                AvgKg:       Math.Round(avgKg, 1),
                AvgLbs:      Math.Round(avgKg * KgToLbs, 1),
                RecordCount: cnt
            ));
        }
        return results;
    }

    // ── Weight monthly history — all months, oldest first ────────────────────
    public async Task<IReadOnlyList<MonthlyWeightStats>> GetWeightMonthlyHistoryAsync()
    {
        const double KgToLbs = 2.20462;
        const string sql = """
            SELECT
                SUBSTR(create_time, 1, 7)            AS month,
                MIN(weight)                           AS min_kg,
                MAX(weight)                           AS max_kg,
                AVG(weight)                           AS avg_kg,
                COUNT(*)                              AS cnt
            FROM weight
            WHERE weight IS NOT NULL AND weight > 0
              AND create_time IS NOT NULL
            GROUP BY month
            ORDER BY month ASC
            """;

        var results = new List<MonthlyWeightStats>();
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        await using var rdr = await cmd.ExecuteReaderAsync();

        while (await rdr.ReadAsync())
        {
            var month  = rdr.GetString(0);
            var minKg  = rdr.IsDBNull(1) ? 0 : rdr.GetDouble(1);
            var maxKg  = rdr.IsDBNull(2) ? 0 : rdr.GetDouble(2);
            var avgKg  = rdr.IsDBNull(3) ? 0 : rdr.GetDouble(3);
            var cnt    = rdr.IsDBNull(4) ? 0 : rdr.GetInt32(4);
            var label  = DateTime.TryParse(month + "-01", out var dt) ? dt.ToString("MMM yyyy") : month;

            results.Add(new MonthlyWeightStats(
                Month:       month,
                MonthLabel:  label,
                MinKg:       Math.Round(minKg, 1),
                MinLbs:      Math.Round(minKg * KgToLbs, 1),
                MaxKg:       Math.Round(maxKg, 1),
                MaxLbs:      Math.Round(maxKg * KgToLbs, 1),
                AvgKg:       Math.Round(avgKg, 1),
                AvgLbs:      Math.Round(avgKg * KgToLbs, 1),
                RecordCount: cnt
            ));
        }
        return results;
    }

    // ── Weight stats for dashboard ────────────────────────────────────────────
    public async Task<WeightStats> GetWeightStatsAsync(int year)
    {
        const double KgToLbs = 2.20462;

        // All-time minimum (single reading)
        const string allTimeSql = """
            SELECT create_time, weight
            FROM weight
            WHERE weight IS NOT NULL AND weight > 0
            ORDER BY weight ASC
            LIMIT 1
            """;

        // All-time maximum (single reading)
        const string allTimeMaxSql = """
            SELECT create_time, weight
            FROM weight
            WHERE weight IS NOT NULL AND weight > 0
            ORDER BY weight DESC
            LIMIT 1
            """;

        // Year minimum
        const string yearMinSql = """
            SELECT create_time, weight
            FROM weight
            WHERE weight IS NOT NULL AND weight > 0
              AND create_time LIKE @yearPrefix
            ORDER BY weight ASC
            LIMIT 1
            """;

        // Year average
        const string yearAvgSql = """
            SELECT AVG(weight)
            FROM weight
            WHERE weight IS NOT NULL AND weight > 0
              AND create_time LIKE @yearPrefix
            """;

        // Monthly stats for past 12 months
        const string monthlySql = """
            SELECT
                SUBSTR(create_time, 1, 7)   AS month,
                MIN(weight)                  AS min_kg,
                MAX(weight)                  AS max_kg,
                AVG(weight)                  AS avg_kg,
                COUNT(*)                     AS cnt
            FROM weight
            WHERE weight IS NOT NULL AND weight > 0
              AND create_time >= @cutoff
            GROUP BY month
            ORDER BY month DESC
            """;

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        // All-time min
        double allTimeMinKg = 0; string allTimeMinDate = "";
        await using (var cmd = new SqliteCommand(allTimeSql, connection))
        await using (var rdr = await cmd.ExecuteReaderAsync())
        {
            if (await rdr.ReadAsync())
            {
                allTimeMinDate = rdr.IsDBNull(0) ? "" : rdr.GetString(0);
                allTimeMinKg   = rdr.IsDBNull(1) ? 0  : rdr.GetDouble(1);
            }
        }

        // All-time max
        double allTimeMaxKg = 0; string allTimeMaxDate = "";
        await using (var cmd = new SqliteCommand(allTimeMaxSql, connection))
        await using (var rdr = await cmd.ExecuteReaderAsync())
        {
            if (await rdr.ReadAsync())
            {
                allTimeMaxDate = rdr.IsDBNull(0) ? "" : rdr.GetString(0);
                allTimeMaxKg   = rdr.IsDBNull(1) ? 0  : rdr.GetDouble(1);
            }
        }

        var yearPrefix = $"{year}%";

        // Year min
        double yearMinKg = 0; string yearMinDate = "";
        await using (var cmd = new SqliteCommand(yearMinSql, connection))
        {
            cmd.Parameters.AddWithValue("@yearPrefix", yearPrefix);
            await using var rdr = await cmd.ExecuteReaderAsync();
            if (await rdr.ReadAsync())
            {
                yearMinDate = rdr.IsDBNull(0) ? "" : rdr.GetString(0);
                yearMinKg   = rdr.IsDBNull(1) ? 0  : rdr.GetDouble(1);
            }
        }

        // Year avg
        double yearAvgKg = 0;
        await using (var cmd = new SqliteCommand(yearAvgSql, connection))
        {
            cmd.Parameters.AddWithValue("@yearPrefix", yearPrefix);
            var scalar = await cmd.ExecuteScalarAsync();
            yearAvgKg = scalar is DBNull || scalar is null ? 0 : Convert.ToDouble(scalar);
        }

        // Monthly — past 12 months from start of current month
        var cutoff = DateTime.UtcNow.AddMonths(-11).ToString("yyyy-MM-01");
        var monthly = new List<MonthlyWeightStats>();
        await using (var cmd = new SqliteCommand(monthlySql, connection))
        {
            cmd.Parameters.AddWithValue("@cutoff", cutoff);
            await using var rdr = await cmd.ExecuteReaderAsync();
            while (await rdr.ReadAsync())
            {
                var month    = rdr.GetString(0);
                var minKg    = rdr.IsDBNull(1) ? 0 : rdr.GetDouble(1);
                var maxKg    = rdr.IsDBNull(2) ? 0 : rdr.GetDouble(2);
                var avgKg    = rdr.IsDBNull(3) ? 0 : rdr.GetDouble(3);
                var cnt      = rdr.IsDBNull(4) ? 0 : rdr.GetInt32(4);

                // Format "2025-04" → "Apr 2025"
                var label = DateTime.TryParse(month + "-01", out var dt)
                    ? dt.ToString("MMM yyyy")
                    : month;

                monthly.Add(new MonthlyWeightStats(
                    Month:       month,
                    MonthLabel:  label,
                    MinKg:       Math.Round(minKg, 1),
                    MinLbs:      Math.Round(minKg * KgToLbs, 1),
                    MaxKg:       Math.Round(maxKg, 1),
                    MaxLbs:      Math.Round(maxKg * KgToLbs, 1),
                    AvgKg:       Math.Round(avgKg, 1),
                    AvgLbs:      Math.Round(avgKg * KgToLbs, 1),
                    RecordCount: cnt
                ));
            }
        }

        return new WeightStats(
            AllTimeMinKg:   Math.Round(allTimeMinKg, 1),
            AllTimeMinLbs:  Math.Round(allTimeMinKg * KgToLbs, 1),
            AllTimeMinDate: allTimeMinDate,
            AllTimeMaxKg:   Math.Round(allTimeMaxKg, 1),
            AllTimeMaxLbs:  Math.Round(allTimeMaxKg * KgToLbs, 1),
            AllTimeMaxDate: allTimeMaxDate,
            YearMinKg:      Math.Round(yearMinKg, 1),
            YearMinLbs:     Math.Round(yearMinKg * KgToLbs, 1),
            YearMinDate:    yearMinDate,
            YearAvgKg:      Math.Round(yearAvgKg, 1),
            YearAvgLbs:     Math.Round(yearAvgKg * KgToLbs, 1),
            Year:           year,
            MonthlyStats:   monthly
        );
    }

    // ── Latest pedometer entry (most recent day, max steps) ──────────────────
    public async Task<(string? Date, int Steps)> GetLatestPedometerAsync()
    {
        const string sql = """
            SELECT day_time, MAX(step_count)
            FROM pedometer_day_summary
            WHERE day_time IS NOT NULL
            GROUP BY day_time
            ORDER BY day_time DESC
            LIMIT 1
            """;
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        await using var rdr = await cmd.ExecuteReaderAsync();
        if (!await rdr.ReadAsync()) return (null, 0);
        return (rdr.IsDBNull(0) ? null : rdr.GetString(0), rdr.IsDBNull(1) ? 0 : rdr.GetInt32(1));
    }

    // ── Latest weight entry (most recent create_time) ─────────────────────────
    public async Task<(string? Date, double Weight)> GetLatestWeightAsync()
    {
        const string sql = """
            SELECT create_time, weight
            FROM weight
            WHERE create_time IS NOT NULL
            ORDER BY create_time DESC
            LIMIT 1
            """;
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        await using var rdr = await cmd.ExecuteReaderAsync();
        if (!await rdr.ReadAsync()) return (null, 0);
        return (rdr.IsDBNull(0) ? null : rdr.GetString(0), rdr.IsDBNull(1) ? 0 : rdr.GetDouble(1));
    }

    // ── User Profile — ensure table exists, get, upsert ──────────────────────
    public async Task EnsureProfileTableAsync()
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        // Create table if it doesn't exist
        const string createSql = """
            CREATE TABLE IF NOT EXISTS user_profile (
                id          INTEGER PRIMARY KEY CHECK (id = 1),
                first_name  TEXT    NOT NULL DEFAULT '',
                last_name   TEXT    NOT NULL DEFAULT '',
                height_cm   REAL    NOT NULL DEFAULT 0,
                height_uom  TEXT    NOT NULL DEFAULT 'cm',
                weight_uom  TEXT    NOT NULL DEFAULT 'kg',
                updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            )
            """;
        await using (var cmd = new SqliteCommand(createSql, connection))
            await cmd.ExecuteNonQueryAsync();

        // Add new columns to existing tables (safe to run repeatedly)
        foreach (var col in new[] {
            "ALTER TABLE user_profile ADD COLUMN height_uom TEXT NOT NULL DEFAULT 'cm'",
            "ALTER TABLE user_profile ADD COLUMN weight_uom TEXT NOT NULL DEFAULT 'kg'",
            "ALTER TABLE user_profile ADD COLUMN language TEXT NOT NULL DEFAULT 'en'",
        })
        {
            try
            {
                await using var cmd = new SqliteCommand(col, connection);
                await cmd.ExecuteNonQueryAsync();
            }
            catch (SqliteException) { /* column already exists — ignore */ }
        }
    }

    public async Task<UserProfile?> GetProfileAsync()
    {
        const string sql = """
            SELECT id, first_name, last_name, height_cm, height_uom, weight_uom, language, updated_at
            FROM user_profile WHERE id = 1
            """;
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        await using var rdr = await cmd.ExecuteReaderAsync();
        if (!await rdr.ReadAsync()) return null;
        return new UserProfile
        {
            Id        = rdr.GetInt32(0),
            FirstName = rdr.GetString(1),
            LastName  = rdr.GetString(2),
            HeightCm  = rdr.GetDouble(3),
            HeightUom = rdr.IsDBNull(4) ? "cm"  : rdr.GetString(4),
            WeightUom = rdr.IsDBNull(5) ? "kg"  : rdr.GetString(5),
            Language  = rdr.IsDBNull(6) ? "en"  : rdr.GetString(6),
            UpdatedAt = rdr.GetString(7),
        };
    }

    public async Task<UserProfile> UpsertProfileAsync(UpsertProfileRequest req)
    {
        const string sql = """
            INSERT INTO user_profile (id, first_name, last_name, height_cm, height_uom, weight_uom, language, updated_at)
            VALUES (1, @firstName, @lastName, @heightCm, @heightUom, @weightUom, @language, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
                first_name = excluded.first_name,
                last_name  = excluded.last_name,
                height_cm  = excluded.height_cm,
                height_uom = excluded.height_uom,
                weight_uom = excluded.weight_uom,
                language   = excluded.language,
                updated_at = excluded.updated_at
            """;
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        cmd.Parameters.AddWithValue("@firstName", req.FirstName);
        cmd.Parameters.AddWithValue("@lastName",  req.LastName);
        cmd.Parameters.AddWithValue("@heightCm",  req.HeightCm);
        cmd.Parameters.AddWithValue("@heightUom", req.HeightUom is "cm" or "ft"  ? req.HeightUom : "cm");
        cmd.Parameters.AddWithValue("@weightUom", req.WeightUom is "kg" or "lbs" ? req.WeightUom : "kg");
        cmd.Parameters.AddWithValue("@language",  string.IsNullOrWhiteSpace(req.Language) ? "en" : req.Language);
        await cmd.ExecuteNonQueryAsync();
        return (await GetProfileAsync())!;
    }

    // ── Weight — paginated + filtered + sorted ────────────────────────────────
    private static readonly Dictionary<string, string> WeightSortColumns = new(StringComparer.OrdinalIgnoreCase)
    {
        ["createTime"]  = "create_time",
        ["weightValue"] = "weight",
    };

    public async Task<PagedResult<Weight>> GetWeightPageAsync(
        int page,
        int pageSize,
        string? searchCreateTime,
        string? searchWeight,
        string sortBy,
        string sortDir)
    {
        if (!WeightSortColumns.TryGetValue(sortBy, out var sortCol))
            sortCol = "create_time";
        var direction = sortDir.Equals("asc", StringComparison.OrdinalIgnoreCase) ? "ASC" : "DESC";

        var whereParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(searchCreateTime)) whereParts.Add("COALESCE(create_time, '') LIKE @createTime");
        if (!string.IsNullOrWhiteSpace(searchWeight))     whereParts.Add("CAST(weight AS TEXT) LIKE @weight");

        var where = whereParts.Count > 0 ? "WHERE " + string.Join(" AND ", whereParts) : "";

        var countSql = $"SELECT COUNT(*) FROM weight {where}";
        var dataSql  = $"""
            SELECT datauuid, weight, create_time
            FROM weight
            {where}
            ORDER BY {sortCol} {direction}
            LIMIT @limit OFFSET @offset
            """;

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        void AddFilterParams(SqliteCommand cmd)
        {
            if (!string.IsNullOrWhiteSpace(searchCreateTime))
                cmd.Parameters.AddWithValue("@createTime", $"%{searchCreateTime}%");
            if (!string.IsNullOrWhiteSpace(searchWeight))
                cmd.Parameters.AddWithValue("@weight",     $"%{searchWeight}%");
        }

        int totalCount;
        await using (var countCmd = new SqliteCommand(countSql, connection))
        {
            AddFilterParams(countCmd);
            totalCount = Convert.ToInt32(await countCmd.ExecuteScalarAsync());
        }

        var offset  = (page - 1) * pageSize;
        var results = new List<Weight>();

        await using (var dataCmd = new SqliteCommand(dataSql, connection))
        {
            AddFilterParams(dataCmd);
            dataCmd.Parameters.AddWithValue("@limit",  pageSize);
            dataCmd.Parameters.AddWithValue("@offset", offset);

            await using var reader = await dataCmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                results.Add(new Weight
                {
                    DataUuid    = reader.GetString(0),
                    WeightValue = reader.IsDBNull(1) ? 0.0  : reader.GetDouble(1),
                    CreateTime  = reader.IsDBNull(2) ? null : reader.GetString(2),
                });
            }
        }

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PagedResult<Weight>(results, totalCount, page, pageSize, totalPages);
    }

    // ── Add a weight entry ────────────────────────────────────────────────────
    public async Task<Weight?> GetWeightByDateAsync(string date)
    {
        // Match any reading whose create_time starts with the given date (YYYY-MM-DD)
        const string sql = """
            SELECT datauuid, weight, create_time
            FROM weight
            WHERE create_time LIKE @prefix
            ORDER BY create_time DESC
            LIMIT 1
            """;
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        cmd.Parameters.AddWithValue("@prefix", $"{date}%");
        await using var rdr = await cmd.ExecuteReaderAsync();
        if (!await rdr.ReadAsync()) return null;
        return new Weight
        {
            DataUuid    = rdr.GetString(0),
            WeightValue = rdr.IsDBNull(1) ? 0 : rdr.GetDouble(1),
            CreateTime  = rdr.IsDBNull(2) ? null : rdr.GetString(2),
        };
    }

    public async Task<Weight> AddWeightAsync(AddWeightRequest req)
    {
        var uuid = Guid.NewGuid().ToString();
        const string sql = """
            INSERT INTO weight (datauuid, weight, create_time, time_offset, deviceuuid)
            VALUES (@uuid, @weight, @createTime, '+00:00', 'manual')
            """;
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using var cmd = new SqliteCommand(sql, connection);
        cmd.Parameters.AddWithValue("@uuid",       uuid);
        cmd.Parameters.AddWithValue("@weight",     req.WeightKg);
        cmd.Parameters.AddWithValue("@createTime", req.CreateTime);
        await cmd.ExecuteNonQueryAsync();
        return new Weight
        {
            DataUuid    = uuid,
            WeightValue = req.WeightKg,
            CreateTime  = req.CreateTime,
            TimeOffset  = "+00:00",
            DeviceUuid  = "manual",
        };
    }

    public async Task<Weight> ReplaceWeightAsync(string existingUuid, AddWeightRequest req)
    {
        // Delete the old reading and insert a fresh one
        const string deleteSql = "DELETE FROM weight WHERE datauuid = @uuid";
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        await using (var cmd = new SqliteCommand(deleteSql, connection))
        {
            cmd.Parameters.AddWithValue("@uuid", existingUuid);
            await cmd.ExecuteNonQueryAsync();
        }
        return await AddWeightAsync(req);
    }

    // ── Weight (old unpaginated — kept for any future stats use) ─────────────
    public async Task<IReadOnlyList<Weight>> GetWeightsAsync()
    {
        const string sql = """
            SELECT datauuid, weight, create_time, time_offset, deviceuuid
            FROM weight
            ORDER BY create_time DESC
            """;

        var results = new List<Weight>();

        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqliteCommand(sql, connection);
        await using var reader  = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            results.Add(new Weight
            {
                DataUuid    = reader.GetString(0),
                WeightValue = reader.IsDBNull(1) ? 0.0  : reader.GetDouble(1),
                CreateTime  = reader.IsDBNull(2) ? null : reader.GetString(2),
                TimeOffset  = reader.IsDBNull(3) ? null : reader.GetString(3),
                DeviceUuid  = reader.IsDBNull(4) ? null : reader.GetString(4),
            });
        }

        return results;
    }
}
