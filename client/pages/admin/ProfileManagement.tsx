import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  Passport,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Globe,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

// Admin Profile API service
const adminProfileAPI = {
  baseURL: "/api/admin/profiles", // Assuming admin endpoints
  
  async fetchProfiles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    try {
      const response = await fetch(`${this.baseURL}?${queryString}`);
      return response.json();
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
      return { profiles: [], total: 0 };
    }
  },
  
  async fetchProfile(userId) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}`);
      return response.json();
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  },
  
  async updateProfile(userId, data) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return response.json();
    } catch (error) {
      console.error("Failed to update profile:", error);
      return null;
    }
  },
  
  async deleteProfile(userId) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}`, {
        method: "DELETE"
      });
      return response.json();
    } catch (error) {
      console.error("Failed to delete profile:", error);
      return null;
    }
  },
  
  async fetchTravelers(userId) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}/travelers`);
      return response.json();
    } catch (error) {
      console.error("Failed to fetch travelers:", error);
      return { travelers: [] };
    }
  },
  
  async fetchPaymentMethods(userId) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}/payment-methods`);
      return response.json();
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      return { paymentMethods: [] };
    }
  },
  
  async fetchBookingHistory(userId) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}/bookings`);
      return response.json();
    } catch (error) {
      console.error("Failed to fetch booking history:", error);
      return { bookings: [] };
    }
  },
  
  async exportProfileData(userId) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}/export`);
      return response.blob();
    } catch (error) {
      console.error("Failed to export profile data:", error);
      return null;
    }
  }
};

export default function ProfileManagement() {
  const [profiles, setProfiles] = useState([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileDetails, setProfileDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Profile details tabs
  const [activeTab, setActiveTab] = useState("profile");
  const [travelers, setTravelers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);

  useEffect(() => {
    loadProfiles();
  }, [searchQuery, statusFilter, countryFilter, currentPage, pageSize]);
  
  const loadProfiles = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
        country: countryFilter !== "all" ? countryFilter : undefined,
        page: currentPage,
        limit: pageSize,
      };
      
      const response = await adminProfileAPI.fetchProfiles(params);
      setProfiles(response.profiles || []);
      setTotalProfiles(response.total || 0);
    } catch (error) {
      console.error("Failed to load profiles:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewProfile = async (profile) => {
    setSelectedProfile(profile);
    setLoadingDetails(true);
    setShowProfileModal(true);
    
    try {
      const [profileDetails, travelersRes, paymentsRes, bookingsRes] = await Promise.all([
        adminProfileAPI.fetchProfile(profile.id),
        adminProfileAPI.fetchTravelers(profile.id),
        adminProfileAPI.fetchPaymentMethods(profile.id),
        adminProfileAPI.fetchBookingHistory(profile.id)
      ]);
      
      setProfileDetails(profileDetails);
      setTravelers(travelersRes.travelers || []);
      setPaymentMethods(paymentsRes.paymentMethods || []);
      setBookingHistory(bookingsRes.bookings || []);
    } catch (error) {
      console.error("Failed to load profile details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  const handleExportProfile = async (profile) => {
    try {
      const blob = await adminProfileAPI.exportProfileData(profile.id);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profile-${profile.email}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to export profile:", error);
    }
  };
  
  const getStatusBadge = (profile) => {
    if (!profile.email_verified) {
      return <Badge variant="destructive">Unverified</Badge>;
    }
    if (profile.status === "active") {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">{profile.status}</Badge>;
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const totalPages = Math.ceil(totalProfiles / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Management</h1>
          <p className="text-muted-foreground">
            Manage customer profiles, travelers, and associated data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadProfiles} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProfiles.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Profiles</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.filter(p => p.email_verified).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.filter(p => {
                const lastLogin = new Date(p.updated_at);
                const today = new Date();
                return lastLogin.toDateString() === today.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Travelers</CardTitle>
            <Passport className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.reduce((sum, p) => sum + (p.travelers_count || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-48">
              <Label htmlFor="country">Country</Label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="IN">India</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AE">UAE</SelectItem>
                  <SelectItem value="SG">Singapore</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profiles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Profiles ({totalProfiles})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading profiles...
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Travelers</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {profile.full_name || `${profile.first_name} ${profile.last_name}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {profile.id}
                          </p>
                          {profile.nationality_iso2 && (
                            <Badge variant="outline" className="text-xs">
                              {profile.nationality_iso2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="w-3 h-3 mr-1" />
                            {profile.email}
                          </div>
                          {profile.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="w-3 h-3 mr-1" />
                              {profile.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(profile)}
                          {profile.email_verified && (
                            <div className="flex items-center text-xs text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-center">
                          <Badge variant="secondary">
                            {profile.travelers_count || 0}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(profile.updated_at)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProfile(profile)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportProfile(profile)}>
                              <Download className="mr-2 h-4 w-4" />
                              Export Data
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Profile
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalProfiles)} of {totalProfiles} profiles
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Profile Details Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Profile Details: {selectedProfile?.full_name || `${selectedProfile?.first_name} ${selectedProfile?.last_name}`}
            </DialogTitle>
            <DialogDescription>
              Comprehensive view of customer profile and associated data
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading profile details...
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="travelers">Travelers ({travelers.length})</TabsTrigger>
                <TabsTrigger value="payments">Payment Methods ({paymentMethods.length})</TabsTrigger>
                <TabsTrigger value="bookings">Bookings ({bookingHistory.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-4">
                {profileDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Personal Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div><strong>Name:</strong> {profileDetails.full_name || `${profileDetails.first_name} ${profileDetails.last_name}`}</div>
                        <div><strong>Email:</strong> {profileDetails.email}</div>
                        <div><strong>Phone:</strong> {profileDetails.phone || 'Not provided'}</div>
                        <div><strong>Date of Birth:</strong> {profileDetails.dob ? formatDate(profileDetails.dob) : 'Not provided'}</div>
                        <div><strong>Gender:</strong> {profileDetails.gender || 'Not specified'}</div>
                        <div><strong>Nationality:</strong> {profileDetails.nationality_iso2 || 'Not specified'}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Account Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div><strong>Email Verified:</strong> {profileDetails.email_verified ? '✅ Yes' : '❌ No'}</div>
                        <div><strong>Phone Verified:</strong> {profileDetails.phone_verified ? '✅ Yes' : '❌ No'}</div>
                        <div><strong>Account Created:</strong> {formatDate(profileDetails.created_at)}</div>
                        <div><strong>Last Updated:</strong> {formatDate(profileDetails.updated_at)}</div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="travelers" className="space-y-4">
                {travelers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No saved travelers found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {travelers.map((traveler) => (
                      <Card key={traveler.id}>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            {traveler.first_name} {traveler.last_name}
                            {traveler.is_primary && (
                              <Badge variant="default">Primary</Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div><strong>DOB:</strong> {formatDate(traveler.dob)}</div>
                          <div><strong>Gender:</strong> {traveler.gender}</div>
                          <div><strong>Nationality:</strong> {traveler.nationality_iso2}</div>
                          <div><strong>Relationship:</strong> {traveler.relationship}</div>
                          {traveler.frequent_flyer_number && (
                            <div><strong>Frequent Flyer:</strong> {traveler.frequent_flyer_number}</div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="payments" className="space-y-4">
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No payment methods found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <Card key={method.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <CreditCard className="w-8 h-8 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {method.brand} •••• {method.last4}
                                  {method.is_default && (
                                    <Badge variant="secondary" className="ml-2">Default</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Expires {method.exp_month}/{method.exp_year}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Added {formatDate(method.created_at)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="bookings" className="space-y-4">
                {bookingHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No booking history found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookingHistory.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {booking.booking_ref} - {booking.module.toUpperCase()}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {booking.total_amount && (
                                  <span>{booking.currency} {booking.total_amount} • </span>
                                )}
                                {formatDate(booking.created_at)}
                              </div>
                            </div>
                            <Badge 
                              variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
