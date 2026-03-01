import { Outlet } from 'react-router'
import styles from './AppLayout.module.css'

export function AppLayout() {
  return (
    <div className={styles.layout}>
      <Outlet />
    </div>
  )
}
