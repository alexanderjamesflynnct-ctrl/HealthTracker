import styles from './DevPromptsLog.module.css'
import { useAppStrings } from '../hooks/useAppStrings'

interface PromptEntry {
  id: number
  prompt: string
  response: string
  category: string
}

const PROMPTS: PromptEntry[] = [
  { id: 1, prompt: 'Create a React App with header and expandable tree menu', response: 'Scaffolded Vite + React + TypeScript app with Header, Sidebar, TreeMenu, and MainContent components. Green health-themed design.', category: 'UI' },
  { id: 2, prompt: 'Remove sleep and nutrition nodes', response: 'Removed Sleep and Nutrition tree nodes and their icon mappings.', category: 'UI' },
  { id: 3, prompt: 'Create a C# API with methods to get all data from database tables', response: 'Built ASP.NET Core .NET 10 minimal API with GET /api/pedometer and GET /api/weight endpoints using Microsoft.Data.Sqlite.', category: 'API' },
  { id: 4, prompt: 'Add Documentation node with Swagger page in iframe', response: 'Added Documentation → C# API Documentation node. Clicking it renders Swagger UI in an iframe in the main content area.', category: 'UI' },
  { id: 5, prompt: 'Add Raw Data page with paginated, searchable, sortable table', response: 'Created PedometerRawData component with server-side pagination, column search (debounced), and sortable headers.', category: 'UI + API' },
  { id: 6, prompt: 'Move pagination to API level', response: 'Rewrote GET /api/pedometer to accept page/pageSize/sort/filter params. SQL uses LIMIT/OFFSET with parameterised LIKE filters.', category: 'API' },
  { id: 7, prompt: 'Add Lifetime Stats tiles to dashboard', response: 'Created GET /api/pedometer/stats endpoint with SQL aggregation. Dashboard shows all-time best, year best, daily average tiles.', category: 'API + UI' },
  { id: 8, prompt: 'Fix duplicate device data inflating averages', response: 'Changed to MAX(step_count) per day_time to deduplicate multi-device readings before aggregation.', category: 'Data' },
  { id: 9, prompt: 'Create Weight Raw Data page', response: 'Built paginated weight table with same pattern as pedometer. Added server-side pagination to GET /api/weight.', category: 'UI + API' },
  { id: 10, prompt: 'Add user profile with Settings page', response: 'Created user_profile table (auto-created on startup), GET/PUT /api/profile endpoints, and ProfileSettings form with name + height.', category: 'Full Stack' },
  { id: 11, prompt: 'Add Height/Weight UOM preferences', response: 'Added height_uom and weight_uom columns to profile. Radio card selectors in UI. All weight displays respect the preference.', category: 'Full Stack' },
  { id: 12, prompt: 'Create Weight Dashboard with monthly breakdown', response: 'Built WeightDashboard component with summary tiles and 12-month grid showing min/max/avg per month.', category: 'UI + API' },
  { id: 13, prompt: 'Create Activity Dashboard with monthly step breakdown', response: 'Built ActivityDashboard with monthly cards showing min/max/avg steps and a progress bar.', category: 'UI + API' },
  { id: 14, prompt: 'Add Record Weight page with date validation', response: 'Created WeightEntry form with date picker, existing-reading check, confirmation dialog for replacements.', category: 'Full Stack' },
  { id: 15, prompt: 'Add Weight Reporting with whisker charts', response: 'Built 3 charts: all-time monthly, year-over-year by month (with month selector), and annual summary. Fixed Y-axis, scrollable, adjustable range.', category: 'UI + API' },
  { id: 16, prompt: 'Add dashed purple reference line for current weight', response: 'Fetches latest weight from /api/dashboard/latest and renders a ReferenceLine on all weight charts.', category: 'UI' },
  { id: 17, prompt: 'Create Step Reporting mirroring Weight Reporting', response: 'Built 4 charts: total steps by year (bar), all-time monthly, YoY by month, and annual summary whisker charts.', category: 'UI + API' },
  { id: 18, prompt: 'Add Record Steps page', response: 'Created StepEntry form with same pattern as WeightEntry — date check, confirmation dialog, POST/PUT endpoints.', category: 'Full Stack' },
  { id: 19, prompt: 'Profile icon in header opens User Profile', response: 'Made the user badge a button that navigates to User Profile page on click.', category: 'UI' },
  { id: 20, prompt: 'Create Developer tab with Prompts Log, Code Stats, Code Map', response: 'Built three developer pages: conversation log, codebase statistics with charts, and end-to-end code traceability map.', category: 'UI' },
]

const categoryColors: Record<string, string> = {
  'UI': '#3178c6',
  'API': '#68217a',
  'UI + API': '#2e7d32',
  'Full Stack': '#ef6c00',
  'Data': '#e38c00',
}

const DevPromptsLog = () => {
  const { s } = useAppStrings()

  return (
  <div className={styles.page}>
    <h2 className={styles.pageTitle}>{s('DevPromptsLog', 'page_title', '💬 Prompts Log')}</h2>
    <p className={styles.subtitle}>{PROMPTS.length} prompts in this session — summarized view of requests and outcomes</p>

    <div className={styles.logList}>
      {PROMPTS.map(entry => (
        <article key={entry.id} className={styles.logEntry}>
          <div className={styles.entryHeader}>
            <span className={styles.entryNum}>#{entry.id}</span>
            <span className={styles.categoryBadge} style={{ background: categoryColors[entry.category] || '#616161' }}>
              {entry.category}
            </span>
          </div>
          <div className={styles.entryBody}>
            <p className={styles.prompt}>{entry.prompt}</p>
            <p className={styles.response}>{entry.response}</p>
          </div>
        </article>
      ))}
    </div>
  </div>
  )
}

export default DevPromptsLog
