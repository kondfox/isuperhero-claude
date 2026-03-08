import { createBrowserRouter } from 'react-router'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { ActivatePage } from './pages/ActivatePage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { GamePage } from './pages/GamePage'
import { HomePage } from './pages/HomePage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { LobbyPage } from './pages/LobbyPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      // Public routes — accessible without authentication
      { path: '/', element: <HomePage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/activate', element: <ActivatePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      // Everything else requires authentication
      {
        path: '*',
        element: <ProtectedRoute />,
        children: [
          { path: 'lobby', element: <LobbyPage /> },
          { path: 'game/:roomId', element: <GamePage /> },
          { path: 'leaderboard', element: <LeaderboardPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
])
