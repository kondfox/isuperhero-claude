import styles from './DifficultyBadge.module.css'

interface DifficultyBadgeProps {
  level: number
}

export function DifficultyBadge({ level }: DifficultyBadgeProps) {
  return <output className={`${styles.badge} ${styles[`level${level}`]}`}>Lvl {level}</output>
}
