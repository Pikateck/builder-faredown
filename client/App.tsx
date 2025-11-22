import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { AuthProvider } from "./contexts/AuthContext";
import { DateProvider } from "./contexts/DateContext";
import { LoyaltyProvider } from "./contexts/LoyaltyContext";
import { BookingProvider } from "./contexts/BookingContext";
import { EnhancedBookingProvider } from "./contexts/EnhancedBookingContext";
import { SearchProvider } from "./contexts/SearchContext";
import { PriceProvider } from "./contexts/PriceContext";
import { useViewportClass } from "./hooks/useViewportClass";

// DEPLOYMENT TEST - Ready to push

// DEPLOYMENT TEST - Zubin verification marker
// Build: Cache-first rendering, image binding, and price sorting fixes deployed
console.log(
  "🚀 [DEPLOYMENT] App.tsx loaded - Cache-first + Images + Sorting fixes active",
);
console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
console.log("✅ All fixes deployed: (1) Cache-first timing, (2) Image binding, (3) Price sorting");

// Original pages
import Index from "./pages/Index";
import Flights from "./pages/Flights";
import FlightResults from "./pages/FlightResults";
import FlightDetails from "./pages/FlightDetails";
import FlightBooking from "./pages/FlightBooking";
import BookingFlow from "./pages/BookingFlow";
import BookingConfirmation from "./pages/BookingConfirmation";
import Account from "./pages/Account";
import Profile from "./pages/Profile";
import Booking from "./pages/Booking";
import Hotels from "./pages/Hotels";
import HotelResults from "./pages/HotelResults";
import HotelDetails from "./pages/HotelDetails";
import HotelBooking from "./pages/HotelBooking";
import ReservationPage from "./pages/ReservationPage";
import HotelBookingConfirmation from "./pages/HotelBookingConfirmation";
import BookingVoucher from "./pages/BookingVoucher";
import BookingInvoice from "./pages/BookingInvoice";
import Bookings from "./pages/Bookings";
import Sightseeing from "./pages/Sightseeing";
import SightseeingResults from "./pages/SightseeingResults";
import SightseeingDetails from "./pages/SightseeingDetails";
import SightseeingBooking from "./pages/SightseeingBooking";
import SightseeingBookingConfirmation from "./pages/SightseeingBookingConfirmation";
import SportsEvents from "./pages/SportsEvents";
import Transfers from "./pages/Transfers";
import TransferResults from "./pages/TransferResults";
import TransferDetails from "./pages/TransferDetails";
import TransferBooking from "./pages/TransferBooking";
import TransferConfirmation from "./pages/TransferConfirmation";
import HelpCenter from "./pages/HelpCenter";
import Contact from "./pages/Contact";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import RefundCancellationPolicy from "./pages/RefundCancellationPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import Saved from "./pages/Saved";
import NotFound from "./pages/NotFound";
import MembershipCard from "./pages/MembershipCard";
import FooterTest from "./pages/FooterTest";

// Packages pages
import Packages from "./pages/Packages";
import PackageResults from "./pages/PackageResults";
import PackageDetails from "./pages/PackageDetails";
import PackageBooking from "./pages/PackageBooking";

// Mobile pages
import MobileSplash from "./pages/mobile/MobileSplash";
import MobileHome from "./pages/mobile/MobileHome";
import MobileHotelResults from "./pages/mobile/MobileHotelResults";
import MobileSearch from "./pages/MobileSearch";
import MobileBargain from "./pages/MobileBargain";
import MobileBooking from "./pages/MobileBooking";
import MobileConfirmation from "./pages/MobileConfirmation";
import MobileTrips from "./pages/MobileTrips";
import MyTrips from "./pages/MyTrips";
import ApiTestPanel from "./components/ApiTestPanel";
import BackendTestDashboard from "./components/BackendTestDashboard";
import AmadeusTestPanel from "./components/AmadeusTestPanel";
import ApiIntegrationTest from "./components/ApiIntegrationTest";
import BargainErrorTest from "./components/BargainErrorTest";
import MobileBargainTestSuite from "./components/MobileBargainTestSuite";
import LogoDesignOptions from "./components/LogoDesignOptions";
import FaredownColorPalette from "./components/FaredownColorPalette";
import CmsPage from "./pages/CmsPage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import UserManagement from "./pages/admin/UserManagement";
import ProfileManagement from "./pages/admin/ProfileManagement";
import BargainEngine from "./pages/admin/BargainEngine";
import PaymentDashboard from "./pages/admin/PaymentDashboard";
import AdminTestingDashboard from "./pages/admin/AdminTestingDashboard";
import AIBargainingDashboard from "./pages/admin/AIBargainingDashboard";
import APITestingDashboard from "./pages/admin/APITestingDashboard";
import SystemMonitor from "./pages/admin/SystemMonitor";

// OAuth Callback Components
import GoogleCallback from "./pages/oauth/GoogleCallback";
import FacebookCallback from "./pages/oauth/FacebookCallback";
import AppleCallback from "./pages/oauth/AppleCallback";
import { OAuthTest } from "./pages/OAuthTest";
import { AuthTest } from "./components/AuthTest";
import { OAuthImplementationSummary } from "./components/OAuthImplementationSummary";

// Authentication and Protected Routes
import Login from "./pages/Login";
import BargainPage from "./pages/BargainPage";
import CheckoutPage from "./pages/CheckoutPage";
import RequireAuth from "./components/RequireAuth";

function App() {
  useViewportClass();

  return (
    <div className="App">
      <AuthProvider>
        <CurrencyProvider>
          <DateProvider>
            <LoyaltyProvider>
              <Router>
                <BookingProvider>
                  <EnhancedBookingProvider>
                    <PriceProvider>
                      <SearchProvider>
                        <Routes>
                          {/* Authentication Routes */}
                          <Route path="/login" element={<Login />} />

                          {/* Protected Routes */}
                          <Route
                            path="/bargain"
                            element={
                              <RequireAuth
                                useInlineAuth={false}
                                intent="BARGAIN"
                              >
                                <BargainPage />
                              </RequireAuth>
                            }
                          />
                          <Route
                            path="/checkout"
                            element={
                              <RequireAuth
                                useInlineAuth={true}
                                intent="CHECKOUT"
                              >
                                <CheckoutPage />
                              </RequireAuth>
                            }
                          />

                          {/* Original Web Routes */}
                          <Route path="/" element={<Index />} />
                          <Route path="/flights" element={<Flights />} />
                          <Route
                            path="/flights/results"
                            element={<FlightResults />}
                          />
                          <Route
                            path="/flight-details/:flightId"
                            element={<FlightDetails />}
                          />
                          <Route
                            path="/flights/booking"
                            element={<FlightBooking />}
                          />
                          <Route
                            path="/booking-flow"
                            element={<BookingFlow />}
                          />
                          <Route path="/booking" element={<Booking />} />
                          <Route
                            path="/booking-confirmation"
                            element={<BookingConfirmation />}
                          />
                          <Route path="/account" element={<Account />} />
                          <Route path="/my-account" element={<Account />} />
                          <Route
                            path="/account/personal"
                            element={<Account />}
                          />
                          <Route
                            path="/account/security"
                            element={<Account />}
                          />
                          <Route
                            path="/account/travelers"
                            element={<Account />}
                          />
                          <Route
                            path="/account/preferences"
                            element={<Account />}
                          />
                          <Route
                            path="/account/payment"
                            element={<Account />}
                          />
                          <Route
                            path="/account/loyalty"
                            element={<Account />}
                          />
                          <Route
                            path="/account/privacy"
                            element={<Account />}
                          />
                          <Route path="/account/trips" element={<Account />} />
                          <Route path="/profile" element={<Profile />} />

                          {/* Legacy route redirects */}
                          <Route
                            path="/profile-legacy"
                            element={
                              <Navigate to="/account/personal" replace />
                            }
                          />
                          <Route
                            path="/account/profile"
                            element={
                              <Navigate to="/account/personal" replace />
                            }
                          />
                          <Route
                            path="/account/profile-legacy"
                            element={
                              <Navigate to="/account/personal" replace />
                            }
                          />
                          <Route
                            path="/settings"
                            element={
                              <Navigate to="/account/preferences" replace />
                            }
                          />
                          <Route
                            path="/account/settings"
                            element={
                              <Navigate to="/account/preferences" replace />
                            }
                          />
                          <Route
                            path="/payments"
                            element={<Navigate to="/account/payment" replace />}
                          />
                          <Route
                            path="/privacy"
                            element={<Navigate to="/account/privacy" replace />}
                          />
                          <Route path="/saved" element={<Saved />} />
                          <Route path="/hotels" element={<Hotels />} />
                          <Route
                            path="/hotels/results"
                            element={<HotelResults />}
                          />
                          <Route
                            path="/hotels/:hotelId"
                            element={<HotelDetails />}
                          />
                          <Route
                            path="/hotels/booking"
                            element={<HotelBooking />}
                          />
                          <Route
                            path="/booking/hotel"
                            element={<HotelBookingConfirmation />}
                          />
                          <Route
                            path="/reserve"
                            element={<ReservationPage />}
                          />
                          <Route
                            path="/booking-confirmation"
                            element={<HotelBookingConfirmation />}
                          />
                          <Route
                            path="/booking/confirmation/:bookingRef"
                            element={<BookingConfirmation />}
                          />
                          <Route
                            path="/booking-voucher"
                            element={<BookingVoucher />}
                          />
                          <Route
                            path="/booking-invoice"
                            element={<BookingInvoice />}
                          />
                          <Route path="/bookings" element={<Bookings />} />
                          <Route
                            path="/sightseeing"
                            element={<Sightseeing />}
                          />
                          <Route
                            path="/sightseeing/results"
                            element={<SightseeingResults />}
                          />
                          <Route
                            path="/sightseeing/:attractionId"
                            element={<SightseeingDetails />}
                          />
                          <Route
                            path="/sightseeing/booking"
                            element={<SightseeingBooking />}
                          />
                          <Route
                            path="/sightseeing/booking/confirmation"
                            element={<SightseeingBookingConfirmation />}
                          />
                          <Route path="/packages" element={<Packages />} />
                          <Route
                            path="/packages/results"
                            element={<PackageResults />}
                          />
                          <Route
                            path="/packages/:slug"
                            element={<PackageDetails />}
                          />
                          <Route
                            path="/packages/:slug/booking"
                            element={<PackageBooking />}
                          />
                          <Route path="/sports" element={<SportsEvents />} />
                          <Route
                            path="/sports-events"
                            element={<SportsEvents />}
                          />
                          <Route path="/transfers" element={<Transfers />} />
                          <Route
                            path="/transfers/results"
                            element={<TransferResults />}
                          />
                          <Route
                            path="/transfer-results"
                            element={
                              <Navigate to="/transfers/results" replace />
                            }
                          />
                          <Route
                            path="/transfer-details/:id"
                            element={<TransferDetails />}
                          />
                          <Route
                            path="/transfer-booking"
                            element={<TransferBooking />}
                          />
                          <Route
                            path="/transfer-confirmation"
                            element={<TransferConfirmation />}
                          />
                          <Route path="/help" element={<HelpCenter />} />
                          <Route path="/help-center" element={<HelpCenter />} />
                          <Route path="/support" element={<HelpCenter />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/about" element={<About />} />
                          <Route
                            path="/how-it-works"
                            element={<HowItWorks />}
                          />
                          <Route
                            path="/privacy-policy"
                            element={<PrivacyPolicy />}
                          />
                          <Route
                            path="/terms-conditions"
                            element={<TermsConditions />}
                          />
                          <Route
                            path="/terms-of-service"
                            element={<TermsOfService />}
                          />
                          <Route path="/terms" element={<TermsOfService />} />
                          <Route
                            path="/refund-policy"
                            element={<RefundPolicy />}
                          />
                          <Route path="/refunds" element={<RefundPolicy />} />
                          <Route
                            path="/refund-cancellation-policy"
                            element={<RefundCancellationPolicy />}
                          />
                          <Route
                            path="/cancellation-policy"
                            element={<RefundCancellationPolicy />}
                          />
                          <Route
                            path="/cookie-policy"
                            element={<CookiePolicy />}
                          />
                          <Route path="/my-trips" element={<MyTrips />} />

                          {/* OAuth Callback Routes */}
                          <Route
                            path="/oauth/google/callback"
                            element={<GoogleCallback />}
                          />
                          <Route
                            path="/oauth/facebook/callback"
                            element={<FacebookCallback />}
                          />
                          <Route
                            path="/oauth/apple/callback"
                            element={<AppleCallback />}
                          />

                          {/* Development/Testing Routes */}
                          <Route path="/footer-test" element={<FooterTest />} />
                          <Route path="/api-test" element={<ApiTestPanel />} />
                          <Route
                            path="/backend-test"
                            element={<BackendTestDashboard />}
                          />
                          <Route
                            path="/amadeus-test"
                            element={<AmadeusTestPanel />}
                          />
                          <Route
                            path="/api-integration-test"
                            element={<ApiIntegrationTest />}
                          />
                          <Route
                            path="/bargain-error-test"
                            element={<BargainErrorTest />}
                          />
                          <Route
                            path="/mobile-bargain-test"
                            element={<MobileBargainTestSuite />}
                          />
                          <Route
                            path="/logo-designs"
                            element={<LogoDesignOptions />}
                          />
                          <Route
                            path="/color-palette"
                            element={<FaredownColorPalette />}
                          />
                          <Route path="/oauth-test" element={<OAuthTest />} />
                          <Route path="/auth-test" element={<AuthTest />} />
                          <Route
                            path="/oauth-summary"
                            element={<OAuthImplementationSummary />}
                          />

                          {/* Admin CMS Routes */}
                          <Route path="/cms/*" element={<CmsPage />} />
                          <Route path="/admin/login" element={<AdminLogin />} />
                          <Route path="/admin" element={<AdminDashboard />} />
                          <Route
                            path="/admin/dashboard"
                            element={<AdminDashboard />}
                          />
                          <Route
                            path="/admin/users"
                            element={<UserManagement />}
                          />
                          <Route
                            path="/admin/profiles"
                            element={<ProfileManagement />}
                          />
                          <Route
                            path="/admin/bargain"
                            element={<BargainEngine />}
                          />
                          <Route
                            path="/admin/payments"
                            element={<PaymentDashboard />}
                          />
                          <Route
                            path="/admin/testing"
                            element={<AdminTestingDashboard />}
                          />
                          <Route
                            path="/admin/api"
                            element={<APITestingDashboard />}
                          />
                          <Route
                            path="/admin/AIBargainingDashboard"
                            element={<AIBargainingDashboard />}
                          />
                          <Route
                            path="/admin/ai-bargaining"
                            element={<AIBargainingDashboard />}
                          />
                          <Route
                            path="/admin/api-testing"
                            element={<APITestingDashboard />}
                          />
                          <Route
                            path="/admin/APITestingDashboard"
                            element={<APITestingDashboard />}
                          />
                          <Route
                            path="/admin/system-monitor"
                            element={<SystemMonitor />}
                          />

                          {/* Mobile App Routes */}
                          <Route path="/mobile" element={<MobileSplash />} />
                          <Route
                            path="/mobile-splash"
                            element={<MobileSplash />}
                          />
                          <Route path="/mobile-home" element={<MobileHome />} />
                          <Route
                            path="/mobile-hotels"
                            element={<MobileHotelResults />}
                          />
                          <Route
                            path="/mobile-hotel-results"
                            element={<MobileHotelResults />}
                          />
                          <Route
                            path="/mobile-search"
                            element={<MobileSearch />}
                          />
                          <Route
                            path="/mobile-bargain"
                            element={<MobileBargain />}
                          />
                          <Route
                            path="/mobile-booking"
                            element={<MobileBooking />}
                          />
                          <Route
                            path="/mobile-confirmation"
                            element={<MobileConfirmation />}
                          />
                          <Route
                            path="/mobile-trips"
                            element={<MobileTrips />}
                          />
                          <Route
                            path="/mobile-profile"
                            element={<MobileTrips />}
                          />

                          {/* Loyalty Routes */}
                          <Route
                            path="/membership-card"
                            element={<MembershipCard />}
                          />

                          {/* Fallback */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </SearchProvider>
                    </PriceProvider>
                  </EnhancedBookingProvider>
                </BookingProvider>
              </Router>
            </LoyaltyProvider>
          </DateProvider>
        </CurrencyProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
