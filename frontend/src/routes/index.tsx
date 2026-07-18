import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from './guards'
import AppLayout from '@/components/layout/AppLayout'
import { LoadingPage } from '@/components/shared/LoadingPage'

// Lazy-load all pages for code splitting
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const CrowdPage = lazy(() => import('@/pages/CrowdPage'))
const NavigatorPage = lazy(() => import('@/pages/NavigatorPage'))
const TransportPage = lazy(() => import('@/pages/TransportPage'))
const AccessibilityPage = lazy(() => import('@/pages/AccessibilityPage'))
const VolunteersPage = lazy(() => import('@/pages/VolunteersPage'))
const IncidentsPage = lazy(() => import('@/pages/IncidentsPage'))
const TournamentPage = lazy(() => import('@/pages/TournamentPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingPage />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/login',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: '/register',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <RegisterPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <Suspense fallback={<LoadingPage />}><DashboardPage /></Suspense> },
          { path: '/crowd', element: <Suspense fallback={<LoadingPage />}><CrowdPage /></Suspense> },
          { path: '/navigator', element: <Suspense fallback={<LoadingPage />}><NavigatorPage /></Suspense> },
          { path: '/transport', element: <Suspense fallback={<LoadingPage />}><TransportPage /></Suspense> },
          { path: '/accessibility', element: <Suspense fallback={<LoadingPage />}><AccessibilityPage /></Suspense> },
          { path: '/volunteers', element: <Suspense fallback={<LoadingPage />}><VolunteersPage /></Suspense> },
          { path: '/incidents', element: <Suspense fallback={<LoadingPage />}><IncidentsPage /></Suspense> },
          { path: '/tournament', element: <Suspense fallback={<LoadingPage />}><TournamentPage /></Suspense> },
          { path: '/settings', element: <Suspense fallback={<LoadingPage />}><SettingsPage /></Suspense> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingPage />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
