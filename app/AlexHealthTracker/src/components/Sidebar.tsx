import { useState, useCallback } from 'react'
import TreeMenu from './TreeMenu'
import type { TreeNode } from '../types'
import styles from './Sidebar.module.css'

const NAV_TREE: TreeNode[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
  },
  {
    id: 'activity',
    label: 'Steps',
    icon: '🏃',
    children: [
      { id: 'activity-dashboard', label: 'Activity Dashboard' },
      { id: 'activity-reporting', label: 'Step Reporting' },
      { id: 'activity-entry', label: 'Record Steps' },      
      { id: 'activity-raw-data', label: 'Raw Data' },
    ],
  },
  {
    id: 'weight-body',
    label: 'Weight',
    icon: '⚖️',
    children: [
      { id: 'weight-dashboard', label: 'Weight Dashboard' },
      { id: 'weight-entry', label: 'Record Weight' },
      { id: 'weight-reporting', label: 'Weight Reporting' },
      { id: 'weight-raw-data', label: 'Weight Raw Data' },
    ],
  },
  {
    id: 'documentation',
    label: 'Documentation',
    icon: '📚',
    children: [
      { id: 'docs-csharp-api', label: 'C# API Documentation' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    children: [
      { id: 'settings-profile', label: 'User Profile' },
    ],
  },
]

interface SidebarProps {
  selectedNode: string | null
  onSelectNode: (id: string) => void
}

const Sidebar = ({ selectedNode, onSelectNode }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

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
        {!isCollapsed && <span className={styles.sidebarTitle}>Navigation</span>}
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
