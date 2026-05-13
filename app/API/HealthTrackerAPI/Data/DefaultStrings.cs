using HealthTrackerAPI.Models;

namespace HealthTrackerAPI.Data;

public static class DefaultStrings
{
    public static readonly IReadOnlyList<AppString> All = new List<AppString>
    {
        // Header
        S("Header", "app_name_suffix", "Health Tracker"),
        S("Header", "tagline", "Your personal wellness dashboard"),

        // Dashboard
        S("Dashboard", "greeting_prefix", "Good morning,"),
        S("Dashboard", "greeting_suffix", "👋"),
        S("Dashboard", "snapshot_text", "Here's a snapshot of your health today. Keep up the great work!"),
        S("Dashboard", "lifetime_heading", "Lifetime Stats"),
        S("Dashboard", "alltime_best_label", "All-Time Best Day"),
        S("Dashboard", "year_best_label", "Best Day"),
        S("Dashboard", "year_avg_label", "Daily Average"),
        S("Dashboard", "weight_stats_heading", "⚖️ Weight Stats"),
        S("Dashboard", "alltime_lowest_label", "All-Time Lowest"),
        S("Dashboard", "year_lowest_label", "Lowest"),
        S("Dashboard", "year_avg_weight_label", "Average"),
        S("Dashboard", "recent_data_heading", "Most Recent Data"),
        S("Dashboard", "quick_actions_heading", "Quick Actions"),
        S("Dashboard", "quick_action_steps", "Log a Day's Steps"),
        S("Dashboard", "quick_action_weight", "Record Weight"),

        // Activity Dashboard
        S("ActivityDashboard", "page_title", "🏃 Activity — Step Dashboard"),
        S("ActivityDashboard", "monthly_heading", "Monthly Step Breakdown — Rolling 12 Months"),

        // Step Reporting
        S("StepReporting", "page_title", "🏃 Step Reporting"),
        S("StepReporting", "totals_heading", "Total Steps by Year"),
        S("StepReporting", "alltime_heading", "All-Time Steps by Month"),
        S("StepReporting", "yoy_heading", "Year-over-Year by Month"),
        S("StepReporting", "annual_heading", "Year-over-Year Annual Summary"),

        // Record Steps
        S("StepEntry", "page_title", "Record Steps"),
        S("StepEntry", "subtitle", "Log a step count for a specific date"),
        S("StepEntry", "date_label", "Date"),
        S("StepEntry", "steps_label", "Step Count"),
        S("StepEntry", "save_button", "Save Steps"),
        S("StepEntry", "replace_title", "⚠️ Reading Already Exists"),
        S("StepEntry", "replace_question", "Do you want to replace the existing reading?"),

        // Weight Dashboard
        S("WeightDashboard", "page_title", "⚖️ Weight Dashboard"),
        S("WeightDashboard", "stats_heading", "Weight Stats"),
        S("WeightDashboard", "monthly_heading", "Monthly Breakdown — Past 12 Months"),
        S("WeightDashboard", "alltime_highest_label", "All-Time Highest"),

        // Weight Reporting
        S("WeightReporting", "page_title", "⚖️ Weight Reporting"),
        S("WeightReporting", "alltime_heading", "All-Time Weight by Month"),
        S("WeightReporting", "yoy_heading", "Year-over-Year by Month"),
        S("WeightReporting", "annual_heading", "Year-over-Year Annual Summary"),

        // Record Weight
        S("WeightEntry", "page_title", "Record Weight"),
        S("WeightEntry", "subtitle", "Log a weight reading for a specific date"),
        S("WeightEntry", "date_label", "Date"),
        S("WeightEntry", "weight_label", "Weight"),
        S("WeightEntry", "save_button", "Save Weight"),
        S("WeightEntry", "replace_title", "⚠️ Reading Already Exists"),
        S("WeightEntry", "replace_question", "Do you want to replace the existing reading?"),

        // Raw Data pages
        S("PedometerRawData", "page_title", "🏃 Activity — Raw Data"),
        S("WeightRawData", "page_title", "⚖️ Weight — Raw Data"),

        // Profile
        S("ProfileSettings", "page_title", "User Profile"),
        S("ProfileSettings", "first_name_label", "First Name"),
        S("ProfileSettings", "last_name_label", "Last Name"),
        S("ProfileSettings", "height_label", "Height (cm)"),
        S("ProfileSettings", "uom_heading", "Unit Preferences"),
        S("ProfileSettings", "height_uom_label", "Height Primary UOM"),
        S("ProfileSettings", "weight_uom_label", "Weight Primary UOM"),
        S("ProfileSettings", "save_button", "Save Profile"),
        S("ProfileSettings", "update_button", "Update Profile"),
        S("ProfileSettings", "success_message", "Profile saved successfully!"),

        // Sidebar
        S("Sidebar", "nav_title", "Navigation"),
        S("Sidebar", "node_dashboard", "Dashboard"),
        S("Sidebar", "node_steps", "Steps"),
        S("Sidebar", "node_activity_dashboard", "Activity Dashboard"),
        S("Sidebar", "node_step_reporting", "Step Reporting"),
        S("Sidebar", "node_record_steps", "Record Steps"),
        S("Sidebar", "node_daily_steps", "Daily Steps"),
        S("Sidebar", "node_pedometer_summary", "Pedometer Summary"),
        S("Sidebar", "node_raw_data", "Raw Data"),
        S("Sidebar", "node_weight", "Weight"),
        S("Sidebar", "node_weight_dashboard", "Weight Dashboard"),
        S("Sidebar", "node_record_weight", "Record Weight"),
        S("Sidebar", "node_weight_reporting", "Weight Reporting"),
        S("Sidebar", "node_weight_raw_data", "Weight Raw Data"),
        S("Sidebar", "node_documentation", "Documentation"),
        S("Sidebar", "node_api_docs", "C# API Documentation"),
        S("Sidebar", "node_settings", "Settings"),
        S("Sidebar", "node_user_profile", "User Profile"),
        S("Sidebar", "node_developer", "Developer"),
        S("Sidebar", "node_prompts_log", "Prompts Log"),
        S("Sidebar", "node_code_stats", "Code Stats"),
        S("Sidebar", "node_code_map", "Code Map"),
        S("Sidebar", "node_api_documentation", "API Documentation"),
        S("Sidebar", "node_strings", "Strings"),
        S("Sidebar", "node_string_editor", "String Editor"),
        S("Sidebar", "node_string_change_log", "String Change Log"),

        // Developer
        S("DevPromptsLog", "page_title", "💬 Prompts Log"),
        S("DevCodeStats", "page_title", "📊 Code Stats"),
        S("DevCodeMap", "page_title", "🗺️ Code Map"),
        S("DevCodeMap", "subtitle", "End-to-end traceability: UI → API → Database"),
        S("DevStringEditor", "page_title", "🔤 String Editor"),
        S("DevStringEditor", "subtitle", "View and edit all application strings"),
        S("DevStringChangeLog", "page_title", "📝 String Change Log"),

        // Common
        S("Common", "loading", "Loading…"),
        S("Common", "error_api", "Could not load data — make sure the API is running."),
        S("Common", "no_data", "No data available."),
        S("Common", "cancel", "Cancel"),
        S("Common", "yes_replace", "Yes, Replace"),
        S("Common", "rows_per_page", "Rows per page"),
        S("Common", "clear_filters", "✕ Clear filters"),
        S("Common", "auto_reset", "↺ Auto"),
        S("Common", "steps", "steps"),
        S("Common", "steps_per_day", "steps/day"),
        S("Common", "steps_on", "steps on"),
        S("Common", "days", "days"),
        S("Common", "readings", "readings"),
        S("Common", "page_of", "Page {0} of {1}"),
        S("Common", "total_rows", "total rows"),

        // Months
        S("Common", "month_jan", "January"),
        S("Common", "month_feb", "February"),
        S("Common", "month_mar", "March"),
        S("Common", "month_apr", "April"),
        S("Common", "month_may", "May"),
        S("Common", "month_jun", "June"),
        S("Common", "month_jul", "July"),
        S("Common", "month_aug", "August"),
        S("Common", "month_sep", "September"),
        S("Common", "month_oct", "October"),
        S("Common", "month_nov", "November"),
        S("Common", "month_dec", "December"),

        // UOM options
        S("ProfileSettings", "uom_cm_label", "Centimetres (cm)"),
        S("ProfileSettings", "uom_cm_desc", "e.g. 175.5 cm"),
        S("ProfileSettings", "uom_ft_label", "Feet & Inches (ft)"),
        S("ProfileSettings", "uom_ft_desc", "e.g. 5′ 9″"),
        S("ProfileSettings", "uom_kg_label", "Kilograms (kg)"),
        S("ProfileSettings", "uom_kg_desc", "e.g. 72.4 kg"),
        S("ProfileSettings", "uom_lbs_label", "Pounds (lbs)"),
        S("ProfileSettings", "uom_lbs_desc", "e.g. 159.6 lbs"),
        S("ProfileSettings", "language_label", "Language"),
        S("ProfileSettings", "no_profile_yet", "No profile saved yet"),
        S("ProfileSettings", "last_updated", "Last updated:"),

        // Dashboard tiles
        S("Dashboard", "steps_label_prefix", "Steps"),
        S("Dashboard", "weight_label_prefix", "Weight"),
        S("Dashboard", "latest_steps", "Latest Steps"),
        S("Dashboard", "latest_weight", "Latest Weight"),

        // Chart labels
        S("Charts", "yaxis_steps", "Steps / day"),
        S("Charts", "yaxis_weight", "Weight"),
        S("Charts", "yaxis_range", "Y-axis range"),
        S("Charts", "month_selector", "Month"),
        S("Charts", "scroll_hint", "Scroll to see all months."),
        S("Charts", "latest_label", "Latest:"),
        S("Charts", "min", "Min"),
        S("Charts", "max", "Max"),
        S("Charts", "avg", "Avg"),
        S("Charts", "range", "Range"),

        // Raw Data table headers
        S("PedometerRawData", "col_date", "Date / Time"),
        S("PedometerRawData", "col_steps", "Steps"),
        S("PedometerRawData", "col_calories", "Calories"),
        S("PedometerRawData", "search_date", "Search date…"),
        S("PedometerRawData", "search_placeholder", "Search…"),
        S("PedometerRawData", "no_records", "No records match your filters."),

        S("WeightRawData", "col_date", "Date / Time"),
        S("WeightRawData", "col_weight_kg", "Weight (kg)"),
        S("WeightRawData", "col_weight_lbs", "Weight (lbs)"),

        // Step Entry
        S("StepEntry", "no_existing", "No existing reading for this date"),
        S("StepEntry", "existing_warning", "A reading already exists for this date:"),
        S("StepEntry", "checking", "Checking…"),
        S("StepEntry", "save_replace_hint", "Save (will prompt to replace)"),

        // Dashboard date prefix
        S("Dashboard", "steps_label_prefix", "Steps"),
        S("Dashboard", "weight_label_prefix", "Weight"),
    };

    private static AppString S(string page, string uid, string value) => new()
    {
        Application = "HealthTracker",
        Page        = page,
        UniqueId    = uid,
        Language    = "en",
        Value       = value,
    };

    private static AppString Ja(string page, string uid, string value) => new()
    {
        Application = "HealthTracker",
        Page        = page,
        UniqueId    = uid,
        Language    = "ja",
        Value       = value,
    };

    public static readonly IReadOnlyList<AppString> Japanese = new List<AppString>
    {
        // Header
        Ja("Header", "app_name_suffix", "ヘルストラッカー"),
        Ja("Header", "tagline", "あなたの健康管理ダッシュボード"),

        // Dashboard
        Ja("Dashboard", "greeting_prefix", "おはようございます、"),
        Ja("Dashboard", "greeting_suffix", "👋"),
        Ja("Dashboard", "snapshot_text", "今日の健康状態の概要です。この調子で頑張りましょう！"),
        Ja("Dashboard", "lifetime_heading", "生涯統計"),
        Ja("Dashboard", "alltime_best_label", "歴代最高記録"),
        Ja("Dashboard", "year_best_label", "今年の最高記録"),
        Ja("Dashboard", "year_avg_label", "1日平均"),
        Ja("Dashboard", "weight_stats_heading", "⚖️ 体重統計"),
        Ja("Dashboard", "alltime_lowest_label", "歴代最低体重"),
        Ja("Dashboard", "year_lowest_label", "今年の最低"),
        Ja("Dashboard", "year_avg_weight_label", "平均"),
        Ja("Dashboard", "recent_data_heading", "最新データ"),
        Ja("Dashboard", "quick_actions_heading", "クイックアクション"),
        Ja("Dashboard", "quick_action_steps", "歩数を記録"),
        Ja("Dashboard", "quick_action_weight", "体重を記録"),

        // Activity Dashboard
        Ja("ActivityDashboard", "page_title", "🏃 アクティビティ — 歩数ダッシュボード"),
        Ja("ActivityDashboard", "monthly_heading", "月別歩数内訳 — 直近12ヶ月"),

        // Step Reporting
        Ja("StepReporting", "page_title", "🏃 歩数レポート"),
        Ja("StepReporting", "totals_heading", "年間合計歩数"),
        Ja("StepReporting", "alltime_heading", "全期間 月別歩数"),
        Ja("StepReporting", "yoy_heading", "前年比 月別比較"),
        Ja("StepReporting", "annual_heading", "前年比 年間サマリー"),

        // Record Steps
        Ja("StepEntry", "page_title", "歩数を記録"),
        Ja("StepEntry", "subtitle", "特定の日付の歩数を記録します"),
        Ja("StepEntry", "date_label", "日付"),
        Ja("StepEntry", "steps_label", "歩数"),
        Ja("StepEntry", "save_button", "歩数を保存"),
        Ja("StepEntry", "replace_title", "⚠️ 既存の記録があります"),
        Ja("StepEntry", "replace_question", "既存の記録を置き換えますか？"),

        // Weight Dashboard
        Ja("WeightDashboard", "page_title", "⚖️ 体重ダッシュボード"),
        Ja("WeightDashboard", "stats_heading", "体重統計"),
        Ja("WeightDashboard", "monthly_heading", "月別内訳 — 直近12ヶ月"),
        Ja("WeightDashboard", "alltime_highest_label", "歴代最高体重"),

        // Weight Reporting
        Ja("WeightReporting", "page_title", "⚖️ 体重レポート"),
        Ja("WeightReporting", "alltime_heading", "全期間 月別体重"),
        Ja("WeightReporting", "yoy_heading", "前年比 月別比較"),
        Ja("WeightReporting", "annual_heading", "前年比 年間サマリー"),

        // Record Weight
        Ja("WeightEntry", "page_title", "体重を記録"),
        Ja("WeightEntry", "subtitle", "特定の日付の体重を記録します"),
        Ja("WeightEntry", "date_label", "日付"),
        Ja("WeightEntry", "weight_label", "体重"),
        Ja("WeightEntry", "save_button", "体重を保存"),
        Ja("WeightEntry", "replace_title", "⚠️ 既存の記録があります"),
        Ja("WeightEntry", "replace_question", "既存の記録を置き換えますか？"),

        // Raw Data pages
        Ja("PedometerRawData", "page_title", "🏃 アクティビティ — 生データ"),
        Ja("WeightRawData", "page_title", "⚖️ 体重 — 生データ"),

        // Profile
        Ja("ProfileSettings", "page_title", "ユーザープロフィール"),
        Ja("ProfileSettings", "first_name_label", "名"),
        Ja("ProfileSettings", "last_name_label", "姓"),
        Ja("ProfileSettings", "height_label", "身長 (cm)"),
        Ja("ProfileSettings", "uom_heading", "単位設定"),
        Ja("ProfileSettings", "height_uom_label", "身長の優先単位"),
        Ja("ProfileSettings", "weight_uom_label", "体重の優先単位"),
        Ja("ProfileSettings", "save_button", "プロフィールを保存"),
        Ja("ProfileSettings", "update_button", "プロフィールを更新"),
        Ja("ProfileSettings", "success_message", "プロフィールが保存されました！"),

        // Sidebar
        Ja("Sidebar", "nav_title", "ナビゲーション"),
        Ja("Sidebar", "node_dashboard", "ダッシュボード"),
        Ja("Sidebar", "node_steps", "歩数"),
        Ja("Sidebar", "node_activity_dashboard", "アクティビティダッシュボード"),
        Ja("Sidebar", "node_step_reporting", "歩数レポート"),
        Ja("Sidebar", "node_record_steps", "歩数を記録"),
        Ja("Sidebar", "node_daily_steps", "日別歩数"),
        Ja("Sidebar", "node_pedometer_summary", "歩数計サマリー"),
        Ja("Sidebar", "node_raw_data", "生データ"),
        Ja("Sidebar", "node_weight", "体重"),
        Ja("Sidebar", "node_weight_dashboard", "体重ダッシュボード"),
        Ja("Sidebar", "node_record_weight", "体重を記録"),
        Ja("Sidebar", "node_weight_reporting", "体重レポート"),
        Ja("Sidebar", "node_weight_raw_data", "体重生データ"),
        Ja("Sidebar", "node_documentation", "ドキュメント"),
        Ja("Sidebar", "node_api_docs", "C# APIドキュメント"),
        Ja("Sidebar", "node_settings", "設定"),
        Ja("Sidebar", "node_user_profile", "ユーザープロフィール"),
        Ja("Sidebar", "node_developer", "開発者"),
        Ja("Sidebar", "node_prompts_log", "プロンプトログ"),
        Ja("Sidebar", "node_code_stats", "コード統計"),
        Ja("Sidebar", "node_code_map", "コードマップ"),
        Ja("Sidebar", "node_api_documentation", "APIドキュメント"),
        Ja("Sidebar", "node_strings", "文字列"),
        Ja("Sidebar", "node_string_editor", "文字列エディタ"),
        Ja("Sidebar", "node_string_change_log", "文字列変更ログ"),

        // Developer
        Ja("DevPromptsLog", "page_title", "💬 プロンプトログ"),
        Ja("DevCodeStats", "page_title", "📊 コード統計"),
        Ja("DevCodeMap", "page_title", "🗺️ コードマップ"),
        Ja("DevCodeMap", "subtitle", "エンドツーエンドのトレーサビリティ: UI → API → データベース"),
        Ja("DevStringEditor", "page_title", "🔤 文字列エディタ"),
        Ja("DevStringEditor", "subtitle", "すべてのアプリケーション文字列を表示・編集"),
        Ja("DevStringChangeLog", "page_title", "📝 文字列変更ログ"),

        // Common
        Ja("Common", "loading", "読み込み中…"),
        Ja("Common", "error_api", "データを読み込めませんでした。APIが起動していることを確認してください。"),
        Ja("Common", "no_data", "データがありません。"),
        Ja("Common", "cancel", "キャンセル"),
        Ja("Common", "yes_replace", "はい、置き換えます"),
        Ja("Common", "rows_per_page", "表示件数"),
        Ja("Common", "clear_filters", "✕ フィルターをクリア"),
        Ja("Common", "auto_reset", "↺ 自動"),
        Ja("Common", "steps", "歩"),
        Ja("Common", "steps_per_day", "歩/日"),
        Ja("Common", "steps_on", "歩 —"),
        Ja("Common", "days", "日間"),
        Ja("Common", "readings", "件の記録"),
        Ja("Common", "page_of", "{1}ページ中{0}ページ"),
        Ja("Common", "total_rows", "件の合計"),

        // Months
        Ja("Common", "month_jan", "1月"),
        Ja("Common", "month_feb", "2月"),
        Ja("Common", "month_mar", "3月"),
        Ja("Common", "month_apr", "4月"),
        Ja("Common", "month_may", "5月"),
        Ja("Common", "month_jun", "6月"),
        Ja("Common", "month_jul", "7月"),
        Ja("Common", "month_aug", "8月"),
        Ja("Common", "month_sep", "9月"),
        Ja("Common", "month_oct", "10月"),
        Ja("Common", "month_nov", "11月"),
        Ja("Common", "month_dec", "12月"),

        // UOM options
        Ja("ProfileSettings", "uom_cm_label", "センチメートル (cm)"),
        Ja("ProfileSettings", "uom_cm_desc", "例: 175.5 cm"),
        Ja("ProfileSettings", "uom_ft_label", "フィート・インチ (ft)"),
        Ja("ProfileSettings", "uom_ft_desc", "例: 5′ 9″"),
        Ja("ProfileSettings", "uom_kg_label", "キログラム (kg)"),
        Ja("ProfileSettings", "uom_kg_desc", "例: 72.4 kg"),
        Ja("ProfileSettings", "uom_lbs_label", "ポンド (lbs)"),
        Ja("ProfileSettings", "uom_lbs_desc", "例: 159.6 lbs"),
        Ja("ProfileSettings", "language_label", "言語"),
        Ja("ProfileSettings", "no_profile_yet", "プロフィールが未保存です"),
        Ja("ProfileSettings", "last_updated", "最終更新:"),

        // Dashboard tiles
        Ja("Dashboard", "steps_label_prefix", "歩数"),
        Ja("Dashboard", "weight_label_prefix", "体重"),
        Ja("Dashboard", "latest_steps", "最新の歩数"),
        Ja("Dashboard", "latest_weight", "最新の体重"),

        // Chart labels
        Ja("Charts", "yaxis_steps", "歩数 / 日"),
        Ja("Charts", "yaxis_weight", "体重"),
        Ja("Charts", "yaxis_range", "Y軸範囲"),
        Ja("Charts", "month_selector", "月"),
        Ja("Charts", "scroll_hint", "スクロールして全ての月を表示"),
        Ja("Charts", "latest_label", "最新:"),
        Ja("Charts", "min", "最小"),
        Ja("Charts", "max", "最大"),
        Ja("Charts", "avg", "平均"),
        Ja("Charts", "range", "範囲"),

        // Raw Data table headers
        Ja("PedometerRawData", "col_date", "日付 / 時刻"),
        Ja("PedometerRawData", "col_steps", "歩数"),
        Ja("PedometerRawData", "col_calories", "カロリー"),
        Ja("PedometerRawData", "search_date", "日付を検索…"),
        Ja("PedometerRawData", "search_placeholder", "検索…"),
        Ja("PedometerRawData", "no_records", "フィルターに一致する記録がありません。"),

        Ja("WeightRawData", "col_date", "日付 / 時刻"),
        Ja("WeightRawData", "col_weight_kg", "体重 (kg)"),
        Ja("WeightRawData", "col_weight_lbs", "体重 (lbs)"),

        // Step Entry
        Ja("StepEntry", "no_existing", "この日付に既存の記録はありません"),
        Ja("StepEntry", "existing_warning", "この日付に既存の記録があります:"),
        Ja("StepEntry", "checking", "確認中…"),
        Ja("StepEntry", "save_replace_hint", "保存（置き換え確認あり）"),

        // Dashboard date prefix
        Ja("Dashboard", "steps_label_prefix", "歩数"),
        Ja("Dashboard", "weight_label_prefix", "体重"),
    };
}
