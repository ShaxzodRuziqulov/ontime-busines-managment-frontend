import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
    requiresStaff?: boolean
    guest?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/onboarding/OnboardingView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
        },
        {
          path: 'bookings',
          name: 'bookings',
          component: () => import('@/views/bookings/BookingsView.vue'),
        },
        {
          path: 'services',
          name: 'services',
          component: () => import('@/views/services/ServicesView.vue'),
        },
        {
          path: 'staff',
          name: 'staff',
          component: () => import('@/views/staff/StaffView.vue'),
        },
        {
          path: 'business',
          name: 'business',
          component: () => import('@/views/business/BusinessView.vue'),
        },
        {
          path: 'reviews',
          name: 'reviews',
          component: () => import('@/views/reviews/ReviewsView.vue'),
        },
        {
          path: 'hours',
          name: 'hours',
          component: () => import('@/views/hours/BusinessHoursView.vue'),
        },
      ],
    },
    {
      path: '/staff-portal',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true, requiresStaff: true },
      children: [
        {
          path: '',
          name: 'staff-portal',
          component: () => import('@/views/staff-portal/StaffPortalView.vue'),
        },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/AdminDashboardView.vue'),
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/AdminUsersView.vue'),
        },
        {
          path: 'businesses',
          name: 'admin-businesses',
          component: () => import('@/views/admin/AdminBusinessesView.vue'),
        },
        {
          path: 'businesses/:id',
          name: 'admin-business-detail',
          component: () => import('@/views/admin/AdminBusinessDetailView.vue'),
        },
        {
          path: 'audit',
          name: 'admin-audit',
          component: () => import('@/views/admin/AdminAuditView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: auth.isStaff ? 'staff-portal' : 'dashboard' }
  }
  if (to.meta.requiresStaff && !auth.isStaff && !auth.isAdmin && !auth.isBusinessOwner) {
    return { name: 'onboarding' }
  }
  if (to.meta.guest && auth.isAuthenticated) {
    if (auth.isAdmin) return { name: 'admin-dashboard' }
    if (auth.isBusinessOwner) return { name: 'dashboard' }
    if (auth.isStaff) return { name: 'staff-portal' }
    return { name: 'onboarding' }
  }
  // Autentifikatsiyadan o'tgan lekin biznes egasi bo'lmagan foydalanuvchi
  if (
    to.meta.requiresAuth &&
    auth.isAuthenticated &&
    !auth.isBusinessOwner &&
    !auth.isAdmin &&
    !auth.isStaff &&
    to.name !== 'onboarding'
  ) {
    return { name: 'onboarding' }
  }
})

export default router
