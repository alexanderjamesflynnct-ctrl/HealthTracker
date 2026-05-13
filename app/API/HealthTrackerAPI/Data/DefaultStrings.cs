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
    };

    private static AppString S(string page, string uid, string value) => new()
    {
        Application = "HealthTracker",
        Page        = page,
        UniqueId    = uid,
        Language    = "en",
        Value       = value,
    };
}
