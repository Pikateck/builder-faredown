import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Original pages
import Index from "./pages/Index";
import FlightResults from "./pages/FlightResults";
import BookingFlow from "./pages/BookingFlow";
import BookingConfirmation from "./pages/BookingConfirmation";
import Account from "./pages/Account";
import Booking from "./pages/Booking";
import Hotels from "./pages/Hotels";
import HotelResults from "./pages/HotelResults";
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

function App() {
  return (
    <div className="App">
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
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/hotels/results" element={<HotelResults />} />
          <Route path="/sightseeing" element={<Sightseeing />} />
          <Route path="/sports-events" element={<SportsEvents />} />
          <Route path="/transfers" element={<Transfers />} />

          {/* Mobile App Routes */}
          <Route path="/mobile" element={<MobileHome />} />
          <Route path="/mobile-home" element={<MobileHome />} />
          <Route path="/mobile-search" element={<MobileSearch />} />
          <Route path="/mobile-bargain" element={<MobileBargain />} />
          <Route path="/mobile-booking" element={<MobileBooking />} />
          <Route path="/mobile-confirmation" element={<MobileConfirmation />} />
          <Route path="/mobile-trips" element={<MobileTrips />} />
          <Route path="/mobile-profile" element={<MobileTrips />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
