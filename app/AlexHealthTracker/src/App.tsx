import { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import styles from './App.module.css'

const App = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [firstName, setFirstName] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:5181/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.firstName) setFirstName(data.firstName) })
      .catch(() => {})
  }, [])

  return (
    <div className={styles.appShell}>
      <Header firstName={firstName} onNavigate={setSelectedNode} />
      <div className={styles.body}>
        <Sidebar selectedNode={selectedNode} onSelectNode={setSelectedNode} />
        <MainContent selectedNode={selectedNode} onProfileSaved={setFirstName} firstName={firstName} onNavigate={setSelectedNode} />
      </div>
    </div>
  )
}

export default App
