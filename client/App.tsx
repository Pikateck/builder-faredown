import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CurrencyProvider } from "./contexts/CurrencyContext";

// Original pages
import Index from "./pages/Index";
import FlightResults from "./pages/FlightResults";
import BookingFlow from "./pages/BookingFlow";
import BookingConfirmation from "./pages/BookingConfirmation";
import Account from "./pages/Account";
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
import SportsEvents from "./pages/SportsEvents";
import Transfers from "./pages/Transfers";
import NotFound from "./pages/NotFound";

// Mobile pages
import MobileHome from "./pages/MobileHome";
import MobileSearch from "./pages/MobileSearch";
import MobileBargain from "./pages/MobileBargain";
import MobileBooking from "./pages/MobileBooking";
import MobileConfirmation from "./pages/MobileConfirmation";
import MobileTrips from "./pages/MobileTrips";
import MyTrips from "./pages/MyTrips";
import ApiTestPanel from "./components/ApiTestPanel";
import BackendTestDashboard from "./components/BackendTestDashboard";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import UserManagement from "./pages/admin/UserManagement";
import BargainEngine from "./pages/admin/BargainEngine";
import PaymentDashboard from "./pages/admin/PaymentDashboard";

function App() {
  return (
    <div className="App">
      <CurrencyProvider>
        <Router>
          <Routes>
            {/* Original Web Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/flights" element={<FlightResults />} />
            <Route path="/booking-flow" element={<BookingFlow />} />
            <Route path="/booking" element={<Booking />} />
            <Route
              path="/booking-confirmation"
              element={<BookingConfirmation />}
            />
            <Route path="/account" element={<Account />} />
            <Route path="/my-account" element={<Account />} />
            <Route path="/account/trips" element={<MyTrips />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/hotels/results" element={<HotelResults />} />
            <Route path="/hotels/:hotelId" element={<HotelDetails />} />
            <Route path="/hotels/booking" element={<HotelBooking />} />
            <Route path="/reserve" element={<ReservationPage />} />
            <Route
              path="/booking-confirmation"
              element={<HotelBookingConfirmation />}
            />
            <Route
              path="/booking/confirmation/:bookingRef"
              element={<BookingConfirmation />}
            />
            <Route path="/booking-voucher" element={<BookingVoucher />} />
            <Route path="/booking-invoice" element={<BookingInvoice />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/sightseeing" element={<Sightseeing />} />
            <Route path="/sports" element={<SportsEvents />} />
            <Route path="/sports-events" element={<SportsEvents />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/my-trips" element={<MyTrips />} />

            {/* Development/Testing Routes */}
            <Route path="/api-test" element={<ApiTestPanel />} />
            <Route path="/backend-test" element={<BackendTestDashboard />} />

            {/* Admin CMS Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/bargain" element={<BargainEngine />} />
            <Route path="/admin/payments" element={<PaymentDashboard />} />

            {/* Mobile App Routes */}
            <Route path="/mobile" element={<MobileHome />} />
            <Route path="/mobile-home" element={<MobileHome />} />
            <Route path="/mobile-search" element={<MobileSearch />} />
            <Route path="/mobile-bargain" element={<MobileBargain />} />
            <Route path="/mobile-booking" element={<MobileBooking />} />
            <Route
              path="/mobile-confirmation"
              element={<MobileConfirmation />}
            />
            <Route path="/mobile-trips" element={<MobileTrips />} />
            <Route path="/mobile-profile" element={<MobileTrips />} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </CurrencyProvider>
    </div>
  );
}

export default App;
