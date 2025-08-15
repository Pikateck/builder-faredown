import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Download, 
  Filter, 
  Search, 
  TrendingUp, 
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface BookingReport {
  booking_id: string;
  created_at: string;
  module: string;
  supplier: string;
  user_id: string;
  origin: string;
  destination: string;
  class: string;
  hotel_category: string;
  service_type: string;
  base_net_amount: number;
  applied_markup_value: number;
  applied_markup_pct: number;
  promo_discount_value: number;
  bargain_discount_value: number;
  gross_before_bargain: number;
  gross_after_bargain: number;
  final_payable: number;
  never_loss_pass: boolean;
  booking_reference: string;
  payment_reference: string;
  booking_status: string;
  markup_rule_name: string;
  promo_code: string;
}

interface AnalyticsData {
  module: string;
  total_bookings: number;
  total_net: number;
  total_markup: number;
  total_promo_discounts: number;
  total_bargain_discounts: number;
  total_revenue: number;
  avg_markup_pct: number;
  bookings_with_promo: number;
  bookings_with_bargain: number;
  never_loss_triggers: number;
}

const BookingReports: React.FC = () => {
  const [bookings, setBookings] = useState<BookingReport[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);

  useEffect(() => {
    fetchReports();
    fetchAnalytics();
  }, [moduleFilter, dateRange, currentPage]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });

      if (moduleFilter !== 'all') params.append('module', moduleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await apiClient.get(`/api/admin/reports/bookings?${params}`);
      
      if (response.ok) {
        setBookings(response.data.data || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalBookings(response.data.pagination?.total_items || 0);
      }
    } catch (error) {
      console.error('Error fetching booking reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      if (moduleFilter !== 'all') params.append('module', moduleFilter);

      const response = await apiClient.get(`/api/pricing/analytics?${params}`);
      
      if (response.ok) {
        setAnalytics(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReports();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModuleBadgeColor = (module: string) => {
    const colors = {
      air: 'bg-blue-100 text-blue-800',
      hotel: 'bg-green-100 text-green-800',
      sightseeing: 'bg-purple-100 text-purple-800',
      transfer: 'bg-orange-100 text-orange-800'
    };
    return colors[module as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const exportToCSV = () => {
    const headers = [
      'Booking ID', 'Date', 'Module', 'Origin', 'Destination', 'Base Net', 
      'Markup', 'Promo Discount', 'Bargain Discount', 'Final Amount', 
      'Markup Rule', 'Promo Code', 'Never Loss'
    ];

    const csvData = bookings.map(booking => [
      booking.booking_reference,
      formatDate(booking.created_at),
      booking.module.toUpperCase(),
      booking.origin || '-',
      booking.destination || '-',
      booking.base_net_amount,
      booking.applied_markup_value,
      booking.promo_discount_value,
      booking.bargain_discount_value,
      booking.final_payable,
      booking.markup_rule_name || '-',
      booking.promo_code || '-',
      booking.never_loss_pass ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-reports-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalAnalytics = analytics.reduce((acc, item) => ({
    total_bookings: acc.total_bookings + item.total_bookings,
    total_revenue: acc.total_revenue + item.total_revenue,
    total_markup: acc.total_markup + item.total_markup,
    total_promo_discounts: acc.total_promo_discounts + item.total_promo_discounts,
    total_bargain_discounts: acc.total_bargain_discounts + item.total_bargain_discounts,
    bookings_with_promo: acc.bookings_with_promo + item.bookings_with_promo,
    bookings_with_bargain: acc.bookings_with_bargain + item.bookings_with_bargain,
    never_loss_triggers: acc.never_loss_triggers + item.never_loss_triggers
  }), {
    total_bookings: 0,
    total_revenue: 0,
    total_markup: 0,
    total_promo_discounts: 0,
    total_bargain_discounts: 0,
    bookings_with_promo: 0,
    bookings_with_bargain: 0,
    never_loss_triggers: 0
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Booking & Pricing Reports</h1>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalytics.total_bookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalAnalytics.bookings_with_promo} with promo codes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAnalytics.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalAnalytics.total_markup)} from markups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bargain Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalytics.bookings_with_bargain}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalAnalytics.total_bargain_discounts)} total discounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Never Loss Triggers</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalAnalytics.never_loss_triggers}
            </div>
            <p className="text-xs text-muted-foreground">
              Safety adjustments made
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Module Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Module</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.map((module) => (
              <div key={module.module} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getModuleBadgeColor(module.module)}>
                    {module.module.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {module.total_bookings} bookings
                  </span>
                </div>
                <div className="text-lg font-semibold">
                  {formatCurrency(module.total_revenue)}
                </div>
                <div className="text-sm text-gray-600">
                  Avg Markup: {module.avg_markup_pct?.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Promos: {module.bookings_with_promo} | 
                  Bargains: {module.bookings_with_bargain}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search booking reference, user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="air">Air</SelectItem>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="sightseeing">Sightseeing</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />

            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />

            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Details ({totalBookings.toLocaleString()} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Booking</th>
                      <th className="text-left p-2">Module</th>
                      <th className="text-left p-2">Route</th>
                      <th className="text-left p-2">Financial</th>
                      <th className="text-left p-2">Markup Rule</th>
                      <th className="text-left p-2">Promo</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.booking_id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="font-medium">{booking.booking_reference}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(booking.created_at)}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge className={getModuleBadgeColor(booking.module)}>
                            {booking.module.toUpperCase()}
                          </Badge>
                          {booking.class && (
                            <div className="text-xs text-gray-500 mt-1">{booking.class}</div>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            {booking.origin || '-'} → {booking.destination || '-'}
                          </div>
                          {booking.hotel_category && (
                            <div className="text-xs text-gray-500">{booking.hotel_category}</div>
                          )}
                          {booking.service_type && (
                            <div className="text-xs text-gray-500">{booking.service_type}</div>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div>Net: {formatCurrency(booking.base_net_amount)}</div>
                            <div className="text-green-600">+{formatCurrency(booking.applied_markup_value)}</div>
                            {booking.promo_discount_value > 0 && (
                              <div className="text-blue-600">-{formatCurrency(booking.promo_discount_value)}</div>
                            )}
                            {booking.bargain_discount_value > 0 && (
                              <div className="text-orange-600">-{formatCurrency(booking.bargain_discount_value)}</div>
                            )}
                            <div className="font-semibold border-t pt-1">
                              {formatCurrency(booking.final_payable)}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">{booking.markup_rule_name || '-'}</div>
                          {booking.applied_markup_pct && (
                            <div className="text-xs text-gray-500">
                              {booking.applied_markup_pct.toFixed(1)}%
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          {booking.promo_code ? (
                            <Badge variant="secondary">{booking.promo_code}</Badge>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-col gap-1">
                            <Badge variant={booking.booking_status === 'confirmed' ? 'default' : 'secondary'}>
                              {booking.booking_status}
                            </Badge>
                            {booking.never_loss_pass ? (
                              <CheckCircle className="h-4 w-4 text-green-500" title="Normal processing" />
                            ) : (
                              <XCircle className="h-4 w-4 text-orange-500" title="Never-loss triggered" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingReports;
