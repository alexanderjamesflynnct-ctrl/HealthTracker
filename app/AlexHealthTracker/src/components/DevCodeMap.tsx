import styles from './DevCodeMap.module.css'

interface CodeMapRow {
  uiPage: string
  uiMethod: string
  apiController: string
  apiEndpoint: string
  restMethod: string
  sqlOperation: string
  tables: string
}

const CODE_MAP: CodeMapRow[] = [
  // Dashboard
  { uiPage: 'Dashboard', uiMethod: 'LifetimeStats', apiController: 'Program.cs', apiEndpoint: '/api/pedometer/stats', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'pedometer_day_summary' },
  { uiPage: 'Dashboard', uiMethod: 'WeightLifetimeStats', apiController: 'Program.cs', apiEndpoint: '/api/weight/stats', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'weight' },
  { uiPage: 'Dashboard', uiMethod: 'WelcomeDashboard (latest)', apiController: 'Program.cs', apiEndpoint: '/api/dashboard/latest', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'pedometer_day_summary, weight' },
  // Steps
  { uiPage: 'Activity Dashboard', uiMethod: 'ActivityDashboard', apiController: 'Program.cs', apiEndpoint: '/api/activity/stats', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'pedometer_day_summary' },
  { uiPage: 'Step Reporting', uiMethod: 'StepReporting (totals)', apiController: 'Program.cs', apiEndpoint: '/api/activity/totals', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'pedometer_day_summary' },
  { uiPage: 'Step Reporting', uiMethod: 'StepReporting (monthly)', apiController: 'Program.cs', apiEndpoint: '/api/activity/monthly', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'pedometer_day_summary' },
  { uiPage: 'Step Reporting', uiMethod: 'StepReporting (yoy)', apiController: 'Program.cs', apiEndpoint: '/api/activity/yoy/{month}', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'pedometer_day_summary' },
  { uiPage: 'Step Reporting', uiMethod: 'StepReporting (annual)', apiController: 'Program.cs', apiEndpoint: '/api/activity/annual', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'pedometer_day_summary' },
  { uiPage: 'Record Steps', uiMethod: 'StepEntry (check)', apiController: 'Program.cs', apiEndpoint: '/api/activity/date/{date}', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'pedometer_day_summary' },
  { uiPage: 'Record Steps', uiMethod: 'StepEntry (save)', apiController: 'Program.cs', apiEndpoint: '/api/activity', restMethod: 'POST', sqlOperation: 'INSERT', tables: 'pedometer_day_summary' },
  { uiPage: 'Record Steps', uiMethod: 'StepEntry (replace)', apiController: 'Program.cs', apiEndpoint: '/api/activity/date/{uuid}', restMethod: 'PUT', sqlOperation: 'DELETE, INSERT', tables: 'pedometer_day_summary' },
  { uiPage: 'Raw Data (Steps)', uiMethod: 'PedometerRawData', apiController: 'Program.cs', apiEndpoint: '/api/pedometer', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'pedometer_day_summary' },
  // Weight
  { uiPage: 'Weight Dashboard', uiMethod: 'WeightDashboard', apiController: 'Program.cs', apiEndpoint: '/api/weight/stats', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'weight' },
  { uiPage: 'Weight Reporting', uiMethod: 'WeightReporting (monthly)', apiController: 'Program.cs', apiEndpoint: '/api/weight/monthly', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'weight' },
  { uiPage: 'Weight Reporting', uiMethod: 'WeightReporting (yoy)', apiController: 'Program.cs', apiEndpoint: '/api/weight/yoy/{month}', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'weight' },
  { uiPage: 'Weight Reporting', uiMethod: 'WeightReporting (annual)', apiController: 'Program.cs', apiEndpoint: '/api/weight/annual', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'weight' },
  { uiPage: 'Record Weight', uiMethod: 'WeightEntry (check)', apiController: 'Program.cs', apiEndpoint: '/api/weight/date/{date}', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'weight' },
  { uiPage: 'Record Weight', uiMethod: 'WeightEntry (save)', apiController: 'Program.cs', apiEndpoint: '/api/weight', restMethod: 'POST', sqlOperation: 'INSERT', tables: 'weight' },
  { uiPage: 'Record Weight', uiMethod: 'WeightEntry (replace)', apiController: 'Program.cs', apiEndpoint: '/api/weight/date/{uuid}', restMethod: 'PUT', sqlOperation: 'DELETE, INSERT', tables: 'weight' },
  { uiPage: 'Weight Raw Data', uiMethod: 'WeightRawData', apiController: 'Program.cs', apiEndpoint: '/api/weight', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'weight' },
  // Profile
  { uiPage: 'User Profile', uiMethod: 'ProfileSettings (load)', apiController: 'Program.cs', apiEndpoint: '/api/profile', restMethod: 'GET', sqlOperation: 'SELECT', tables: 'user_profile' },
  { uiPage: 'User Profile', uiMethod: 'ProfileSettings (save)', apiController: 'Program.cs', apiEndpoint: '/api/profile', restMethod: 'PUT', sqlOperation: 'INSERT/UPDATE', tables: 'user_profile' },
  // Health check
  { uiPage: 'C# API Documentation', uiMethod: 'SwaggerPage (iframe)', apiController: 'Program.cs', apiEndpoint: '/swagger', restMethod: 'GET', sqlOperation: '—', tables: '—' },
  { uiPage: '—', uiMethod: '—', apiController: 'Program.cs', apiEndpoint: '/api/health', restMethod: 'GET', sqlOperation: '—', tables: '—' },
]

const methodColors: Record<string, string> = {
  GET: '#2e7d32',
  POST: '#1565c0',
  PUT: '#ef6c00',
  DELETE: '#c62828',
}

const DevCodeMap = () => (
  <div className={styles.page}>
    <h2 className={styles.pageTitle}>🗺️ Code Map</h2>
    <p className={styles.subtitle}>End-to-end traceability: UI → API → Database</p>

    <div className={styles.tableWrapper}>
      <table className={styles.table} aria-label="Application code map">
        <thead>
          <tr>
            <th className={styles.th}>UI Page</th>
            <th className={styles.th}>UI Method</th>
            <th className={styles.th}>API Controller</th>
            <th className={styles.th}>API Endpoint</th>
            <th className={styles.th}>REST Method</th>
            <th className={styles.th}>SQL Operation</th>
            <th className={styles.th}>Tables</th>
          </tr>
        </thead>
        <tbody>
          {CODE_MAP.map((row, i) => (
            <tr key={i} className={styles.tr}>
              <td className={styles.td}>{row.uiPage}</td>
              <td className={`${styles.td} ${styles.mono}`}>{row.uiMethod}</td>
              <td className={`${styles.td} ${styles.mono}`}>{row.apiController}</td>
              <td className={`${styles.td} ${styles.mono}`}>{row.apiEndpoint}</td>
              <td className={styles.td}>
                <span className={styles.methodBadge} style={{ background: methodColors[row.restMethod] || '#616161' }}>
                  {row.restMethod}
                </span>
              </td>
              <td className={`${styles.td} ${styles.mono}`}>{row.sqlOperation}</td>
              <td className={`${styles.td} ${styles.mono}`}>{row.tables}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export default DevCodeMap
