import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Eye,
  FileText,
  Printer,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BookingDetail {
  id: string;
  booking_ref: string;
  customer_id: string;
  user_id: string;
  module: string; // hotels, flights, transfers, sightseeing, packages
  supplier: string;
  status: string; // pending, confirmed, completed, cancelled, refunded
  payment_status: string;
  created_at: string;
  updated_at: string;

  // Customer Details
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  pan_card?: string;

  // Booking Details
  origin?: string;
  destination?: string;
  check_in_date?: string;
  check_out_date?: string;
  travel_date?: string;
  property_name?: string;
  room_type?: string;
  nights?: number;
  guests_count?: number;

  // Pricing
  base_price: number;
  original_price: number;
  markup_amount: number;
  markup_percentage: number;
  taxes: number;
  fees: number;
  bargained_price?: number;
  discount_amount?: number;
  discount_percentage?: number;
  bargain_rounds?: number;
  promo_discount?: number;
  final_price: number;
  currency: string;

  // Special Info
  special_requests?: string;
  payment_method?: string;
  supplier_booking_ref?: string;

  // Bargain Info
  bargain_summary?: {
    basePrice: number;
    bargainedPrice: number;
    discountAmount: number;
    discountPercentage: number;
    rounds: number;
  };
}

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);

  const PAGE_SIZE = 15;

  useEffect(() => {
    fetchBookings();
  }, [searchTerm, moduleFilter, statusFilter, paymentStatusFilter, currentPage]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString(),
      });

      if (searchTerm) params.append("search", searchTerm);
      if (moduleFilter !== "all") params.append("module", moduleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (paymentStatusFilter !== "all")
        params.append("payment_status", paymentStatusFilter);

      const response = await apiClient.get(`/api/admin/bookings?${params}`);
      setBookings(response.data.bookings || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalBookings(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      confirmed: {
        variant: "default",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      pending: {
        variant: "secondary",
        icon: <Clock className="w-3 h-3 mr-1" />,
      },
      completed: {
        variant: "default",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      cancelled: {
        variant: "destructive",
        icon: <AlertCircle className="w-3 h-3 mr-1" />,
      },
      refunded: {
        variant: "outline",
        icon: <DollarSign className="w-3 h-3 mr-1" />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      hotels: "bg-blue-100 text-blue-800",
      flights: "bg-purple-100 text-purple-800",
      transfers: "bg-yellow-100 text-yellow-800",
      sightseeing: "bg-green-100 text-green-800",
      packages: "bg-orange-100 text-orange-800",
    };
    return colors[module] || "bg-gray-100 text-gray-800";
  };

  const handleViewDetails = (booking: BookingDetail) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const handleDownloadVoucher = (booking: BookingDetail) => {
    // Trigger voucher download
    window.open(`/api/bookings/${booking.id}/voucher/download`, "_blank");
  };

  const handleDownloadInvoice = (booking: BookingDetail) => {
    // Trigger invoice download
    window.open(`/api/bookings/${booking.id}/invoice/download`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Booking Management</h1>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Booking ID, Customer, Email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Module</label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="hotels">Hotels</SelectItem>
                  <SelectItem value="flights">Flights</SelectItem>
                  <SelectItem value="transfers">Transfers</SelectItem>
                  <SelectItem value="sightseeing">Sightseeing</SelectItem>
                  <SelectItem value="packages">Packages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Booking Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Payment Status
              </label>
              <Select
                value={paymentStatusFilter}
                onValueChange={setPaymentStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setModuleFilter("all");
                  setStatusFilter("all");
                  setPaymentStatusFilter("all");
                  setCurrentPage(1);
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Bookings ({totalBookings})
            <span className="text-sm font-normal text-gray-600 ml-2">
              Page {currentPage} of {totalPages}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Property/Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Original Price</TableHead>
                  <TableHead>Final Price</TableHead>
                  <TableHead>Bargain</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Loading bookings...
                    </TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono font-semibold text-xs">
                        {booking.booking_ref}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-semibold">{booking.guest_name}</div>
                          <div className="text-gray-600 text-xs">
                            {booking.guest_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getModuleColor(booking.module)}>
                          {booking.module.charAt(0).toUpperCase() +
                            booking.module.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {booking.property_name ||
                          booking.destination ||
                          "N/A"}
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.payment_status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {booking.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold">
                          {booking.currency} {booking.original_price.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">
                          (Markup: {booking.markup_percentage?.toFixed(1)}%)
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {booking.currency} {booking.final_price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {booking.bargain_rounds ? (
                          <Badge variant="outline" className="bg-yellow-50">
                            {booking.discount_percentage?.toFixed(1)}% off
                            <br />
                            ({booking.bargain_rounds} rounds)
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-500">No bargain</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(booking)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadVoucher(booking)}
                            title="Download Voucher"
                          >
                            <Printer className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(booking)}
                            title="Download Invoice"
                          >
                            <FileText className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(currentPage * PAGE_SIZE, totalBookings)} of{" "}
                {totalBookings} bookings
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum =
                      currentPage > 3
                        ? currentPage - 2 + i
                        : i + 1;
                    return (
                      pageNum <= totalPages && (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === currentPage ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              {selectedBooking?.booking_ref}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Customer Details */}
              <div>
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="text-xs text-gray-600">Customer Name</div>
                    <div className="font-semibold">
                      {selectedBooking.guest_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Email</div>
                    <div className="font-semibold">
                      {selectedBooking.guest_email}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Phone</div>
                    <div className="font-semibold">
                      {selectedBooking.guest_phone}
                    </div>
                  </div>
                  {selectedBooking.pan_card && (
                    <div>
                      <div className="text-xs text-gray-600">PAN Card</div>
                      <div className="font-semibold">
                        {selectedBooking.pan_card}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h3 className="font-semibold mb-3">Booking Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="text-xs text-gray-600">Module</div>
                    <Badge className={getModuleColor(selectedBooking.module)}>
                      {selectedBooking.module}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Status</div>
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                  {selectedBooking.property_name && (
                    <div>
                      <div className="text-xs text-gray-600">Property</div>
                      <div className="font-semibold">
                        {selectedBooking.property_name}
                      </div>
                    </div>
                  )}
                  {selectedBooking.destination && (
                    <div>
                      <div className="text-xs text-gray-600">Destination</div>
                      <div className="font-semibold">
                        {selectedBooking.destination}
                      </div>
                    </div>
                  )}
                  {selectedBooking.check_in_date && (
                    <div>
                      <div className="text-xs text-gray-600">Check-in</div>
                      <div className="font-semibold">
                        {selectedBooking.check_in_date}
                      </div>
                    </div>
                  )}
                  {selectedBooking.check_out_date && (
                    <div>
                      <div className="text-xs text-gray-600">Check-out</div>
                      <div className="font-semibold">
                        {selectedBooking.check_out_date}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Details */}
              <div>
                <h3 className="font-semibold mb-3">Pricing Details</h3>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span>Base Price</span>
                    <span className="font-semibold">
                      {selectedBooking.currency}{" "}
                      {selectedBooking.base_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Markup ({selectedBooking.markup_percentage?.toFixed(1)}%)
                    </span>
                    <span className="font-semibold">
                      +{selectedBooking.currency}{" "}
                      {selectedBooking.markup_amount.toFixed(2)}
                    </span>
                  </div>
                  {selectedBooking.bargain_rounds && (
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <div className="flex justify-between text-orange-600">
                        <span>Bargain Discount</span>
                        <span className="font-semibold">
                          -{selectedBooking.currency}{" "}
                          {selectedBooking.discount_amount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {selectedBooking.bargain_rounds} rounds, Original:{" "}
                        {selectedBooking.currency}{" "}
                        {selectedBooking.original_price.toFixed(2)}
                      </div>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between">
                    <span className="font-bold">Total Price</span>
                    <span className="font-bold text-lg text-green-600">
                      {selectedBooking.currency}{" "}
                      {selectedBooking.final_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div>
                  <h3 className="font-semibold mb-3">Special Requests</h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm">{selectedBooking.special_requests}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleDownloadVoucher(selectedBooking)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Voucher
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadInvoice(selectedBooking)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingManagement;
