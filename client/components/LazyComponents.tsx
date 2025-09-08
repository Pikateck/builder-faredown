import { lazy } from 'react';

// Lazy load main pages for code splitting
export const LazyHotelResults = lazy(() => import('@/pages/HotelResults'));
export const LazyHotelDetails = lazy(() => import('@/pages/HotelDetails'));
export const LazyFlightResults = lazy(() => import('@/pages/FlightResults'));
export const LazyFlightDetails = lazy(() => import('@/pages/FlightDetails'));
export const LazySightseeingResults = lazy(() => import('@/pages/SightseeingResults'));
export const LazySightseeingDetails = lazy(() => import('@/pages/SightseeingDetails'));
export const LazyTransferResults = lazy(() => import('@/pages/TransferResults'));
export const LazyTransferDetails = lazy(() => import('@/pages/TransferDetails'));

// Lazy load booking flow components
export const LazyBookingFlow = lazy(() => import('@/pages/BookingFlow'));
export const LazyBookingConfirmation = lazy(() => import('@/pages/BookingConfirmation'));

// Lazy load admin components
export const LazyAdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
export const LazyAdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
export const LazyAIBargainingDashboard = lazy(() => import('@/pages/admin/AIBargainingDashboard'));

// Lazy load account components
export const LazyAccount = lazy(() => import('@/pages/Account'));
export const LazyAccountDashboard = lazy(() => import('@/pages/AccountDashboard'));
export const LazyMyTrips = lazy(() => import('@/pages/MyTrips'));

// Lazy load other heavy components
export const LazyBargainEngine = lazy(() => import('@/pages/admin/BargainEngine'));
export const LazyAPITestingDashboard = lazy(() => import('@/pages/admin/APITestingDashboard'));
