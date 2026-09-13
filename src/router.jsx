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
import Payment from './pages/Payment'
import PaymentCallback from './pages/PaymentCallback'
import Privacy from './pages/Privacy'
import Faq from './pages/Faq'
import VerifyEmail from './pages/VerifyEmail'
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
  errorComponent: function RouteError({ error }) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
          <p className="text-gray-400 text-sm mb-6">{error?.message || 'The page failed to load.'}</p>
          <a href="/" className="inline-block px-6 py-3 rounded-xl font-semibold bg-[#a855f7] text-white">
            Reload home
          </a>
        </div>
      </div>
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

const paymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment',
  validateSearch: (search) => {
    return {
      registration_id: search?.registration_id || '',
      event_id: search?.event_id || '',
    }
  },
  component: function PaymentPage() {
    return (
      <ProtectedRoute requiredRole="client">
        <Payment />
      </ProtectedRoute>
    )
  },
})

const paymentCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment/callback',
  component: PaymentCallback,
})

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/privacy',
  component: Privacy,
})

const faqRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faq',
  component: Faq,
})

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-email',
  validateSearch: (search) => ({
    token: typeof search?.token === 'string' ? search.token : '',
  }),
  component: VerifyEmail,
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
  paymentRoute,
  paymentCallbackRoute,
  privacyRoute,
  faqRoute,
  verifyEmailRoute,
])

export const router = createRouter({ routeTree })

