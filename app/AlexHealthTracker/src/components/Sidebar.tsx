import { useState, useCallback } from 'react'
import TreeMenu from './TreeMenu'
import type { TreeNode } from '../types'
import styles from './Sidebar.module.css'
import { useAppStrings } from '../hooks/useAppStrings'

const NAV_TREE: TreeNode[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    stringKey: 'node_dashboard',
  },
  {
    id: 'activity',
    label: 'Steps',
    icon: '🏃',
    stringKey: 'node_steps',
    children: [
      { id: 'activity-dashboard', label: 'Activity Dashboard', stringKey: 'node_activity_dashboard' },
      { id: 'activity-reporting', label: 'Step Reporting', stringKey: 'node_step_reporting' },
      { id: 'activity-entry', label: 'Record Steps', stringKey: 'node_record_steps' },
      { id: 'activity-raw-data', label: 'Raw Data', stringKey: 'node_raw_data' },
    ],
  },
  {
    id: 'weight-body',
    label: 'Weight',
    icon: '⚖️',
    stringKey: 'node_weight',
    children: [
      { id: 'weight-dashboard', label: 'Weight Dashboard', stringKey: 'node_weight_dashboard' },
      { id: 'weight-entry', label: 'Record Weight', stringKey: 'node_record_weight' },
      { id: 'weight-reporting', label: 'Weight Reporting', stringKey: 'node_weight_reporting' },
      { id: 'weight-raw-data', label: 'Weight Raw Data', stringKey: 'node_weight_raw_data' },
    ],
  },
  {
    id: 'documentation',
    label: 'Documentation',
    icon: '📚',
    stringKey: 'node_documentation',
    children: [
      { id: 'docs-csharp-api', label: 'C# API Documentation', stringKey: 'node_api_docs' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    stringKey: 'node_settings',
    children: [
      { id: 'settings-profile', label: 'User Profile', stringKey: 'node_user_profile' },
    ],
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: '🛠️',
    stringKey: 'node_developer',
    children: [
      { id: 'dev-prompts', label: 'Prompts Log', stringKey: 'node_prompts_log' },
      { id: 'dev-code-stats', label: 'Code Stats', stringKey: 'node_code_stats' },
      { id: 'dev-code-map', label: 'Code Map', stringKey: 'node_code_map' },
      { id: 'dev-api-docs', label: 'API Documentation', stringKey: 'node_api_documentation' },
      {
        id: 'dev-strings',
        label: 'Strings',
        stringKey: 'node_strings',
        children: [
          { id: 'dev-string-editor', label: 'String Editor', stringKey: 'node_string_editor' },
          { id: 'dev-string-log', label: 'String Change Log', stringKey: 'node_string_change_log' },
        ],
      },
    ],
  },
]

interface SidebarProps {
  selectedNode: string | null
  onSelectNode: (id: string) => void
}

const Sidebar = ({ selectedNode, onSelectNode }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { s } = useAppStrings()

  const handleSelectNode = useCallback(
    (_id: string, label: string) => {
      // We pass the label as the "selected" identifier for display purposes
      onSelectNode(label)
    },
    [onSelectNode]
  )

  return (
    <aside
      className={[styles.sidebar, isCollapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}
      aria-label="Main navigation sidebar"
    >
      <div className={styles.sidebarHeader}>
        {!isCollapsed && <span className={styles.sidebarTitle}>{s('Sidebar', 'nav_title', 'Navigation')}</span>}
        <button
          className={styles.collapseBtn}
          onClick={() => setIsCollapsed(prev => !prev)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          type="button"
        >
          <span
            className={[styles.collapseIcon, isCollapsed ? styles.collapseIconFlipped : '']
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
          >
            ◀
          </span>
        </button>
      </div>

      {!isCollapsed && (
        <div className={styles.treeContainer}>
          <TreeMenu
            nodes={NAV_TREE}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
          />
        </div>
      )}
    </aside>
  )
}

export default Sidebar
