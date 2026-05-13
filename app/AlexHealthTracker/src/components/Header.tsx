import styles from './Header.module.css'

interface HeaderProps {
  firstName: string | null
  onNavigate: (node: string) => void
}

const Header = ({ firstName, onNavigate }: HeaderProps) => {
  const appName = firstName ? `${firstName}'s Health Tracker` : 'Alex Health Tracker'
  const initial = firstName ? firstName[0].toUpperCase() : 'A'
  const displayName = firstName ?? 'Alex'

  return (
    <header className={styles.header} role="banner">
      <div className={styles.logoArea} aria-label={`${appName} logo`}>
        <div className={styles.logoIcon} aria-hidden="true">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Heart with pulse line */}
            <circle cx="16" cy="16" r="15" fill="rgba(255,255,255,0.15)" />
            <path
              d="M16 24s-9-5.5-9-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-9 11-9 11z"
              fill="white"
              opacity="0.9"
            />
            <polyline
              points="8,16 11,16 13,11 15,21 17,14 19,18 21,16 24,16"
              fill="none"
              stroke="#1b5e20"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={styles.titleGroup}>
          <h1 className={styles.appName}>{appName}</h1>
          <span className={styles.tagline}>Your personal wellness dashboard</span>
        </div>
      </div>

      <nav className={styles.headerNav} aria-label="Header navigation">
        <button
          className={styles.userBadge}
          onClick={() => onNavigate('User Profile')}
          aria-label={`${displayName} — open profile settings`}
          type="button"
        >
          <div className={styles.avatar} aria-hidden="true">{initial}</div>
          <span className={styles.userName}>{displayName}</span>
        </button>
      </nav>
    </header>
  )
}

export default Header
