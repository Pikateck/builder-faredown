import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  Calendar,
  Users,
  Star,
  ChevronDown,
  ArrowLeft,
  User,
  LogOut,
  CreditCard,
  CheckCircle,
  Info,
  X,
  Clock,
  Car,
  Plane,
  Hotel,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TransferBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Extract parameters from URL
  const transferId = searchParams.get('transferId');
  const rateKey = searchParams.get('rateKey');
  const vehicleCode = searchParams.get('vehicleCode');
  const price = searchParams.get('price');
  
  // States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    primaryGuest: {
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryCode: "+91"
    },
    flightDetails: {
      flightNumber: "",
      arrivalTime: "",
      airline: ""
    },
    specialRequests: "",
    promoCode: ""
  });

  // Mock transfer data (in real app, fetch based on transferId)
  const transfer = {
    id: transferId || "transfer_1",
    type: "Economy",
    vehicle: "Sedan",
    provider: "Mumbai Transfers Ltd",
    rating: 4.6,
    maxPassengers: 3,
    duration: "45 minutes",
    distance: "33 km",
    price: parseInt(price || "1200"),
    originalPrice: parseInt(price || "1200") + 300,
    features: ["Professional Driver", "Meet & Greet", "Free Waiting"],
    from: "Mumbai Airport (BOM)",
    to: "Hotel Taj Mahal Palace",
    pickupDate: "Dec 15, 2024",
    pickupTime: "10:00 AM",
    image: "/api/placeholder/120/80"
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserName("");
  };

  const handleInputChange = (section: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleBookTransfer = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate booking API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to confirmation page
      navigate('/transfer-confirmation', {
        state: {
          transfer,
          bookingData: formData,
          bookingRef: `TR${Date.now()}`
        }
      });
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold">
              faredown.com
            </Link>

            {/* Navigation Tabs */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/flights"
                className="flex items-center space-x-1 hover:text-blue-200 transition-colors"
              >
                <span>✈️</span>
                <span>Flights</span>
              </Link>
              <Link
                to="/hotels"
                className="flex items-center space-x-1 hover:text-blue-200 transition-colors"
              >
                <span>🏨</span>
                <span>Hotels</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-1 text-sm hover:text-blue-200">
                  <span>🌐</span>
                  <span>English (UK)</span>
                  <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>🇬🇧 English (UK)</DropdownMenuItem>
                  <DropdownMenuItem>🇺🇸 English (US)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-1 text-sm hover:text-blue-200">
                  <span>INR</span>
                  <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>₹ INR - Indian Rupee</DropdownMenuItem>
                  <DropdownMenuItem>$ USD - US Dollar</DropdownMenuItem>
                  <DropdownMenuItem>€ EUR - Euro</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center space-x-3">
                {isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center space-x-2 bg-blue-600 rounded-full px-3 py-2 hover:bg-blue-800">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-black">
                          {userName.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-white">{userName}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <User className="w-4 h-4 mr-2" />
                        My account
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white text-blue-700 border-white hover:bg-gray-100"
                    >
                      Register
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-800 text-white"
                    >
                      Sign in
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/transfer-results")}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Transfer Booking</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transfer Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Transfer Details</h2>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-20 h-16 rounded-lg overflow-hidden">
                  <img
                    src={transfer.image}
                    alt={transfer.vehicle}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {transfer.type} - {transfer.vehicle}
                    </h3>
                    <Badge className="bg-blue-100 text-blue-800">{transfer.type}</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>Up to {transfer.maxPassengers} passengers</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{transfer.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{transfer.rating}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium">{transfer.from}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">To:</span>
                  <span className="font-medium">{transfer.to}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-medium">{transfer.pickupDate} at {transfer.pickupTime}</span>
                </div>
              </div>
            </div>

            {/* Guest Details Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Primary Guest Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Select
                    value={formData.primaryGuest.title}
                    onValueChange={(value) => handleInputChange('primaryGuest', 'title', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <Input
                    value={formData.primaryGuest.firstName}
                    onChange={(e) => handleInputChange('primaryGuest', 'firstName', e.target.value)}
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <Input
                    value={formData.primaryGuest.lastName}
                    onChange={(e) => handleInputChange('primaryGuest', 'lastName', e.target.value)}
                    placeholder="Enter last name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.primaryGuest.email}
                    onChange={(e) => handleInputChange('primaryGuest', 'email', e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="flex">
                    <Select
                      value={formData.primaryGuest.countryCode}
                      onValueChange={(value) => handleInputChange('primaryGuest', 'countryCode', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+91">+91</SelectItem>
                        <SelectItem value="+1">+1</SelectItem>
                        <SelectItem value="+44">+44</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={formData.primaryGuest.phone}
                      onChange={(e) => handleInputChange('primaryGuest', 'phone', e.target.value)}
                      placeholder="Enter phone number"
                      className="ml-2 flex-1"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Details (Optional) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Flight Details (Optional)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flight Number
                  </label>
                  <Input
                    value={formData.flightDetails.flightNumber}
                    onChange={(e) => handleInputChange('flightDetails', 'flightNumber', e.target.value)}
                    placeholder="e.g., AI101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Time
                  </label>
                  <Input
                    type="time"
                    value={formData.flightDetails.arrivalTime}
                    onChange={(e) => handleInputChange('flightDetails', 'arrivalTime', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Airline
                  </label>
                  <Input
                    value={formData.flightDetails.airline}
                    onChange={(e) => handleInputChange('flightDetails', 'airline', e.target.value)}
                    placeholder="e.g., Air India"
                  />
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Requests</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Any special requirements, child seats, wheelchair access, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transfer Fare</span>
                  <span>₹{transfer.originalPrice}</span>
                </div>
                
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{transfer.originalPrice - transfer.price}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="font-bold text-xl text-gray-900">₹{transfer.price}</span>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code
                </label>
                <div className="flex">
                  <Input
                    value={formData.promoCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, promoCode: e.target.value }))}
                    placeholder="Enter promo code"
                    className="rounded-r-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-none border-l-0"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {/* Bargain functionality removed - user has already decided to book */}

              {/* Book Now Button */}
              <Button
                onClick={handleBookTransfer}
                disabled={isProcessing || !formData.primaryGuest.firstName || !formData.primaryGuest.lastName || !formData.primaryGuest.email || !formData.primaryGuest.phone}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Book Now - ₹{transfer.price}
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                By booking, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bargain Modal */}
      {showBargainModal && (
        <EnhancedBargainModal
          isOpen={showBargainModal}
          onClose={() => setShowBargainModal(false)}
          initialPrice={transfer.price}
          itemType="transfer"
          itemDetails={{
            title: `${transfer.type} - ${transfer.vehicle}`,
            subtitle: `${transfer.from} → ${transfer.to}`,
            features: transfer.features
          }}
        />
      )}
    </div>
  );
}
