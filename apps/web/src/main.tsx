import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { RoomProvider } from './context/RoomContext'
import { router } from './router'
import './styles/tokens.css'
import './styles/reset.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <RoomProvider>
      <RouterProvider router={router} />
    </RoomProvider>
  </StrictMode>,
)
