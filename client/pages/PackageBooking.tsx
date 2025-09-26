import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Calendar,
  CreditCard,
  Shield,
  CheckCircle,
  Info,
  User,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface GuestDetails {
  title: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
}

interface BookingData {
  package: any;
  departure: any;
  travelers: {
    adults: number;
    children: number;
  };
  bargainedPrice?: number;
  orderRef?: string;
  holdData?: any;
}

export default function PackageBooking() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { user, isAuthenticated } = useAuth();

  // Get booking data from navigation state
  const bookingData = location.state as BookingData;

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [primaryGuest, setPrimaryGuest] = useState<GuestDetails>({
    title: "Mr",
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: "",
  });
  const [additionalGuests, setAdditionalGuests] = useState<GuestDetails[]>([]);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");

  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData) {
      navigate(`/packages/${slug}`, { replace: true });
    }
  }, [bookingData, slug, navigate]);

  // Initialize additional guests based on traveler count
  useEffect(() => {
    if (bookingData) {
      const totalGuests = bookingData.travelers.adults + bookingData.travelers.children - 1; // -1 for primary guest
      const guests: GuestDetails[] = [];
      
      for (let i = 0; i < totalGuests; i++) {
        guests.push({
          title: "Mr",
          firstName: "",
          lastName: "",
        });
      }
      
      setAdditionalGuests(guests);
    }
  }, [bookingData]);

  const handleGuestChange = (index: number, field: keyof GuestDetails, value: string) => {
    if (index === -1) {
      // Primary guest
      setPrimaryGuest(prev => ({ ...prev, [field]: value }));
    } else {
      // Additional guest
      setAdditionalGuests(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    }
  };

  const calculateTotalPrice = () => {
    if (!bookingData) return 0;
    
    // Use bargained price if available, otherwise calculate normal price
    if (bookingData.bargainedPrice) {
      return bookingData.bargainedPrice;
    }
    
    const adultPrice = bookingData.departure.price_per_person * bookingData.travelers.adults;
    const childPrice = (bookingData.departure.child_price || bookingData.departure.price_per_person * 0.75) * bookingData.travelers.children;
    
    return adultPrice + childPrice;
  };

  const handleBooking = async () => {
    if (!bookingData || !agreeToTerms) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Validate required fields
      if (!primaryGuest.firstName || !primaryGuest.lastName || !primaryGuest.email) {
        setError("Please fill in all required fields for the primary guest");
        return;
      }
      
      // Prepare guest details
      const guestDetails = {
        primary_guest: primaryGuest,
        additional_guests: additionalGuests.filter(guest => guest.firstName && guest.lastName),
      };
      
      // Submit booking
      const response = await apiClient.post(`/packages/${slug}/book`, {
        departure_id: bookingData.departure.id,
        adults: bookingData.travelers.adults,
        children: bookingData.travelers.children,
        guest_details: guestDetails,
        bargain_session_id: bookingData.orderRef,
        special_requests: specialRequests,
      });
      
      if (response.success) {
        // Store module info for header navigation
        localStorage.setItem("lastBookingModule", "packages");

        // Navigate to confirmation page
        navigate("/booking-confirmation", {
          state: {
            bookingRef: response.data.booking_ref,
            bookingDetails: response.data,
            module: "packages",
          },
        });
      } else {
        setError(response.error || "Failed to create booking");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the booking");
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Booking Request</h2>
            <p className="text-gray-600 mb-6">Please return to the package details to start booking.</p>
            <Button onClick={() => navigate(`/packages/${slug}`)} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Package
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { package: pkg, departure, travelers } = bookingData;
  const totalPrice = calculateTotalPrice();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Package
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Summary */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Package Summary</h2>
                <div className="flex space-x-4">
                  <img
                    src={pkg.hero_image_url || "/placeholder.svg"}
                    alt={pkg.title}
                    className="w-24 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{pkg.title}</h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {pkg.region_name}
                      {pkg.country_name && ` • ${pkg.country_name}`}
                    </div>
                    <div className="flex items-center text-gray-600 mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {pkg.duration_days}D/{pkg.duration_nights}N
                    </div>
                    <div className="flex items-center text-gray-600 mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(parseISO(departure.departure_date), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Primary Guest Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Primary Guest Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Select value={primaryGuest.title} onValueChange={(value) => handleGuestChange(-1, "title", value)}>
                      <SelectTrigger className="border-2 border-[#003580] focus:ring-[#003580]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Ms">Ms</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={primaryGuest.firstName}
                      onChange={(e) => handleGuestChange(-1, "firstName", e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={primaryGuest.lastName}
                      onChange={(e) => handleGuestChange(-1, "lastName", e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={primaryGuest.email}
                      onChange={(e) => handleGuestChange(-1, "email", e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={primaryGuest.phone}
                      onChange={(e) => handleGuestChange(-1, "phone", e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={primaryGuest.nationality || ""}
                      onChange={(e) => handleGuestChange(-1, "nationality", e.target.value)}
                      placeholder="Enter nationality"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Guests */}
            {additionalGuests.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Additional Guests</h3>
                  {additionalGuests.map((guest, index) => (
                    <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium mb-3">Guest {index + 2}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Select value={guest.title} onValueChange={(value) => handleGuestChange(index, "title", value)}>
                            <SelectTrigger className="border-2 border-[#003580] focus:ring-[#003580]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr">Mr</SelectItem>
                              <SelectItem value="Mrs">Mrs</SelectItem>
                              <SelectItem value="Ms">Ms</SelectItem>
                              <SelectItem value="Dr">Dr</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>First Name</Label>
                          <Input
                            value={guest.firstName}
                            onChange={(e) => handleGuestChange(index, "firstName", e.target.value)}
                            placeholder="Enter first name"
                          />
                        </div>
                        
                        <div>
                          <Label>Last Name</Label>
                          <Input
                            value={guest.lastName}
                            onChange={(e) => handleGuestChange(index, "lastName", e.target.value)}
                            placeholder="Enter last name"
                          />
                        </div>
                        
                        <div>
                          <Label>Nationality</Label>
                          <Input
                            value={guest.nationality || ""}
                            onChange={(e) => handleGuestChange(index, "nationality", e.target.value)}
                            placeholder="Enter nationality"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Special Requests */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Special Requests</h3>
                <Label htmlFor="specialRequests">Any special requests or requirements?</Label>
                <textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Dietary requirements, accessibility needs, special occasions, etc."
                  className="w-full p-3 border border-gray-300 rounded-lg mt-2 min-h-[100px]"
                />
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the <a href="/terms-conditions" className="text-blue-600 hover:underline">Terms & Conditions</a> and <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Info className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
                
                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>Adults ({travelers.adults})</span>
                    <span>{formatPrice(departure.price_per_person * travelers.adults, departure.currency)}</span>
                  </div>
                  
                  {travelers.children > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Children ({travelers.children})</span>
                      <span>{formatPrice((departure.child_price || departure.price_per_person * 0.75) * travelers.children, departure.currency)}</span>
                    </div>
                  )}
                  
                  {bookingData.bargainedPrice && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Bargain Discount</span>
                      <span>-{formatPrice((departure.price_per_person * travelers.adults + (departure.child_price || departure.price_per_person * 0.75) * travelers.children) - bookingData.bargainedPrice, departure.currency)}</span>
                    </div>
                  )}
                  
                  <hr />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-blue-600">{formatPrice(totalPrice, departure.currency)}</span>
                  </div>
                </div>

                {/* Hold Information */}
                {bookingData.holdData?.isHeld && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center text-green-700 text-sm">
                      <Shield className="w-4 h-4 mr-2" />
                      <span>Price locked for 15 minutes</span>
                    </div>
                  </div>
                )}

                {/* Book Button */}
                <Button
                  onClick={handleBooking}
                  disabled={loading || !agreeToTerms}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Complete Booking
                    </>
                  )}
                </Button>

                {/* Security Info */}
                <div className="mt-4 text-xs text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    <span>Secure SSL encryption</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    <span>Instant confirmation</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    <span>24/7 customer support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
