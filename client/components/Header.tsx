import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold">Faredown</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/flights"
              className="hover:text-blue-200 transition-colors"
            >
              Flights
            </Link>
            <Link
              to="/hotels"
              className="hover:text-blue-200 transition-colors"
            >
              Hotels
            </Link>
            <Link to="/trips" className="hover:text-blue-200 transition-colors">
              My Trips
            </Link>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:text-blue-200 hover:bg-blue-600"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Account
                  </Button>
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
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  className="text-white hover:text-blue-200 hover:bg-blue-600"
                  onClick={handleSignIn}
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-700"
                  onClick={handleSignIn}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white hover:text-blue-200 hover:bg-blue-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-blue-600">
            <div className="flex flex-col space-y-3 pt-4">
              <Link
                to="/flights"
                className="hover:text-blue-200 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Flights
              </Link>
              <Link
                to="/hotels"
                className="hover:text-blue-200 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Hotels
              </Link>
              <Link
                to="/trips"
                className="hover:text-blue-200 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Trips
              </Link>

              <div className="border-t border-blue-600 pt-3 mt-3">
                {isLoggedIn ? (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-white hover:text-blue-200 hover:bg-blue-600"
                      onClick={() => {
                        navigate("/account");
                        setIsMobileMenuOpen(false);
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
                        setIsMobileMenuOpen(false);
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
                        setIsMobileMenuOpen(false);
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
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-white text-white hover:bg-white hover:text-blue-700"
                      onClick={() => {
                        handleSignIn();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Sign Up
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
