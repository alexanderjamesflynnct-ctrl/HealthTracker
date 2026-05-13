import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import styles from './DevCodeStats.module.css'

// Static code stats — update when codebase changes significantly
interface FileInfo { path: string; lines: number; language: string }

const FILES: FileInfo[] = [
  // React / TypeScript
  { path: 'src/components/MainContent.tsx', lines: 320, language: 'TypeScript/React' },
  { path: 'src/components/WeightReporting.tsx', lines: 280, language: 'TypeScript/React' },
  { path: 'src/components/StepReporting.tsx', lines: 270, language: 'TypeScript/React' },
  { path: 'src/components/WeightEntry.tsx', lines: 180, language: 'TypeScript/React' },
  { path: 'src/components/StepEntry.tsx', lines: 150, language: 'TypeScript/React' },
  { path: 'src/components/PedometerRawData.tsx', lines: 200, language: 'TypeScript/React' },
  { path: 'src/components/WeightRawData.tsx', lines: 195, language: 'TypeScript/React' },
  { path: 'src/components/WeightDashboard.tsx', lines: 160, language: 'TypeScript/React' },
  { path: 'src/components/ActivityDashboard.tsx', lines: 120, language: 'TypeScript/React' },
  { path: 'src/components/ProfileSettings.tsx', lines: 175, language: 'TypeScript/React' },
  { path: 'src/components/Header.tsx', lines: 55, language: 'TypeScript/React' },
  { path: 'src/components/Sidebar.tsx', lines: 100, language: 'TypeScript/React' },
  { path: 'src/components/TreeMenu.tsx', lines: 110, language: 'TypeScript/React' },
  { path: 'src/components/DevCodeMap.tsx', lines: 95, language: 'TypeScript/React' },
  { path: 'src/components/DevCodeStats.tsx', lines: 180, language: 'TypeScript/React' },
  { path: 'src/components/DevPromptsLog.tsx', lines: 80, language: 'TypeScript/React' },
  { path: 'src/App.tsx', lines: 30, language: 'TypeScript/React' },
  { path: 'src/hooks/useWeightUom.ts', lines: 15, language: 'TypeScript/React' },
  { path: 'src/types.ts', lines: 8, language: 'TypeScript/React' },
  { path: 'src/main.tsx', lines: 10, language: 'TypeScript/React' },
  // CSS
  { path: 'src/components/MainContent.module.css', lines: 220, language: 'CSS' },
  { path: 'src/components/WeightReporting.module.css', lines: 160, language: 'CSS' },
  { path: 'src/components/StepReporting.module.css', lines: 160, language: 'CSS' },
  { path: 'src/components/PedometerRawData.module.css', lines: 180, language: 'CSS' },
  { path: 'src/components/WeightRawData.module.css', lines: 170, language: 'CSS' },
  { path: 'src/components/WeightEntry.module.css', lines: 200, language: 'CSS' },
  { path: 'src/components/WeightDashboard.module.css', lines: 140, language: 'CSS' },
  { path: 'src/components/ActivityDashboard.module.css', lines: 130, language: 'CSS' },
  { path: 'src/components/ProfileSettings.module.css', lines: 150, language: 'CSS' },
  { path: 'src/components/Header.module.css', lines: 70, language: 'CSS' },
  { path: 'src/components/Sidebar.module.css', lines: 90, language: 'CSS' },
  { path: 'src/components/TreeMenu.module.css', lines: 100, language: 'CSS' },
  { path: 'src/components/DevCodeMap.module.css', lines: 50, language: 'CSS' },
  { path: 'src/components/DevCodeStats.module.css', lines: 60, language: 'CSS' },
  { path: 'src/index.css', lines: 65, language: 'CSS' },
  // C# API
  { path: 'API/HealthDatabase.cs', lines: 650, language: 'C#' },
  { path: 'API/Program.cs', lines: 200, language: 'C#' },
  { path: 'API/Models/WeightStats.cs', lines: 25, language: 'C#' },
  { path: 'API/Models/ActivityStats.cs', lines: 12, language: 'C#' },
  { path: 'API/Models/PedometerStats.cs', lines: 10, language: 'C#' },
  { path: 'API/Models/UserProfile.cs', lines: 20, language: 'C#' },
  { path: 'API/Models/Weight.cs', lines: 15, language: 'C#' },
  { path: 'API/Models/PedometerDaySummary.cs', lines: 10, language: 'C#' },
  { path: 'API/Models/PagedResult.cs', lines: 8, language: 'C#' },
  { path: 'API/Models/AddStepsRequest.cs', lines: 7, language: 'C#' },
  { path: 'API/Models/YearlyStepTotal.cs', lines: 4, language: 'C#' },
  // SQL
  { path: 'Database/DDL/ddl_pedometer_day_summary.sql', lines: 8, language: 'SQL' },
  { path: 'Database/DDL/ddl_weight.sql', lines: 8, language: 'SQL' },
  // Config
  { path: 'vite.config.ts', lines: 10, language: 'Config' },
  { path: 'tsconfig.json', lines: 8, language: 'Config' },
  { path: 'package.json', lines: 25, language: 'Config' },
  { path: 'API/appsettings.json', lines: 12, language: 'Config' },
  { path: 'API/HealthTrackerAPI.csproj', lines: 15, language: 'Config' },
]

const COLORS: Record<string, string> = {
  'TypeScript/React': '#3178c6',
  'CSS': '#563d7c',
  'C#': '#68217a',
  'SQL': '#e38c00',
  'Config': '#9e9e9e',
}

const DevCodeStats = () => {
  const byLanguage = useMemo(() => {
    const map = new Map<string, { files: number; lines: number }>()
    for (const f of FILES) {
      const entry = map.get(f.language) ?? { files: 0, lines: 0 }
      entry.files++
      entry.lines += f.lines
      map.set(f.language, entry)
    }
    return [...map.entries()]
      .map(([lang, { files, lines }]) => ({ language: lang, files, lines, color: COLORS[lang] ?? '#616161' }))
      .sort((a, b) => b.lines - a.lines)
  }, [])

  const totalFiles = FILES.length
  const totalLines = FILES.reduce((s, f) => s + f.lines, 0)
  const sortedFiles = useMemo(() => [...FILES].sort((a, b) => b.lines - a.lines), [])

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>📊 Code Stats</h2>

      {/* Summary */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{totalFiles}</span>
          <span className={styles.summaryLabel}>Total Files</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{totalLines.toLocaleString()}</span>
          <span className={styles.summaryLabel}>Total Lines</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{byLanguage.length}</span>
          <span className={styles.summaryLabel}>Languages</span>
        </div>
      </div>

      {/* Charts side by side */}
      <div className={styles.chartsRow}>
        {/* Lines by language bar chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Lines by Language</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byLanguage} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
              <XAxis dataKey="language" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Bar dataKey="lines" name="Lines" radius={[4,4,0,0]}>
                {byLanguage.map(d => <Cell key={d.language} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Files by language pie chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Files by Language</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byLanguage} dataKey="files" nameKey="language" cx="50%" cy="50%"
                outerRadius={80} label={({ language, files }) => `${language}: ${files}`}
                labelLine={false} fontSize={11}>
                {byLanguage.map(d => <Cell key={d.language} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${v} files`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* File list */}
      <section>
        <h3 className={styles.chartTitle}>All Files by Size</h3>
        <div className={styles.fileList}>
          {sortedFiles.map(f => (
            <div key={f.path} className={styles.fileRow}>
              <span className={styles.filePath}>{f.path}</span>
              <span className={styles.fileLang} style={{ color: COLORS[f.language] }}>{f.language}</span>
              <span className={styles.fileLines}>{f.lines} lines</span>
              <div className={styles.fileBar}>
                <div className={styles.fileBarFill}
                  style={{ width: `${(f.lines / sortedFiles[0].lines) * 100}%`, background: COLORS[f.language] }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default DevCodeStats
