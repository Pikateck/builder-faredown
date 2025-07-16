import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EnhancedBargainModal } from "@/components/EnhancedBargainModal";
import {
  Star,
  MapPin,
  Heart,
  Share2,
  ChevronDown,
  Users,
  Calendar,
  Bookmark,
  Download,
  Search,
  CheckCircle,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPriceWithSymbol } from "@/lib/pricing";

export default function HotelDetails() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { selectedCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRoomType, setSelectedRoomType] = useState<any>(null);
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Mock hotel data with dynamic pricing
  const hotel = {
    id: parseInt(hotelId || "3"),
    name: "Grand Hyatt Dubai",
    location: "Near Sheikh Zayed Road & Mall Mall, Dubai, United Arab Emirates",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F4e78c7022f0345f4909bc6063cdeffd6?format=webp&width=800",
    rating: 4.5,
    reviews: 1247,
    checkIn: "01-Aug-2025",
    checkOut: "05-Aug-2025",
    totalNights: 4,
    rooms: 1,
    adults: 2,
    available: true,
  };

  // Calculate total price based on room type and nights
  const calculateTotalPrice = (
    roomPricePerNight: number,
    nights: number = hotel.totalNights,
  ) => {
    return roomPricePerNight * nights;
  };

  const roomTypes = [
    {
      id: "twin-skyline",
      name: "Twin Room with Skyline View",
      type: "1 X Twin Classic",
      details: "Twin bed",
      pricePerNight: 8200, // Cheapest room
      features: [
        "6.7 km from downtown",
        "Max 2 guests",
        "2 twin beds",
        "Free stay for your child",
        "Free cancellation",
        "No prepayment needed - pay at the property",
      ],
      status: "Best Value - Start Here!",
      statusColor: "green",
      nonRefundable: true,
      image:
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300",
    },
    {
      id: "king-skyline",
      name: "King Room with Skyline View",
      type: "1 X King Classic",
      details: "1 king bed",
      pricePerNight: 9340, // +1140 from base
      features: [
        "6.7 km from downtown",
        "Max 2 guests",
        "1 king bed",
        "Free stay for your child",
        "Free cancellation",
        "No prepayment needed - pay at the property",
      ],
      status: "Upgrade for +��4,560",
      statusColor: "blue",
      nonRefundable: false,
      image:
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300",
    },
    {
      id: "superior-king",
      name: "Superior King Room",
      type: "1 X Superior King",
      details: "1 king bed",
      pricePerNight: 9858, // +1658 from base
      features: [
        "6.7 km from downtown",
        "Max 2 guests",
        "1 king bed",
        "City view",
        "Free cancellation",
        "No prepayment needed - pay at the property",
      ],
      status: "Upgrade for +₹6,632",
      statusColor: "blue",
      nonRefundable: false,
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300",
    },
    {
      id: "superior-twin-club",
      name: "Superior Twin Room - Club Access",
      type: "2 X Twin Superior Club",
      details: "2 twin beds",
      pricePerNight: 13762, // +5562 from base
      features: [
        "6.7 km from downtown",
        "Max 2 guests",
        "2 twin beds",
        "Club lounge access",
        "Complimentary breakfast",
        "Free cancellation",
        "No prepayment needed - pay at the property",
      ],
      status: "Upgrade for +₹22,248",
      statusColor: "blue",
      nonRefundable: false,
      image:
        "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=300",
    },
    {
      id: "grand-suite-garden",
      name: "One Bedroom Grand Suite with Garden View",
      type: "1 X Grand Suite",
      details: "1 king bed + living area",
      pricePerNight: 16038, // +7838 from base
      features: [
        "6.7 km from downtown",
        "Max 4 guests",
        "1 king bed",
        "Separate living area",
        "Garden view",
        "Butler service",
        "Free cancellation",
        "No prepayment needed - pay at the property",
      ],
      status: "Upgrade for +₹31,352",
      statusColor: "blue",
      nonRefundable: false,
      image:
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=300",
    },
  ];

  const filters = {
    priceRange: { min: 0, max: 40000 },
    deals: [{ name: "All deals", count: 1102 }],
    popularFilters: [
      {
        name: "Wonderful: 9+",
        count: 1593,
        subtitle: "Based on guest reviews",
      },
      { name: "No prepayment", count: 442 },
      { name: "Swimming pool", count: 5244 },
      { name: "Free cancellation", count: 4009 },
      { name: "5 stars", count: 799 },
      { name: "Resorts", count: 59 },
      { name: "Downtown Dubai", count: 1069 },
      { name: "Private pool", count: 2316 },
    ],
    facilities: [
      { name: "Parking", count: 5444 },
      { name: "Restaurant", count: 876 },
      { name: "Room service", count: 800 },
      { name: "24-hour front desk", count: 2021 },
      { name: "Fitness center", count: 3388 },
    ],
    meals: [
      { name: "Kitchen facilities", count: 5348 },
      { name: "Breakfast included", count: 627 },
      { name: "All meals included", count: 39 },
      { name: "All-inclusive", count: 20 },
      { name: "Breakfast & lunch included", count: 27 },
      { name: "Breakfast & dinner included", count: 236 },
    ],
    propertyType: [
      { name: "Entire homes & apartments", count: 5338 },
      { name: "Apartments", count: 5060 },
      { name: "Family-Friendly Properties", count: 1842 },
      { name: "Hotels", count: 656 },
      { name: "Villas", count: 104 },
    ],
    reviewScore: [
      { name: "Wonderful: 9+", count: 1593 },
      { name: "Very Good: 8+", count: 2649 },
      { name: "Good: 7+", count: 3193 },
      { name: "Pleasant: 6+", count: 3455 },
    ],
    reservationPolicy: [
      { name: "Free cancellation", count: 4009 },
      { name: "Book without credit card", count: 1 },
      { name: "No prepayment", count: 442 },
    ],
    roomFacilities: [
      { name: "Private pool", count: 2316 },
      { name: "Sea view", count: 838 },
      { name: "Air conditioning", count: 5799 },
      { name: "Kitchen/Kitchenette", count: 5348 },
      { name: "Balcony", count: 4484 },
    ],
    propertyRating: [
      { name: "1 star", count: 31 },
      { name: "2 stars", count: 95 },
      { name: "3 stars", count: 424 },
      { name: "4 stars", count: 3644 },
      { name: "5 stars", count: 799 },
    ],
    preferredStayLocation: [
      { name: "Dubai's coastline", count: 2108 },
      { name: "Near Dubai mall", count: 1670 },
      { name: "In lively nightlife areas", count: 3586 },
      { name: "Beachfront and JBR walk", count: 1550 },
      { name: "Traditional Souks and Old Dubai", count: 554 },
    ],
    brands: [
      { name: "Millennium Hotels", count: 15 },
      { name: "Jumeirah", count: 12 },
      { name: "ROVE Hotels", count: 10 },
      { name: "The Address Hotels and Resorts", count: 8 },
      { name: "OYO Rooms", count: 8 },
    ],
    neighborhood: [
      { name: "Beach & Coast", count: 2108 },
      { name: "Downtown Dubai", count: 1069 },
      { name: "Guests' favorite area", count: 1084 },
      { name: "Bur Dubai", count: 337 },
      { name: "Palm Jumeirah", count: 440 },
    ],
    distanceFromCenter: [
      { name: "Less than 1 km", count: 1033 },
      { name: "Less than 3 km", count: 2151 },
      { name: "Less than 5 km", count: 2399 },
    ],
    travelGroup: [
      { name: "Pet friendly", count: 945 },
      { name: "Family-Friendly Properties", count: 1842 },
    ],
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "gallery", label: "Gallery" },
    { id: "amenities", label: "Amenities" },
    { id: "reviews", label: "Reviews" },
    { id: "street-view", label: "Street View" },
    { id: "location", label: "Location" },
  ];

  const handleBargainClick = (roomType: any) => {
    setSelectedRoomType(roomType);
    setIsBargainModalOpen(true);
  };

  const toggleRoomExpansion = (roomId: string) => {
    setExpandedRooms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const handleBooking = (roomType: any, bargainPrice?: number) => {
    const finalPrice = bargainPrice || roomType.pricePerNight;
    navigate(
      `/reserve?hotelId=${hotel.id}&roomType=${roomType.id}&price=${finalPrice}&nights=${hotel.totalNights}`,
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar - Filters */}
        <div className="w-full lg:w-80 bg-white border-r border-gray-200 min-h-screen">
          <div className="lg:hidden p-3 border-b border-gray-200">
            <button className="flex items-center justify-center w-full py-2 px-4 bg-blue-700 text-white rounded-md text-sm">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6h18M7 12h10M10 18h4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Filters
            </button>
          </div>
          <div className="p-3">
            {/* Filters Header */}
            <div className="flex items-center mb-4">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6h18M7 12h10M10 18h4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-medium">Filters</span>
            </div>

            {/* Search by Hotel Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Hotel Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter hotel name..."
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your budget (per night)
              </label>
              <div className="text-sm text-gray-600 mb-2">₹ 0 - ₹ 40,000+</div>
              <div className="px-2">
                <div className="w-full h-2 bg-gray-200 rounded-full relative">
                  <div
                    className="h-2 bg-blue-600 rounded-full"
                    style={{ width: "60%" }}
                  ></div>
                  <div className="absolute left-0 top-0 w-4 h-4 bg-blue-600 rounded-full -mt-1 cursor-pointer"></div>
                  <div
                    className="absolute right-0 top-0 w-4 h-4 bg-blue-600 rounded-full -mt-1 cursor-pointer"
                    style={{ left: "60%" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Popular Filters */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Popular filters
              </label>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-2 flex-1">
                      <span className="text-sm text-gray-700">
                        Free cancellation
                      </span>
                      <span className="text-xs text-orange-600 ml-1">
                        Popular
                      </span>
                    </div>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">4106</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-2 flex-1">
                      <span className="text-sm text-gray-700">
                        No prepayment
                      </span>
                      <span className="text-xs text-orange-600 ml-1">
                        Popular
                      </span>
                    </div>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">444</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Downtown Dubai
                    </span>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">1844</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Apartments
                    </span>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">5176</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">5 stars</span>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">843</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Resorts</span>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">59</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Breakfast & dinner included
                    </span>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">236</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Breakfast included
                    </span>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">624</span>
                </div>
              </div>
            </div>

            {/* Star Rating Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Star rating
              </label>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">5 stars</span>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">843</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">4 stars</span>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">3644</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">3 stars</span>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">424</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">2 stars</span>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">95</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">1 star</span>
                  </label>
                  <span className="text-sm text-gray-500 ml-2">31</span>
                </div>
              </div>
            </div>

            {/* Clear All Filters Button */}
            <Button variant="outline" className="w-full text-sm">
              Clear All Filters
            </Button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-700 text-blue-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="p-1 sm:p-2">
            {activeTab === "overview" && (
              <div className="space-y-2">
                {/* Hotel Header */}
                <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Available
                        </Badge>
                      </div>
                      <h1 className="text-xl font-bold text-gray-900 mb-2">
                        {hotel.name}
                      </h1>
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(hotel.rating)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-2 font-medium text-sm">
                            {hotel.rating}
                          </span>
                          <span className="ml-1 text-xs text-gray-600">
                            ({hotel.reviews} reviews)
                          </span>
                        </div>
                        <button className="ml-3 text-blue-600 text-xs">
                          Write a review
                        </button>
                      </div>
                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-xs">{hotel.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`text-xs ${
                          isSaved
                            ? "bg-blue-100 text-blue-700 border-blue-300"
                            : ""
                        }`}
                        onClick={() => setIsSaved(!isSaved)}
                      >
                        <Bookmark
                          className={`w-3 h-3 mr-1 ${
                            isSaved ? "fill-current" : ""
                          }`}
                        />
                        {isSaved ? "Saved" : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setIsShareModalOpen(true)}
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>

                  {/* Hotel Image and Details - Compact */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-48 lg:h-56 object-cover rounded-xl shadow-lg"
                      />
                    </div>
                    <div className="lg:col-span-2 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200 text-center shadow-sm">
                          <div className="text-xs text-blue-600 font-medium">
                            Check-in
                          </div>
                          <div className="font-semibold text-sm text-blue-900 mt-1">
                            {hotel.checkIn}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200 text-center shadow-sm">
                          <div className="text-xs text-blue-600 font-medium">
                            Check-out
                          </div>
                          <div className="font-semibold text-sm text-blue-900 mt-1">
                            {hotel.checkOut}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="font-bold text-xl text-gray-900">
                              {hotel.totalNights}
                            </div>
                            <div className="text-xs text-gray-600">nights</div>
                          </div>
                          <div>
                            <div className="font-bold text-xl text-gray-900">
                              {hotel.adults}
                            </div>
                            <div className="text-xs text-gray-600">adults</div>
                          </div>
                          <div>
                            <div className="font-bold text-xl text-gray-900">
                              {hotel.rooms}
                            </div>
                            <div className="text-xs text-gray-600">room</div>
                          </div>
                          <div>
                            <div className="font-bold text-xl text-green-700">
                              Free
                            </div>
                            <div className="text-xs text-gray-600">cancel</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-2 rounded-lg text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          ₹
                          {calculateTotalPrice(
                            roomTypes[0].pricePerNight,
                          ).toLocaleString()}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          Total Price
                        </div>
                        <div className="text-xs text-gray-600">
                          Includes all taxes & charges
                        </div>
                        <div className="text-xs text-gray-600">
                          ��{roomTypes[0].pricePerNight.toLocaleString()} per
                          night (all-inclusive)
                        </div>
                      </div>

                      <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold py-3 rounded-lg text-sm shadow-lg transform hover:scale-[1.02] transition-all duration-200">
                        ⚡ Upgrade & Save with Bargaining
                      </Button>
                    </div>

                    {/* Pricing - Attractive Right Column */}
                    <div className="lg:col-span-1">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200 h-full flex flex-col justify-center shadow-lg">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-900 mb-1">
                            ₹
                            {calculateTotalPrice(
                              roomTypes[0].pricePerNight,
                            ).toLocaleString()}
                          </div>
                          <div className="text-xs font-medium text-green-700 mb-2">
                            Total Price
                          </div>
                          <div className="text-xs text-green-600 mb-3">
                            ₹{roomTypes[0].pricePerNight.toLocaleString()}/night
                          </div>
                          <div className="text-xs text-green-600 font-medium flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            All taxes included
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* All-Inclusive Pricing */}
                  <div className="mt-3 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-3 h-3 text-yellow-400 fill-current"
                          />
                        ))}
                        <span className="font-medium">
                          All-Inclusive Pricing
                        </span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        All prices shown include taxes, service charges & fees.
                        Displayed prices are final with no additional charges.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Available Rooms Section - Compact */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="bg-blue-700 text-white p-2 rounded-t-lg">
                    <h2 className="text-base font-semibold">
                      Available Rooms - Starting from Cheapest
                    </h2>
                    <p className="text-xs opacity-90">
                      Start with our cheapest room, then upgrade to better
                      options for just a little more!
                    </p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {roomTypes.map((room, index) => (
                      <div key={room.id} className="p-1.5 sm:p-2">
                        <div
                          className="flex items-center justify-between cursor-pointer hover:bg-blue-50 rounded-lg p-2 transition-all duration-200 group"
                          onClick={() => toggleRoomExpansion(room.id)}
                          title="Click to expand room details"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                              <h3 className="font-medium text-sm truncate pr-2">
                                {room.name}
                              </h3>
                              {room.status && (
                                <Badge
                                  className={`${
                                    room.statusColor === "green"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-500 text-yellow-900 font-semibold"
                                  } text-xs flex-shrink-0`}
                                >
                                  {room.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <div className="p-1.5 group-hover:bg-blue-100 rounded-full flex-shrink-0 transition-colors">
                              <ChevronDown
                                className={`w-4 h-4 transition-all duration-200 text-gray-600 group-hover:text-blue-600 ${
                                  expandedRooms.has(room.id) ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Room Details */}
                        {expandedRooms.has(room.id) && room.features && (
                          <div className="mt-1 border-t border-gray-100 pt-2">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-1.5">
                              {/* Room Image */}
                              <div className="lg:col-span-2">
                                <img
                                  src={room.image}
                                  alt={room.name}
                                  className="w-full h-16 sm:h-20 object-cover rounded"
                                />
                              </div>

                              {/* Room Details */}
                              <div className="lg:col-span-6">
                                <div className="mb-2">
                                  <h4 className="font-semibold text-sm mb-1">
                                    {room.type}
                                  </h4>
                                  <div className="text-xs text-gray-600 mb-1">
                                    {room.details}
                                  </div>
                                  {room.nonRefundable && (
                                    <Badge className="bg-red-100 text-red-800 text-xs mb-1">
                                      Non Refundable Rate
                                    </Badge>
                                  )}
                                </div>

                                <div className="space-y-1 text-xs">
                                  {room.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start">
                                      <span className="text-green-600 mr-1 flex-shrink-0">
                                        •
                                      </span>
                                      <span className="text-gray-600">
                                        {feature}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Pricing and Actions */}
                              <div className="lg:col-span-4">
                                <div className="bg-gray-50 p-1.5 rounded border border-gray-200 mb-1.5">
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-gray-900">
                                      ₹
                                      {calculateTotalPrice(
                                        room.pricePerNight,
                                      ).toLocaleString()}
                                    </div>
                                    <div className="text-xs font-semibold text-gray-900">
                                      Total Price
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      ₹{room.pricePerNight.toLocaleString()}
                                      /night
                                    </div>
                                  </div>
                                </div>

                                <div className="mb-1">
                                  <div className="flex items-center text-xs font-semibold text-green-700">
                                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1"></span>
                                    {room.statusColor === "green"
                                      ? "Cheapest Option"
                                      : "Premium Upgrade"}
                                  </div>
                                </div>

                                <div className="space-y-0.5">
                                  <Button
                                    onClick={() => handleBooking(room)}
                                    className={`w-full font-medium py-1 rounded text-xs h-7 ${
                                      room.statusColor === "green"
                                        ? "bg-green-700 hover:bg-green-800 text-white"
                                        : "bg-blue-800 hover:bg-blue-900 text-white"
                                    }`}
                                  >
                                    {room.statusColor === "green"
                                      ? "Reserve Room"
                                      : "Reserve Upgrade"}
                                  </Button>
                                  <Button
                                    onClick={() => handleBargainClick(room)}
                                    className="w-full py-1 font-medium bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 rounded text-xs h-7"
                                  >
                                    <div className="flex items-center justify-center">
                                      <span className="mr-1">💰 Bargain</span>
                                      <div className="bg-blue-600 text-white px-1 py-0.5 rounded text-xs">
                                        ₹{room.pricePerNight.toLocaleString()}
                                      </div>
                                    </div>
                                  </Button>
                                </div>

                                <div className="mt-1">
                                  <div className="text-xs text-gray-600">
                                    🏨 Pay at hotel • Free cancellation
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === "gallery" && (
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <img
                    src={hotel.image}
                    alt="Hotel exterior"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300"
                    alt="Hotel room"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300"
                    alt="Hotel suite"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=300"
                    alt="Hotel lounge"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=300"
                    alt="Hotel spa"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300"
                    alt="Hotel bathroom"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Amenities Tab */}
            {activeTab === "amenities" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-xl font-semibold mb-3">
                  Property Amenities
                </h2>
                <p className="text-gray-600 mb-6">
                  See the 156+ great amenities and services available for the
                  guests of your stay
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Entertainment */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">E</span>
                      </div>
                      <h3 className="font-semibold">Entertainment</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• TV Lounge</li>
                      <li>• Outdoor freshwater pool</li>
                    </ul>
                  </div>

                  {/* Facilities */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">F</span>
                      </div>
                      <h3 className="font-semibold">Facilities</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Total number of rooms</li>
                      <li>• Number of floors (main building)</li>
                      <li>• Hotel</li>
                      <li>• American Express</li>
                      <li>• Diners Club</li>
                      <li>• MasterCard</li>
                      <li>• Visa</li>
                      <li>• City centre</li>
                    </ul>
                  </div>

                  {/* Location */}
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">L</span>
                      </div>
                      <h3 className="font-semibold">Location</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Total number of rooms</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Hotel Type */}
                    <div>
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold">H</span>
                        </div>
                        <h3 className="font-semibold">Hotel type</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Hotel</li>
                        <li>• Internet access</li>
                        <li>• Tea & coffee making facilities</li>
                        <li>• Carpeted floors</li>
                      </ul>
                    </div>

                    {/* Room Facilities */}
                    <div>
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold">R</span>
                        </div>
                        <h3 className="font-semibold">
                          Room facilities (Standard room)
                        </h3>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Bathroom</li>
                        <li>• Centrally regulated air conditioning</li>
                        <li>• Living room</li>
                        <li>• Balcony</li>
                        <li>• Shower</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">
                    Guest reviews for Grand Hyatt Dubai
                  </h2>
                  <Button
                    className="bg-blue-700 hover:bg-blue-800 text-white"
                    onClick={() => setIsReviewModalOpen(true)}
                  >
                    Write a review
                  </Button>
                </div>

                {/* Overall Rating */}
                <div className="flex items-start gap-6 mb-6">
                  <div className="bg-blue-700 text-white px-3 py-2 rounded font-bold text-lg">
                    8.5
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Excellent</div>
                    <div className="text-sm text-gray-600">1247 reviews</div>
                    <div className="text-sm text-gray-600">
                      We aim for 100% real reviews
                    </div>
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Staff</div>
                    <div className="font-bold text-lg">9.6</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "96%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Facilities</div>
                    <div className="font-bold text-lg">9</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "90%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">
                      Cleanliness
                    </div>
                    <div className="font-bold text-lg">9.2</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "92%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Comfort</div>
                    <div className="font-bold text-lg">9.1</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "91%" }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">
                      Value for money
                    </div>
                    <div className="font-bold text-lg">8.5</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "85%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Location</div>
                    <div className="font-bold text-lg">8.8</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "88%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Free WiFi</div>
                    <div className="font-bold text-lg">8.6</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "86%" }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                        M
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold">Mia</div>
                            <div className="text-sm text-gray-600">
                              United Arab Emirates
                            </div>
                            <div className="text-sm text-gray-600">
                              Two Room
                            </div>
                            <div className="text-sm text-gray-600">
                              August 2023
                            </div>
                            <div className="text-sm text-gray-600">Family</div>
                          </div>
                          <div className="w-8 h-8 bg-blue-700 rounded flex items-center justify-center text-white font-bold">
                            9
                          </div>
                        </div>
                        <h4 className="font-semibold mb-2">We are happy</h4>
                        <p className="text-gray-700 mb-3">
                          It's my pleasure to be thankful for the polite service
                          and see my birthday 😊 Thanks for making it special
                          for me
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <button className="text-blue-600 hover:underline">
                            👍 Helpful (0)
                          </button>
                          <button className="text-gray-600 hover:underline">
                            Not helpful
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                        R
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold">Rachelle</div>
                            <div className="text-sm text-gray-600">
                              United Arab Emirates
                            </div>
                            <div className="text-sm text-gray-600">
                              King Room with Skyline View
                            </div>
                            <div className="text-sm text-gray-600">
                              July 2023
                            </div>
                            <div className="text-sm text-gray-600">Family</div>
                          </div>
                          <div className="w-8 h-8 bg-blue-700 rounded flex items-center justify-center text-white font-bold">
                            9.1
                          </div>
                        </div>
                        <h4 className="font-semibold mb-2">Wonderful</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Street View Tab */}
            {activeTab === "street-view" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-xl font-semibold mb-3">Street View</h2>
                <p className="text-gray-600 mb-4">
                  Explore the area around Grand Hyatt Dubai with Google Street
                  View
                </p>

                <div className="mb-4">
                  <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                    Street View
                  </Button>
                </div>

                <div className="relative">
                  <div className="bg-gray-900 rounded-lg p-4 h-80">
                    <div className="flex items-center text-white mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        Street View: Grand Hyatt Dubai
                      </span>
                    </div>
                    <div className="text-white text-xs mb-4">
                      Near Sheikh Zayed Road & Mall Mall, Dubai, United Arab
                      Emirates
                    </div>

                    <div className="bg-gray-800 h-60 rounded flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="mb-2">🏢</div>
                        <div className="text-sm">
                          Street View would load here
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          Interactive 360° view of the hotel
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-4 right-4">
                      <div className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                        ⭐⭐⭐⭐ Live Street View
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <div className="text-sm text-gray-600">
                      📍 Interactive View
                    </div>
                    <div className="text-xs text-gray-500">
                      Drag to explore around
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === "location" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-xl font-semibold mb-3">Location & Map</h2>
                <p className="text-gray-600 mb-4">
                  Explore the exact location of Grand Hyatt Dubai and nearby
                  attractions
                </p>

                <div className="mb-4">
                  <div className="flex gap-2">
                    <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                      Map
                    </Button>
                    <Button variant="outline">Satellite</Button>
                    <Button variant="outline">Terrain</Button>
                  </div>
                </div>

                <div className="bg-gray-100 h-80 rounded-lg mb-6 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <MapPin className="w-12 h-12 mx-auto mb-2" />
                    <div>Interactive Map would load here</div>
                    <div className="text-sm mt-2">
                      Grand Hyatt Dubai location with nearby landmarks
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Hotel Details</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Address:</strong> Sheikh Zayed Road, Dubai
                        Healthcare City, Near Sheikh Zayed Road & Mall Mall,
                        Dubai, United Arab Emirates
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Nearby Landmarks</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Dubai International Airport</span>
                        <span>8.5 km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Burj Khalifa</span>
                        <span>2.1 km</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Share2 className="w-5 h-5 mr-2" />
              Share this hotel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Grand Hyatt Dubai - faredown</h3>
              <p className="text-sm text-gray-600 mt-1">
                Check out this amazing hotel: Grand Hyatt Dubai in Near Sheikh
                Zayed Road & Mall Mall, Dubai, United Arab Emirates. Starting
                from ₹32,500 per night (all-inclusive)
              </p>
              <p className="text-xs text-gray-500 mt-2">
                https://faredown.com/hotels/grand-hyatt-dubai-1-50ff6d87f4884ff998
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="flex items-center justify-center"
              >
                <span className="mr-2">🔗</span>
                Copy Link
              </Button>
              <Button
                variant="outline"
                className="flex items-center justify-center"
              >
                <span className="mr-2">💬</span>
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="flex items-center justify-center"
              >
                <span className="mr-2">🐦</span>
                Twitter
              </Button>
              <Button
                variant="outline"
                className="flex items-center justify-center"
              >
                <span className="mr-2">📘</span>
                Facebook
              </Button>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsShareModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Write a review for Grand Hyatt Dubai
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Overall rating *
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Star
                    key={rating}
                    className="w-6 h-6 text-gray-300 hover:text-yellow-400 cursor-pointer"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Rate your experience
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm mb-1">Staff</div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        className="w-4 h-4 text-gray-300 hover:text-yellow-400 cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-1">Facilities</div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        className="w-4 h-4 text-gray-300 hover:text-yellow-400 cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-1">Cleanliness</div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        className="w-4 h-4 text-gray-300 hover:text-yellow-400 cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-1">Comfort</div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        className="w-4 h-4 text-gray-300 hover:text-yellow-400 cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-1">Value for money</div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        className="w-4 h-4 text-gray-300 hover:text-yellow-400 cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-1">Location</div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        className="w-4 h-4 text-gray-300 hover:text-yellow-400 cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Review title *
              </label>
              <Input placeholder="Give your review a title" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tell us about your experience *
              </label>
              <textarea
                placeholder="Share your experience to help other travelers"
                className="w-full p-3 border border-gray-300 rounded-md resize-none h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your name *
                </label>
                <Input placeholder="Enter your name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Country *
                </label>
                <Input placeholder="Enter your country" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Room type
                </label>
                <select className="w-full p-2 border border-gray-300 rounded">
                  <option>Select room type</option>
                  <option>Twin Room</option>
                  <option>King Room</option>
                  <option>Suite</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Date of stay
                </label>
                <Input type="date" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Type of trip
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-700 text-white"
                >
                  Leisure
                </Button>
                <Button variant="outline" size="sm">
                  Business
                </Button>
                <Button variant="outline" size="sm">
                  Family
                </Button>
                <Button variant="outline" size="sm">
                  Couple
                </Button>
                <Button variant="outline" size="sm">
                  Solo travel
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsReviewModalOpen(false)}
              >
                Cancel
              </Button>
              <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Bargain Modal */}
      {selectedRoomType && (
        <EnhancedBargainModal
          roomType={{
            id: selectedRoomType.id,
            name: selectedRoomType.name,
            description:
              selectedRoomType.features?.join(", ") ||
              "Comfortable room with great amenities",
            image: selectedRoomType.image || hotel.image,
            marketPrice: selectedRoomType.pricePerNight * 1.2,
            totalPrice: selectedRoomType.pricePerNight,
            total: selectedRoomType.pricePerNight,
            features: selectedRoomType.features || ["City View", "Free WiFi"],
            maxOccupancy: 2,
            bedType: selectedRoomType.details || "Comfortable bed",
          }}
          hotel={{
            id: hotel.id,
            name: hotel.name,
            location: hotel.location,
            rating: hotel.rating,
            image: hotel.image,
          }}
          isOpen={isBargainModalOpen}
          onClose={() => {
            setIsBargainModalOpen(false);
            setSelectedRoomType(null);
          }}
          checkInDate={new Date(2025, 7, 1)}
          checkOutDate={new Date(2025, 7, 5)}
          roomsCount={1}
          onBookingSuccess={(finalPrice) => {
            setIsBargainModalOpen(false);
            handleBooking(selectedRoomType, finalPrice);
            setSelectedRoomType(null);
          }}
        />
      )}
    </div>
  );
}
