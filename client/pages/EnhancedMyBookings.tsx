import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plane,
  Hotel,
  Camera,
  Car,
  Package,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Calendar,
  MapPin,
  Users,
  Mail,
  Phone,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatAppDate,
  formatAppDateWithDay,
  calculateNights,
  getRelativeTime,
} from "@/utils/dateUtils";
import {
  accountService,
  type BookingListItem,
  type BookingDetail,
  type AccountOverview,
} from "@/services/accountService";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function EnhancedMyBookings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { formatPrice } = useCurrency();

  // State management
  const [accountOverview, setAccountOverview] =
    useState<AccountOverview | null>(null);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState(
    searchParams.get("module") || "all",
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");

  // Detail modal state
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Expandable sections state
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(
    new Set(),
  );

  // Module definitions with proper icons and colors
  const modules = [
    {
      id: "all",
      name: "All Bookings",
      icon: CheckCircle,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      id: "flight",
      name: "Flights",
      icon: Plane,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "hotel",
      name: "Hotels",
      icon: Hotel,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: "package",
      name: "Packages",
      icon: Package,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
    {
      id: "sightseeing",
      name: "Sightseeing",
      icon: Camera,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      id: "transfer",
      name: "Transfers",
      icon: Car,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  // Load data on component mount and when filters change
  useEffect(() => {
    loadAccountData();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [selectedModule, statusFilter, sortBy]);

  // Update URL when module filter changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (selectedModule !== "all") {
      params.set("module", selectedModule);
    } else {
      params.delete("module");
    }
    setSearchParams(params, { replace: true });
  }, [selectedModule, searchParams, setSearchParams]);

  const loadAccountData = async () => {
    try {
      const overview = await accountService.getAccountOverview();
      setAccountOverview(overview);
    } catch (err) {
      console.error("Failed to load account overview:", err);
      setError("Failed to load account information");
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const bookingsData = await accountService.getBookings(selectedModule);

      // Apply status filter
      let filteredBookings = bookingsData;
      if (statusFilter !== "all") {
        filteredBookings = bookingsData.filter(
          (b) => b.status === statusFilter,
        );
      }

      // Apply sorting
      filteredBookings.sort((a, b) => {
        switch (sortBy) {
          case "date_desc":
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          case "date_asc":
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          case "amount_desc":
            return b.amount - a.amount;
          case "amount_asc":
            return a.amount - b.amount;
          case "ref_asc":
            return a.booking_ref.localeCompare(b.booking_ref);
          default:
            return 0;
        }
      });

      setBookings(filteredBookings);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on search query and URL booking parameter
  const filteredBookings = bookings.filter((booking) => {
    // Check for specific booking parameter first
    const specificBooking = searchParams.get("booking");
    if (specificBooking) {
      return booking.booking_ref === specificBooking;
    }

    // If no specific booking, apply search query filter
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      booking.booking_ref.toLowerCase().includes(query) ||
      booking.title.toLowerCase().includes(query) ||
      booking.module.toLowerCase().includes(query) ||
      booking.status.toLowerCase().includes(query)
    );
  });

  // Handle booking detail view
  const handleViewDetails = async (bookingRef: string) => {
    setDetailLoading(true);
    setShowDetailModal(true);

    try {
      const detail = await accountService.getBookingDetail(bookingRef);
      setSelectedBooking(detail);
    } catch (err) {
      console.error("Failed to load booking details:", err);
      setError("Failed to load booking details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle download actions
  const handleDownload = async (
    bookingRef: string,
    type: "ticket" | "invoice",
  ) => {
    try {
      let downloadUrl: string;

      if (type === "ticket") {
        downloadUrl = await accountService.downloadTicket(bookingRef);
      } else {
        downloadUrl = await accountService.downloadInvoice(bookingRef);
      }

      // Open download in new tab
      window.open(downloadUrl, "_blank");
    } catch (err) {
      console.error(`Failed to download ${type}:`, err);
      setError(`Failed to download ${type}`);
    }
  };

  // Toggle expanded booking
  const toggleExpanded = (bookingRef: string) => {
    const newExpanded = new Set(expandedBookings);
    if (newExpanded.has(bookingRef)) {
      newExpanded.delete(bookingRef);
    } else {
      newExpanded.add(bookingRef);
    }
    setExpandedBookings(newExpanded);
  };

  // Get module info
  const getModuleInfo = (moduleId: string) => {
    return modules.find((m) => m.id === moduleId) || modules[0];
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout showSearch={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header with breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <Link to="/account" className="hover:text-blue-600">
                  My account
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-400">Travel activity</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-blue-600 font-medium">
                  Trips & bookings
                </span>
              </nav>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    My Bookings
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage your travel bookings and download tickets
                  </p>
                </div>

                {accountOverview && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {accountOverview.total_bookings}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by booking reference, destination, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Module Filter */}
                <Select
                  value={selectedModule}
                  onValueChange={setSelectedModule}
                >
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => {
                      const IconComponent = module.icon;
                      return (
                        <SelectItem key={module.id} value={module.id}>
                          <div className="flex items-center space-x-2">
                            <IconComponent
                              className={cn("w-4 h-4", module.color)}
                            />
                            <span>{module.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">Latest First</SelectItem>
                    <SelectItem value="date_asc">Oldest First</SelectItem>
                    <SelectItem value="amount_desc">Highest Amount</SelectItem>
                    <SelectItem value="amount_asc">Lowest Amount</SelectItem>
                    <SelectItem value="ref_asc">Reference A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active filters summary */}
              {(selectedModule !== "all" ||
                statusFilter !== "all" ||
                searchQuery) && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {selectedModule !== "all" && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {getModuleInfo(selectedModule).name}
                      <button
                        onClick={() => setSelectedModule("all")}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      Status: {statusFilter}
                      <button
                        onClick={() => setStatusFilter("all")}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      Search: {searchQuery}
                      <button
                        onClick={() => setSearchQuery("")}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedModule("all");
                      setStatusFilter("all");
                      setSearchQuery("");
                    }}
                    className="text-blue-600"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Banner */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="ml-auto text-red-600"
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading your bookings...</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && filteredBookings.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  {selectedModule === "all" ? (
                    <CheckCircle className="w-12 h-12 text-gray-400" />
                  ) : (
                    React.createElement(getModuleInfo(selectedModule).icon, {
                      className: "w-12 h-12 text-gray-400",
                    })
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery
                    ? "No bookings found"
                    : `No ${selectedModule === "all" ? "" : selectedModule} bookings yet`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery
                    ? "Try adjusting your search criteria or filters"
                    : "Start your journey by booking your first trip"}
                </p>
                {!searchQuery && (
                  <Link to="/flights">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plane className="w-4 h-4 mr-2" />
                      Search Flights
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bookings List */}
          {!loading && filteredBookings.length > 0 && (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const moduleInfo = getModuleInfo(booking.module);
                const ModuleIcon = moduleInfo.icon;
                const isExpanded = expandedBookings.has(booking.booking_ref);

                return (
                  <Card
                    key={booking.booking_ref}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-0">
                      {/* Main booking row */}
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Module Icon */}
                            <div
                              className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center",
                                moduleInfo.bgColor,
                              )}
                            >
                              <ModuleIcon
                                className={cn("w-6 h-6", moduleInfo.color)}
                              />
                            </div>

                            {/* Booking Info */}
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {booking.title}
                                </h3>
                                {getStatusBadge(booking.status)}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center space-x-1">
                                  <FileText className="w-4 h-4" />
                                  <span className="font-mono">
                                    {booking.booking_ref}
                                  </span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {formatAppDateWithDay(booking.date)}
                                  </span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <CreditCard className="w-4 h-4" />
                                  <span className="font-semibold">
                                    {formatPrice(booking.amount)}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleViewDetails(booking.booking_ref)
                              }
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownload(booking.booking_ref, "ticket")
                              }
                            >
                              <Download className="w-4 h-4 mr-2" />
                              {booking.module === "flight"
                                ? "Ticket"
                                : booking.module === "hotel"
                                ? "Voucher"
                                : booking.module === "package"
                                ? "Package"
                                : "Document"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownload(booking.booking_ref, "invoice")
                              }
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Invoice
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toggleExpanded(booking.booking_ref)
                              }
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">
                                  Booking Details
                                </h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p>
                                    Reference:{" "}
                                    <span className="font-mono">
                                      {booking.booking_ref}
                                    </span>
                                  </p>
                                  <p>Booked: {formatAppDate(booking.date)}</p>
                                  <p>Amount: {formatPrice(booking.amount)}</p>
                                  <p>Status: {booking.status}</p>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">
                                  Payment Info
                                </h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p>
                                    Payment ID:{" "}
                                    <span className="font-mono text-xs">
                                      {booking.payment_id}
                                    </span>
                                  </p>
                                  <p>Method: Credit Card</p>
                                  <p>Currency: INR</p>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">
                                  Quick Actions
                                </h4>
                                <div className="space-y-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleViewDetails(booking.booking_ref)
                                    }
                                    className="w-full justify-start"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Full Details
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      navigate(
                                        `/support?booking=${booking.booking_ref}`,
                                      )
                                    }
                                    className="w-full justify-start"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Get Support
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Results Summary */}
          {!loading && filteredBookings.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-600">
              Showing {filteredBookings.length} of {bookings.length} bookings
              {selectedModule !== "all" &&
                ` in ${getModuleInfo(selectedModule).name}`}
            </div>
          )}
        </div>

        {/* Booking Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Complete information for booking {selectedBooking?.booking_ref}
              </DialogDescription>
            </DialogHeader>

            {detailLoading ? (
              <div className="py-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p>Loading booking details...</p>
              </div>
            ) : selectedBooking ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedBooking.booking_ref}
                    </h3>
                    <p className="text-gray-600">
                      Booked on{" "}
                      {formatAppDateWithDay(selectedBooking.booked_on)}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(selectedBooking.status)}
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      {formatPrice(selectedBooking.total_paid)}
                    </p>
                  </div>
                </div>

                {/* Module-specific details */}
                {selectedBooking.module === "flight" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Plane className="w-5 h-5 mr-2 text-blue-600" />
                        Flight Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Route:</strong>{" "}
                          {selectedBooking.flight_details.from_iata} →{" "}
                          {selectedBooking.flight_details.to_iata}
                        </p>
                        <p>
                          <strong>Flight:</strong>{" "}
                          {selectedBooking.flight_details.carrier}{" "}
                          {selectedBooking.flight_details.flight_no}
                        </p>
                        <p>
                          <strong>Departure:</strong>{" "}
                          {formatAppDateWithDay(
                            selectedBooking.flight_details.dep_at,
                          )}
                        </p>
                        <p>
                          <strong>Arrival:</strong>{" "}
                          {formatAppDateWithDay(
                            selectedBooking.flight_details.arr_at,
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-600" />
                        Passengers
                      </h4>
                      {selectedBooking.passengers.map((passenger, index) => (
                        <div key={index} className="space-y-1 text-sm mb-3">
                          <p>
                            <strong>
                              {passenger.title} {passenger.name}
                            </strong>
                          </p>
                          <p className="text-gray-600">{passenger.type}</p>
                          <p className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {passenger.email}
                          </p>
                          <p className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {passenger.phone}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBooking.module === "hotel" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Hotel className="w-5 h-5 mr-2 text-green-600" />
                        Hotel Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Hotel:</strong>{" "}
                          {selectedBooking.hotel_details.hotel_name}
                        </p>
                        <p>
                          <strong>City:</strong>{" "}
                          {selectedBooking.hotel_details.city}
                        </p>
                        <p>
                          <strong>Check-in:</strong>{" "}
                          {formatAppDate(
                            selectedBooking.hotel_details.checkin_at,
                          )}
                        </p>
                        <p>
                          <strong>Check-out:</strong>{" "}
                          {formatAppDate(
                            selectedBooking.hotel_details.checkout_at,
                          )}
                        </p>
                        <p>
                          <strong>Nights:</strong>{" "}
                          {calculateNights(
                            selectedBooking.hotel_details.checkin_at,
                            selectedBooking.hotel_details.checkout_at,
                          )}
                        </p>
                        <p>
                          <strong>Guests:</strong>{" "}
                          {selectedBooking.hotel_details.guests_adults}{" "}
                          adult(s),{" "}
                          {selectedBooking.hotel_details.guests_children}{" "}
                          child(ren)
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-green-600" />
                        Guest Details
                      </h4>
                      {selectedBooking.guests.map((guest, index) => (
                        <div key={index} className="space-y-1 text-sm mb-3">
                          <p>
                            <strong>
                              {guest.title} {guest.name}
                            </strong>
                          </p>
                          <p className="text-gray-600">{guest.type}</p>
                          <p className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {guest.email}
                          </p>
                          <p className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {guest.phone}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBooking.module === "package" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Package className="w-5 h-5 mr-2 text-teal-600" />
                        Package Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Package:</strong> {selectedBooking.package_details.package_name}
                        </p>
                        <p>
                          <strong>Destination:</strong> {selectedBooking.package_details.destination}
                        </p>
                        <p>
                          <strong>Duration:</strong> {selectedBooking.package_details.duration}
                        </p>
                        <p>
                          <strong>Travel Dates:</strong> {formatAppDate(selectedBooking.package_details.travel_dates.start_date)} - {formatAppDate(selectedBooking.package_details.travel_dates.end_date)}
                        </p>
                        <p>
                          <strong>Includes:</strong> {selectedBooking.package_details.includes.join(" + ")}
                        </p>
                        <p>
                          <strong>Travelers:</strong> {selectedBooking.package_details.travelers_count} Adult{selectedBooking.package_details.travelers_count > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-teal-600" />
                        Traveler Details
                      </h4>
                      {selectedBooking.travelers.map((traveler, index) => (
                        <div key={index} className="space-y-1 text-sm mb-3">
                          <p>
                            <strong>{traveler.title} {traveler.name}</strong>
                          </p>
                          <p className="text-gray-600">{traveler.type} {index + 1}</p>
                          <p className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {traveler.email}
                          </p>
                          <p className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {traveler.phone}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-gray-600" />
                    Documents & Downloads
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ticket/Voucher */}
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">
                        {selectedBooking.module === "flight"
                          ? "E-Ticket"
                          : selectedBooking.module === "hotel"
                          ? "Hotel Voucher"
                          : selectedBooking.module === "package"
                          ? "Package Details"
                          : "Booking Voucher"}
                      </h5>
                      <p className="text-sm text-gray-600 mb-3">
                        {selectedBooking.module === "flight"
                          ? `Ticket No: ${selectedBooking.ticket.ticket_no}`
                          : selectedBooking.module === "hotel"
                          ? `Voucher No: ${selectedBooking.voucher.voucher_no}`
                          : selectedBooking.module === "package"
                          ? `Voucher No: ${selectedBooking.package_voucher.voucher_no}`
                          : `Booking Ref: ${selectedBooking.booking_ref}`}
                      </p>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleDownload(selectedBooking.booking_ref, "ticket")
                        }
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download{" "}
                        {selectedBooking.module === "flight"
                          ? "Ticket"
                          : selectedBooking.module === "hotel"
                          ? "Voucher"
                          : selectedBooking.module === "package"
                          ? "Package Details"
                          : "Document"}
                      </Button>
                    </div>

                    {/* Invoice */}
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Invoice</h5>
                      <p className="text-sm text-gray-600 mb-3">
                        Invoice No: {selectedBooking.invoice.invoice_no}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleDownload(selectedBooking.booking_ref, "invoice")
                        }
                        className="w-full"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Download Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-600">
                <AlertCircle className="w-8 h-8 mx-auto mb-4" />
                <p>Failed to load booking details</p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </Button>
              {selectedBooking && (
                <Button
                  onClick={() =>
                    navigate(`/support?booking=${selectedBooking.booking_ref}`)
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Support
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
