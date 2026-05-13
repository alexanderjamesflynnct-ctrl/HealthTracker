import { useState, useCallback, useId } from 'react'
import type { TreeNode } from '../types'
import styles from './TreeMenu.module.css'

interface TreeMenuItemProps {
  node: TreeNode
  depth: number
  selectedNode: string | null
  onSelectNode: (id: string, label: string) => void
}

const TreeMenuItem = ({ node, depth, selectedNode, onSelectNode }: TreeMenuItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const isLeaf = !hasChildren
  const isSelected = selectedNode === node.id
  const expandId = useId()

  const handleToggle = useCallback(() => {
    if (hasChildren) {
      setIsExpanded(prev => !prev)
    }
  }, [hasChildren])

  const handleClick = useCallback(() => {
    if (isLeaf) {
      onSelectNode(node.id, node.label)
    } else {
      handleToggle()
    }
  }, [isLeaf, node.id, node.label, onSelectNode, handleToggle])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
      if (e.key === 'ArrowRight' && hasChildren && !isExpanded) {
        e.preventDefault()
        setIsExpanded(true)
      }
      if (e.key === 'ArrowLeft' && hasChildren && isExpanded) {
        e.preventDefault()
        setIsExpanded(false)
      }
    },
    [handleClick, hasChildren, isExpanded]
  )

  return (
    <li
      role={hasChildren ? 'treeitem' : 'treeitem'}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isLeaf ? isSelected : undefined}
    >
      <button
        className={[
          styles.nodeButton,
          isLeaf ? styles.leafNode : styles.branchNode,
          isSelected ? styles.selected : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-controls={hasChildren ? expandId : undefined}
        tabIndex={0}
        type="button"
      >
        {hasChildren && (
          <span
            className={[styles.chevron, isExpanded ? styles.chevronOpen : '']
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
          >
            ▶
          </span>
        )}
        {!hasChildren && <span className={styles.leafDot} aria-hidden="true" />}
        {node.icon && (
          <span className={styles.nodeIcon} aria-hidden="true">
            {node.icon}
          </span>
        )}
        <span className={styles.nodeLabel}>{node.label}</span>
      </button>

      {hasChildren && isExpanded && (
        <ul
          id={expandId}
          role="group"
          className={styles.childList}
        >
          {node.children!.map(child => (
            <TreeMenuItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNode={selectedNode}
              onSelectNode={onSelectNode}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

interface TreeMenuProps {
  nodes: TreeNode[]
  selectedNode: string | null
  onSelectNode: (id: string, label: string) => void
}

const TreeMenu = ({ nodes, selectedNode, onSelectNode }: TreeMenuProps) => {
  return (
    <nav aria-label="Health tracker navigation">
      <ul role="tree" className={styles.tree} aria-label="Navigation menu">
        {nodes.map(node => (
          <TreeMenuItem
            key={node.id}
            node={node}
            depth={0}
            selectedNode={selectedNode}
            onSelectNode={onSelectNode}
          />
        ))}
      </ul>
    </nav>
  )
}

export default TreeMenu
