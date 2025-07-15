import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  LogOut,
  CreditCard,
  BookOpen,
  Menu,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
];

export function Header({ className }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState({
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
  });

  const handleSignOut = () => {
    setIsLoggedIn(false);
    navigate("/");
  };

  const handleSignIn = () => {
    setIsLoggedIn(true);
  };

  return (
    <header
      className={cn("bg-blue-700 text-white sticky top-0 z-40", className)}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-lg sm:text-xl font-bold tracking-tight">
              faredown.com
            </span>
          </Link>
          <div className="flex items-center space-x-2 md:space-x-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-white p-2 touch-manipulation"
            >
              <Menu className="w-6 h-6" />
            </button>

            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link
                to="/flights"
                className={cn(
                  "text-white hover:text-blue-200 cursor-pointer flex items-center py-4",
                  location.pathname === "/flights" || location.pathname === "/"
                    ? "font-semibold border-b-2 border-white"
                    : "",
                )}
              >
                <span>Flights</span>
              </Link>
              <Link
                to="/hotels"
                className={cn(
                  "text-white hover:text-blue-200 cursor-pointer flex items-center py-4",
                  location.pathname.startsWith("/hotels")
                    ? "font-semibold border-b-2 border-white"
                    : "",
                )}
              >
                <span>Hotels</span>
              </Link>
              <Link
                to="/transfers"
                className={cn(
                  "text-white hover:text-blue-200 cursor-pointer flex items-center py-4",
                  location.pathname === "/transfers"
                    ? "font-semibold border-b-2 border-white"
                    : "",
                )}
              >
                <span>Transfers</span>
              </Link>
              <Link
                to="/sightseeing"
                className={cn(
                  "text-white hover:text-blue-200 cursor-pointer flex items-center py-4",
                  location.pathname === "/sightseeing"
                    ? "font-semibold border-b-2 border-white"
                    : "",
                )}
              >
                <span>Sightseeing</span>
              </Link>
              <Link
                to="/sports-events"
                className={cn(
                  "text-white hover:text-blue-200 cursor-pointer py-4 flex items-center",
                  location.pathname === "/sports-events"
                    ? "font-semibold border-b-2 border-white"
                    : "",
                )}
              >
                <span>Sports & Events</span>
              </Link>
            </nav>

            {/* Language and Currency */}
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <button className="text-white hover:text-blue-200 cursor-pointer flex items-center space-x-1">
                <span>🌐</span>
                <span>English (UK)</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="text-white hover:text-blue-200 cursor-pointer flex items-center space-x-1"
                >
                  <span>
                    {selectedCurrency.symbol} {selectedCurrency.code}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showCurrencyDropdown && (
                  <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 w-48 max-h-60 overflow-y-auto">
                    {currencies.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => {
                          setSelectedCurrency(currency);
                          setShowCurrencyDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-900 flex items-center justify-between"
                      >
                        <span>{currency.name}</span>
                        <span className="font-medium">
                          {currency.symbol} {currency.code}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-2 bg-blue-600 rounded-full px-2 md:px-3 py-2 hover:bg-blue-800">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-900" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      Account
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate("/account")}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/bookings")}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      My Bookings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/payment-methods")}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payment Methods
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={handleSignIn}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-medium rounded-md px-4 py-2 text-sm"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t border-blue-600">
            <div className="flex flex-col space-y-3 pt-4">
              <Link
                to="/flights"
                className="hover:text-blue-200 transition-colors py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                Flights
              </Link>
              <Link
                to="/hotels"
                className="hover:text-blue-200 transition-colors py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                Hotels
              </Link>
              <Link
                to="/transfers"
                className="hover:text-blue-200 transition-colors py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                Transfers
              </Link>
              <Link
                to="/sightseeing"
                className="hover:text-blue-200 transition-colors py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                Sightseeing
              </Link>
              <Link
                to="/sports-events"
                className="hover:text-blue-200 transition-colors py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                Sports & Events
              </Link>

              <div className="border-t border-blue-600 pt-3 mt-3">
                {isLoggedIn ? (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-white hover:text-blue-200 hover:bg-blue-600"
                      onClick={() => {
                        navigate("/account");
                        setShowMobileMenu(false);
                      }}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-white hover:text-blue-200 hover:bg-blue-600"
                      onClick={() => {
                        navigate("/bookings");
                        setShowMobileMenu(false);
                      }}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      My Bookings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-white hover:text-blue-200 hover:bg-blue-600"
                      onClick={() => {
                        handleSignOut();
                        setShowMobileMenu(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-white text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        handleSignIn();
                        setShowMobileMenu(false);
                      }}
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
