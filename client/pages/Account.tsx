import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Profile from "./Profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoyaltyOverview from "@/components/loyalty/LoyaltyOverview";
import LoyaltyHistory from "@/components/loyalty/LoyaltyHistory";
import DigitalMembershipCard from "@/components/loyalty/DigitalMembershipCard";
import {
  Plane,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Download,
  Eye,
  ArrowLeft,
  MapPin,
  CreditCard,
  FileText,
  Settings,
  Bell,
  Shield,
  Gift,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Menu,
  LogOut,
  BookOpen,
  Award,
  Heart,
  CheckCircle,
  Plus,
  Hotel,
  Camera,
  Search,
  Filter,
  Users,
  HelpCircle,
  Scale,
  ChevronRight,
  Wallet,
  Globe,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function Account() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [userName] = useState("Zubin Aibara");

  // Determine if we're on a sub-page or the main account landing
  const isSubPage = location.pathname !== "/account" && location.pathname !== "/my-account";
  const currentSection = location.pathname.split("/")[2]; // e.g., "personal", "security", etc.

  // Search and collapsible functionality for bookings
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState({
    flights: false,
    hotels: false,
    sightseeing: false,
    transfers: false,
  });

  useEffect(() => {
    // Load bookings data (same as before)
    const savedBookings = JSON.parse(
      localStorage.getItem("faredownBookings") || "[]",
    );

    if (savedBookings.length === 0 || true) {
      const sampleBookings = [
        {
          type: "flight",
          bookingDetails: {
            bookingRef: "FD-FL-001",
            bookingDate: "2024-01-15",
            passengers: [
              {
                firstName: "John",
                lastName: "Doe",
                title: "Mr",
              },
            ],
            contactDetails: {
              email: "john@example.com",
              countryCode: "+91",
              phone: "9876543210",
            },
            currency: { symbol: "₹" },
            totalAmount: 45000,
          },
          flightDetails: {
            airline: "Air India",
            flightNumber: "AI-131",
          },
          paymentId: "pay_demo123456789",
        },
        {
          type: "hotel",
          bookingDetails: {
            bookingRef: "FD-HT-002",
            bookingDate: "2024-01-16",
            passengers: [
              {
                firstName: "John",
                lastName: "Doe",
                title: "Mr",
              },
            ],
            contactDetails: {
              email: "john@example.com",
              countryCode: "+91",
              phone: "9876543210",
            },
            currency: { symbol: "₹" },
            totalAmount: 12000,
          },
          paymentId: "pay_demo987654321",
        },
      ];
      setBookings(sampleBookings);
    } else {
      setBookings(savedBookings);
    }
  }, []);

  // Account landing page sections like Booking.com
  const accountSections = [
    {
      id: "payment",
      title: "Payment & Wallet",
      description: "Manage payment methods and wallet",
      icon: Wallet,
      href: "/account/payment",
      items: ["Rewards & Wallet", "Payment methods"],
      color: "blue",
    },
    {
      id: "account",
      title: "Manage account",
      description: "Personal details, Security settings, Other travelers",
      icon: User,
      href: "/account/personal",
      items: ["Personal details", "Security settings", "Other travelers"],
      color: "green",
    },
    {
      id: "preferences",
      title: "Preferences",
      description: "Customization and Email preferences",
      icon: Settings,
      href: "/account/preferences",
      items: ["Customization preferences", "Email preferences"],
      color: "purple",
    },
    {
      id: "activity",
      title: "Travel activity",
      description: "Trips & bookings, Saved lists, My reviews",
      icon: Plane,
      href: "/account/trips",
      items: ["Trips & bookings", "Saved lists", "My reviews"],
      color: "orange",
    },
    {
      id: "help",
      title: "Help & support",
      description: "Get help with your bookings and account",
      icon: HelpCircle,
      href: "/help",
      items: ["Contact Customer Service", "Using the platform", "Dispute resolution"],
      color: "indigo",
    },
    {
      id: "legal",
      title: "Legal & privacy",
      description: "Privacy & data, Content guidelines",
      icon: Scale,
      href: "/account/privacy",
      items: ["Privacy and data management", "Content guidelines"],
      color: "gray",
    },
  ];

  // Breadcrumb for sub-pages
  const getBreadcrumb = () => {
    const sectionMap = {
      personal: { title: "Personal details", parent: "Manage account" },
      security: { title: "Security settings", parent: "Manage account" },
      travelers: { title: "Other travelers", parent: "Manage account" },
      preferences: { title: "Customization preferences", parent: "Preferences" },
      payment: { title: "Payment methods", parent: "Payment & Wallet" },
      privacy: { title: "Privacy & data", parent: "Legal & privacy" },
      trips: { title: "Trips & bookings", parent: "Travel activity" },
    };

    return sectionMap[currentSection] || { title: "Account", parent: null };
  };

  const breadcrumb = getBreadcrumb();

  // Render the main account landing page
  const renderAccountLanding = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Hi, {userName}
                  </h1>
                  <p className="text-gray-600">Genius Level 2</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">You have 5 Genius rewards</p>
                <p className="text-sm text-blue-600 font-medium">Complete your first trip for Genius Level 2</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Bookings</p>
                  <p className="text-2xl font-bold text-blue-900">{bookings.length}</p>
                </div>
                <Plane className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Countries Visited</p>
                  <p className="text-2xl font-bold text-green-900">2</p>
                </div>
                <Globe className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Rewards Points</p>
                  <p className="text-2xl font-bold text-purple-900">1,250</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Member Since</p>
                  <p className="text-2xl font-bold text-orange-900">Dec 2024</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accountSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Link key={section.id} to={section.href}>
                <Card className={cn(
                  "h-full hover:shadow-lg transition-all duration-200 cursor-pointer group",
                  "hover:border-blue-300 hover:-translate-y-1"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        section.color === "blue" && "bg-blue-100",
                        section.color === "green" && "bg-green-100",
                        section.color === "purple" && "bg-purple-100",
                        section.color === "orange" && "bg-orange-100",
                        section.color === "indigo" && "bg-indigo-100",
                        section.color === "gray" && "bg-gray-100"
                      )}>
                        <IconComponent className={cn(
                          "w-6 h-6",
                          section.color === "blue" && "text-blue-600",
                          section.color === "green" && "text-green-600",
                          section.color === "purple" && "text-purple-600",
                          section.color === "orange" && "text-orange-600",
                          section.color === "indigo" && "text-indigo-600",
                          section.color === "gray" && "text-gray-600"
                        )} />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {section.description}
                    </p>
                    
                    <div className="space-y-1">
                      {section.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-500">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <Link to="/account/trips">
              <Button variant="outline" size="sm">
                View all trips
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {bookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookings.slice(0, 2).map((booking, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {booking.type === "flight" ? (
                          <Plane className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Hotel className="w-6 h-6 text-green-600" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {booking.type === "flight" ? "Flight Booking" : "Hotel Booking"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {booking.bookingDetails.bookingRef}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Confirmed
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Date: {new Date(booking.bookingDetails.bookingDate).toLocaleDateString()}</p>
                      <p>Amount: {booking.bookingDetails.currency.symbol}{booking.bookingDetails.totalAmount.toLocaleString()}</p>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No trips yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start your journey by booking your first trip
              </p>
              <Link to="/flights">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plane className="w-4 h-4 mr-2" />
                  Search Flights
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  // Render sub-page content
  const renderSubPage = () => {
    switch (currentSection) {
      case "personal":
      case "security":
      case "travelers":
      case "preferences":
      case "privacy":
        return <Profile standalone={false} initialTab={currentSection} />;
      case "payment":
        return <Profile standalone={false} initialTab="payments" />;
      case "trips":
        return renderTripsPage();
      default:
        return renderAccountLanding();
    }
  };

  // Trips page (modular bookings from original Account.tsx)
  const renderTripsPage = () => {
    // Filter bookings based on search query
    const filteredBookings = bookings.filter((booking) => {
      if (!searchQuery.trim()) return true;
      const lowercaseQuery = searchQuery.toLowerCase();
      const searchableFields = [
        booking.bookingDetails?.bookingRef || "",
        booking.bookingDetails?.passengers?.[0]?.firstName || "",
        booking.bookingDetails?.passengers?.[0]?.lastName || "",
        booking.bookingDetails?.contactDetails?.email || "",
        booking.flightDetails?.airline || "",
        booking.flightDetails?.flightNumber || "",
        booking.type || "flight",
      ];
      return searchableFields.some((field) =>
        field.toLowerCase().includes(lowercaseQuery),
      );
    });

    // Organize filtered bookings by modules
    const bookingsByModule = {
      flights: filteredBookings.filter((b) => b.type === "flight" || !b.type),
      hotels: filteredBookings.filter((b) => b.type === "hotel"),
      sightseeing: filteredBookings.filter((b) => b.type === "sightseeing"),
      transfers: filteredBookings.filter((b) => b.type === "transfer"),
    };

    const modules = [
      {
        id: "flights",
        name: "Flights",
        icon: Plane,
        color: "blue",
        bookings: bookingsByModule.flights,
        emptyMessage: "No flight bookings found",
        searchLink: "/flights",
      },
      {
        id: "hotels",
        name: "Hotels",
        icon: Hotel,
        color: "green",
        bookings: bookingsByModule.hotels,
        emptyMessage: "No hotel bookings found",
        searchLink: "/hotels",
      },
    ];

    return (
      <div className="space-y-6">
        {/* Header with search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {bookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start your journey by booking your first trip
            </p>
            <Link to="/flights">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plane className="w-4 h-4 mr-2" />
                Search Flights
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {modules.map((module) => {
              const ModuleIcon = module.icon;
              const moduleBookings = module.bookings;

              if (moduleBookings.length === 0) return null;

              return (
                <div key={module.id} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        module.color === "blue" ? "bg-blue-100" : "bg-green-100"
                      }`}
                    >
                      <ModuleIcon
                        className={`w-5 h-5 ${
                          module.color === "blue" ? "text-blue-600" : "text-green-600"
                        }`}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {module.name} ({moduleBookings.length})
                    </h3>
                  </div>

                  <div className="grid gap-4">
                    {moduleBookings.map((booking, index) => (
                      <Card
                        key={index}
                        className="overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <CardHeader
                          className={`bg-gradient-to-r ${
                            module.color === "blue"
                              ? "from-blue-50 to-blue-100"
                              : "from-green-50 to-green-100"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <CardTitle className="text-lg font-semibold text-gray-900">
                                {module.id === "flights" ? "Mumbai ⇄ Dubai" : "Hotel Booking"}
                              </CardTitle>
                              <p className="text-sm text-gray-600">
                                Booking Reference:{" "}
                                <span className="font-mono font-medium">
                                  {booking.bookingDetails?.bookingRef || "N/A"}
                                </span>
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800 border-green-200"
                              >
                                Confirmed
                              </Badge>
                              <p className="text-sm text-gray-600 mt-1">
                                Booked on{" "}
                                {new Date(booking.bookingDetails?.bookingDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Booking Details */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  {module.id === "flights" ? "Flight Details" : "Hotel Details"}
                                </h4>
                                {module.id === "flights" ? (
                                  <>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <MapPin className="w-4 h-4" />
                                      <span>BOM ⇄ DXB</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <Calendar className="w-4 h-4" />
                                      <span>Sat, Aug 3 • 10:15 - 13:45</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <Plane className="w-4 h-4" />
                                      <span>
                                        {booking.flightDetails?.airline || "Airlines"}{" "}
                                        {booking.flightDetails?.flightNumber || "FL-001"}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <MapPin className="w-4 h-4" />
                                      <span>Dubai Hotel</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <Calendar className="w-4 h-4" />
                                      <span>Check-in: Aug 3 • Check-out: Aug 10</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Passenger Details */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">
                                {module.id === "hotels" ? "Guest Details" : "Passengers"}
                              </h4>
                              <div className="space-y-2">
                                {booking.bookingDetails?.passengers?.map((passenger, pIndex) => (
                                  <div key={pIndex} className="text-sm">
                                    <div className="font-medium text-gray-900">
                                      {passenger.firstName} {passenger.lastName}
                                    </div>
                                    <div className="text-gray-600">
                                      Adult {pIndex + 1} • {passenger.title || "Not specified"}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-4">
                                <h5 className="font-medium text-gray-900 mb-1">Contact</h5>
                                <div className="text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Mail className="w-3 h-3 mr-1" />
                                    {booking.bookingDetails?.contactDetails?.email}
                                  </div>
                                  <div className="flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {booking.bookingDetails?.contactDetails?.countryCode}{" "}
                                    {booking.bookingDetails?.contactDetails?.phone}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Booking Summary */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Booking Summary</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total Paid</span>
                                  <span className="font-semibold text-gray-900">
                                    {booking.bookingDetails?.currency?.symbol || "₹"}
                                    {booking.bookingDetails?.totalAmount?.toLocaleString() || "0"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Payment ID</span>
                                  <span className="text-gray-900 font-mono text-xs">
                                    {booking.paymentId?.slice(0, 12) || "N/A"}...
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <Button variant="outline" size="sm" className="w-full">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View {module.id === "flights" ? "Ticket" : "Voucher"}
                                </Button>
                                <Button variant="outline" size="sm" className="w-full">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // If we're on a sub-page, show breadcrumb and sub-page content
  if (isSubPage) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Breadcrumb Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-4">
                <nav className="flex items-center space-x-2 text-sm text-gray-600">
                  <Link to="/account" className="hover:text-blue-600">
                    My account
                  </Link>
                  <ChevronRight className="w-4 h-4" />
                  {breadcrumb.parent && (
                    <>
                      <span>{breadcrumb.parent}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                  <span className="text-gray-900 font-medium">{breadcrumb.title}</span>
                </nav>
              </div>
            </div>
          </div>

          {/* Sub-page Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderSubPage()}
          </div>
        </div>
      </Layout>
    );
  }

  // Otherwise show the main account landing
  return <Layout>{renderAccountLanding()}</Layout>;
}
