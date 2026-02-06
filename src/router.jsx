import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import EventDetail from './pages/EventDetail'
import Register from './pages/Register'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import ClientDashboard from './pages/dashboard/ClientDashboard'
import DeveloperDashboard from './pages/dashboard/DeveloperDashboard'
import CreateEvent from './pages/admin/CreateEvent'
import EditEvent from './pages/admin/EditEvent'
import EventRegistrations from './pages/admin/EventRegistrations'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './lib/authContext'

const rootRoute = createRootRoute({
  component: function Root() {
    return (
      <AuthProvider>
        <Layout />
      </AuthProvider>
    )
  },
  notFoundComponent: function NotFound() {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">404</h1>
          <p className="text-gray-500 mb-6">Page not found</p>
          <a href="/" className="btn-primary">
            Go Home
          </a>
        </div>
      </div>
    )
  },
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
})

const eventDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/events/$eventId',
  component: EventDetail,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/events/$eventId/register',
  component: function RegisterPage() {
    return (
      <ProtectedRoute requiredRole="client">
        <Register />
      </ProtectedRoute>
    )
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignUp,
})

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: function AdminDash() {
    return (
      <ProtectedRoute requiredRole={['admin', 'developer']}>
        <AdminDashboard />
      </ProtectedRoute>
    )
  },
})

const createEventRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/events/new',
  component: function CreateEventPage() {
    return (
      <ProtectedRoute requiredRole={['admin', 'developer']}>
        <CreateEvent />
      </ProtectedRoute>
    )
  },
})

const editEventRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/events/$eventId/edit',
  component: function EditEventPage() {
    return (
      <ProtectedRoute requiredRole={['admin', 'developer']}>
        <EditEvent />
      </ProtectedRoute>
    )
  },
})

const eventRegsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/events/$eventId/registrations',
  component: function EventRegsPage() {
    return (
      <ProtectedRoute requiredRole={['admin', 'developer']}>
        <EventRegistrations />
      </ProtectedRoute>
    )
  },
})

const clientDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: function ClientDash() {
    return (
      <ProtectedRoute requiredRole="client">
        <ClientDashboard />
      </ProtectedRoute>
    )
  },
})

const developerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/developer',
  component: function DevDash() {
    return (
      <ProtectedRoute requiredRole="developer">
        <DeveloperDashboard />
      </ProtectedRoute>
    )
  },
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  eventDetailRoute,
  registerRoute,
  loginRoute,
  signupRoute,
  adminDashboardRoute,
  createEventRoute,
  editEventRoute,
  eventRegsRoute,
  clientDashboardRoute,
  developerRoute,
])

export const router = createRouter({ routeTree })

