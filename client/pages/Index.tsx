import React, { useState, useEffect, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDateContext } from "@/contexts/DateContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import {
  formatDateToDDMMMYYYY,
  formatDateToDisplayString,
} from "@/lib/dateUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingCalendar } from "@/components/BookingCalendar";
import { BookingSearchForm } from "@/components/BookingSearchForm";
import { SightseeingSearchForm } from "@/components/SightseeingSearchForm";
import { TransfersSearchForm } from "@/components/TransfersSearchForm";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Plane,
  Search,
  Shield,
  Clock,
  TrendingUp,
  Headphones,
  CheckCircle,
  MessageCircle,
  Settings,
  Smartphone,
  BarChart3,
  Bell,
  DollarSign,
  MapPin,
  Building2,
  Building,
  Star,
  Users,
  Phone,
  ArrowRight,
  Play,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  User,
  BookOpen,
  Award,
  CreditCard,
  Heart,
  LogOut,
  Menu,
  Code,
  Hotel,
  Globe,
  Zap,
  Target,
  Gift,
  Plus,
  Minus,
  Navigation,
  Compass,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Camera,
  Car,
} from "lucide-react";
import { downloadProjectInfo } from "@/lib/codeExport";
import {
  MobileCityDropdown,
  MobileDatePicker,
  MobileTravelers,
  MobileClassDropdown,
} from "@/components/MobileDropdowns";

export default function Index() {
  useScrollToTop();
  const { isLoggedIn, user, login, logout } = useAuth();
  const { selectedCurrency, currencies, setCurrency, lastUpdated, isLoading } =
    useCurrency();
  const {
    departureDate,
    returnDate,
    tripType,
    setDepartureDate,
    setReturnDate,
    setTripType,
    formatDisplayDate,
    getSearchParams,
  } = useDateContext();
  const userName = user?.name || "";
  const navigate = useNavigate();

  // State variables
  const [showSignIn, setShowSignIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("flights");

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#003580] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#febb02] rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-[#003580]" />
              </div>
              <span className="text-xl font-bold">faredown.com</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => setActiveTab("flights")}
                className={`hover:text-blue-200 ${
                  activeTab === "flights" ? "border-b-2 border-white" : ""
                }`}
              >
                Flights
              </button>
              <button
                onClick={() => setActiveTab("hotels")}
                className={`hover:text-blue-200 ${
                  activeTab === "hotels" ? "border-b-2 border-white" : ""
                }`}
              >
                Hotels
              </button>
              <button
                onClick={() => setActiveTab("sightseeing")}
                className={`hover:text-blue-200 ${
                  activeTab === "sightseeing" ? "border-b-2 border-white" : ""
                }`}
              >
                Sightseeing
              </button>
              <button
                onClick={() => setActiveTab("transfers")}
                className={`hover:text-blue-200 ${
                  activeTab === "transfers" ? "border-b-2 border-white" : ""
                }`}
              >
                Transfers
              </button>
            </nav>
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="flex items-center space-x-2">
                  <span>Welcome, {userName}</span>
                  <button
                    onClick={logout}
                    className="text-sm bg-red-600 px-3 py-1 rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowSignIn(true)}
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-[#003580]"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-[#003580] text-white pb-16">
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Upgrade. Bargain. Book.</h1>
            <p className="text-xl text-blue-200">
              Turn your seat into an upgrade and your fare into a win, with AI that bargains for you.
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg p-6 text-gray-900">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">From</label>
                <input 
                  type="text" 
                  placeholder="Departure city"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <input 
                  type="text" 
                  placeholder="Destination city"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Departure</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Return</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <Button className="w-full bg-[#febb02] hover:bg-[#d19900] text-[#003580] font-bold py-3 text-lg">
              <Search className="w-5 h-5 mr-2" />
              Search Flights
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Why Faredown Is Reinventing Travel Booking</h2>
          <p className="text-center text-gray-600 mb-12">The future of booking isn't fixed pricing - it's live bargaining.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Live Bargain Technology</h3>
              <p className="text-gray-600 text-sm">Negotiate, negotiate, negotiate instantly online without switching your browser. Turn that deal into Business class.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Pay What You Feel is Fair</h3>
              <p className="text-gray-600 text-sm">For the first time ever, you get to propose a price. Air miles, your time, or experience in the booking, to an offer they can't refuse.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Secure. Real-Time Bookings.</h3>
              <p className="text-gray-600 text-sm">Your data is guaranteed to be safe with enhanced architecture. We only negotiate when availability is live and guarantee confirmed prices.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Smarter Than Any Travel Agent</h3>
              <p className="text-gray-600 text-sm">Real-time data lets you know how to secure faster flights and cheaper bookings than any air travel booking site, or any travel agent.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Trusted by 500+ Travelers</h2>
          <p className="text-gray-600 mb-8">Real reviews from verified travelers</p>
          <div className="flex items-center justify-center space-x-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-lg font-semibold">4.9</span>
          </div>
        </div>
      </div>

      {/* Admin Access */}
      <div className="bg-[#003580] text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-xl font-semibold mb-4">System Access</h3>
          <div className="flex justify-center space-x-4">
            <a 
              href="/admin/login" 
              className="bg-[#febb02] text-[#003580] px-6 py-2 rounded-lg font-semibold hover:bg-[#d19900]"
            >
              Admin Panel
            </a>
            <a 
              href="/admin/api" 
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              API Testing
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
}
