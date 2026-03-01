import { createBrowserRouter } from 'react-router'
import { AppLayout } from './layouts/AppLayout'
import { GamePage } from './pages/GamePage'
import { HomePage } from './pages/HomePage'
import { LobbyPage } from './pages/LobbyPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/lobby', element: <LobbyPage /> },
      { path: '/game/:roomId', element: <GamePage /> },
    ],
  },
])
