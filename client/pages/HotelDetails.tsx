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
  Filter,
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
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(
    new Set(["twin-skyline"]),
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);

  // Format date to DD-MMM-YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${date.getDate().toString().padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  // Mock hotel data
  const hotel = {
    id: parseInt(hotelId || "3"),
    name: "Grand Hyatt Dubai",
    location: "Near Sheikh Zayed Road & Mall Mall, Dubai, United Arab Emirates",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F4e78c7022f0345f4909bc6063cdeffd6?format=webp&width=800",
    rating: 4.5,
    reviews: 1247,
    checkIn: "2025-07-16",
    checkOut: "2025-07-19",
    totalNights: 4,
    rooms: 1,
    adults: 2,
    available: true,
  };

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
      pricePerNight: 8124,
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
      pricePerNight: 9340,
      features: [
        "6.7 km from downtown",
        "Max 2 guests",
        "1 king bed",
        "Free stay for your child",
        "Free cancellation",
        "No prepayment needed - pay at the property",
      ],
      status: "Upgrade for +₹4,864",
      statusColor: "yellow",
      nonRefundable: false,
      image:
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300",
    },
    {
      id: "superior-king",
      name: "Superior King Room",
      type: "1 X Superior King",
      details: "1 king bed",
      pricePerNight: 9858,
      features: [
        "6.7 km from downtown",
        "Max 2 guests",
        "1 king bed",
        "City view",
        "Free cancellation",
        "No prepayment needed - pay at the property",
      ],
      status: "Upgrade for +₹6,936",
      statusColor: "yellow",
      nonRefundable: false,
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300",
    },
    {
      id: "superior-twin-club",
      name: "Superior Twin Room - Club Access",
      type: "2 X Twin Superior Club",
      details: "2 twin beds",
      pricePerNight: 13762,
      features: [
        "6.7 km from downtown",
        "Max 2 guests",
        "2 twin beds",
        "Club lounge access",
        "Complimentary breakfast",
        "Free cancellation",
        "No prepayment needed - pay at the property",
      ],
      status: "Upgrade for +₹22,552",
      statusColor: "yellow",
      nonRefundable: false,
      image:
        "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=300",
    },
    {
      id: "grand-suite-garden",
      name: "One Bedroom Grand Suite with Garden View",
      type: "1 X Grand Suite",
      details: "1 king bed + living area",
      pricePerNight: 16038,
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
      status: "Upgrade for +₹31,656",
      statusColor: "yellow",
      nonRefundable: false,
      image:
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=300",
    },
  ];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "gallery", label: "Gallery" },
    { id: "amenities", label: "Amenities" },
    { id: "reviews", label: "Reviews" },
    { id: "street-view", label: "Street View" },
    { id: "location", label: "Location" },
  ];

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (!isSaved) {
      setSavedItems([...savedItems, hotel]);
    } else {
      setSavedItems(savedItems.filter((item) => item.id !== hotel.id));
    }
  };

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
      `/reserve?hotelId=${hotel.id}&roomType=${roomType.id}&price=${finalPrice}&nights=${hotel.totalNights}&bargained=${!!bargainPrice}`,
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Saved Items Icon */}
      <div className="fixed top-20 right-4 z-50">
        <button
          onClick={() => setShowSavedModal(true)}
          className="bg-blue-700 text-white p-2 rounded-full shadow-lg hover:bg-blue-800 relative"
        >
          <Bookmark className="w-5 h-5" />
          {savedItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {savedItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div className="flex">
        {/* Left Sidebar - Filters */}
        <div className="w-72 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            {/* Filters Header */}
            <div className="flex items-center mb-4">
              <Filter className="w-4 h-4 mr-2" />
              <span className="font-medium text-gray-700">Filters</span>
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
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="text-sm text-gray-600 mb-2">₹0 - ₹1,00,000+</div>
              <div className="px-2">
                <div className="w-full h-2 bg-gray-200 rounded-full relative">
                  <div
                    className="h-2 bg-blue-600 rounded-full"
                    style={{ width: "60%" }}
                  ></div>
                  <div className="absolute left-0 top-0 w-4 h-4 bg-blue-600 rounded-full -mt-1 cursor-pointer"></div>
                  <div
                    className="absolute top-0 w-4 h-4 bg-blue-600 rounded-full -mt-1 cursor-pointer"
                    style={{ left: "60%" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Popular Filters */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Popular Filters
              </label>
              <div className="space-y-2">
                {[
                  { name: "Free cancellation", count: 4106, popular: true },
                  { name: "No prepayment", count: 444, popular: true },
                  { name: "Downtown Dubai", count: 1844 },
                  { name: "Apartments", count: 5176 },
                  { name: "5 stars", count: 843 },
                  { name: "Resorts", count: 59 },
                  { name: "Breakfast & dinner included", count: 236 },
                  { name: "Breakfast included", count: 624 },
                ].map((filter, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <label className="flex items-center flex-1">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="ml-2 flex-1">
                        <span className="text-sm text-gray-700">
                          {filter.name}
                        </span>
                        {filter.popular && (
                          <span className="text-xs text-orange-600 ml-1 bg-orange-100 px-1 py-0.5 rounded">
                            Popular
                          </span>
                        )}
                      </div>
                    </label>
                    <span className="text-sm text-gray-500">
                      {filter.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Star rating
              </label>
              <div className="space-y-1">
                {[
                  { stars: "5 stars", count: 843 },
                  { stars: "4 stars", count: 3644 },
                  { stars: "3 stars", count: 424 },
                ].map((rating, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <label className="flex items-center flex-1">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {rating.stars}
                      </span>
                    </label>
                    <span className="text-sm text-gray-500">
                      {rating.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <Button variant="outline" className="w-full text-sm">
              Clear All Filters
            </Button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
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
          <div className="p-4">
            {activeTab === "overview" && (
              <>
                {/* Hotel Header - Compact Square Design */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                          ✓ Available
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
                          <span className="ml-1 font-semibold text-sm">
                            {hotel.rating}
                          </span>
                          <span className="ml-1 text-xs text-gray-600">
                            ({hotel.reviews} reviews)
                          </span>
                        </div>
                        <button
                          className="ml-4 text-blue-600 text-xs hover:underline"
                          onClick={() => setIsReviewModalOpen(true)}
                        >
                          Write a review
                        </button>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="text-xs">{hotel.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`text-xs px-2 py-1 ${
                          isSaved
                            ? "bg-blue-100 text-blue-700 border-blue-300"
                            : ""
                        }`}
                        onClick={handleSave}
                      >
                        <Bookmark
                          className={`w-3 h-3 mr-1 ${
                            isSaved ? "fill-current" : ""
                          }`}
                        />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1"
                        onClick={() => setIsShareModalOpen(true)}
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>

                  {/* Hotel Details - Square Grid Layout */}
                  <div className="grid grid-cols-12 gap-3">
                    {/* Hotel Image - Square */}
                    <div className="col-span-3">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    </div>

                    {/* Booking Details - Square Boxes */}
                    <div className="col-span-6 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="aspect-square bg-gray-50 rounded flex flex-col items-center justify-center p-2">
                          <div className="text-xs text-gray-600">Check-in</div>
                          <div className="font-semibold text-sm">
                            {formatDate(hotel.checkIn)}
                          </div>
                        </div>
                        <div className="aspect-square bg-gray-50 rounded flex flex-col items-center justify-center p-2">
                          <div className="text-xs text-gray-600">Check-out</div>
                          <div className="font-semibold text-sm">
                            {formatDate(hotel.checkOut)}
                          </div>
                        </div>
                      </div>
                      <div className="text-center text-sm">
                        <div className="font-bold text-lg">
                          {hotel.totalNights} nights
                        </div>
                        <div className="text-xs text-gray-600">
                          {hotel.rooms} room, {hotel.adults} adults
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Includes taxes and fees
                        </div>
                      </div>
                    </div>

                    {/* Pricing - Square */}
                    <div className="col-span-3">
                      <div className="aspect-square bg-gray-50 rounded flex flex-col items-center justify-center p-3">
                        <div className="text-xl font-bold text-gray-900">
                          ₹
                          {calculateTotalPrice(
                            roomTypes[0].pricePerNight,
                          ).toLocaleString()}
                        </div>
                        <div className="text-xs font-semibold text-gray-900">
                          Total Price
                        </div>
                        <div className="text-xs text-gray-600 text-center mt-1">
                          ₹{roomTypes[0].pricePerNight.toLocaleString()} per
                          night (all-inclusive)
                        </div>
                        <Button
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-1 text-xs mt-2"
                          onClick={() => handleBargainClick(roomTypes[0])}
                        >
                          ⚡ Upgrade & Save with Bargaining for All Rooms
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* All-Inclusive Banner */}
                  <div className="mt-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
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
                      <span>•</span>
                      <span>
                        All prices shown include taxes, service charges & fees.
                        Displayed prices are final with no additional charges.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Available Rooms Section */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-blue-700 text-white p-3">
                    <h2 className="text-base font-semibold">
                      Available Rooms - Starting from Cheapest
                    </h2>
                    <p className="text-sm opacity-90">
                      Start with our cheapest room, then upgrade to better
                      options for just a little more!
                    </p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {roomTypes.map((room, index) => (
                      <div key={room.id} className="p-3">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleRoomExpansion(room.id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-base">
                                {room.name}
                              </h3>
                              {room.status && (
                                <Badge
                                  className={`${
                                    room.statusColor === "green"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-500 text-yellow-900"
                                  } text-xs font-semibold`}
                                >
                                  {room.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-lg font-bold">
                                ₹
                                {calculateTotalPrice(
                                  room.pricePerNight,
                                ).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-600">
                                Total Price
                              </div>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-600 transition-transform ${
                                expandedRooms.has(room.id) ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Expanded Room Details */}
                        {expandedRooms.has(room.id) && (
                          <div className="mt-3 border-t border-gray-100 pt-3">
                            <div className="grid grid-cols-12 gap-3">
                              {/* Room Image */}
                              <div className="col-span-3">
                                <img
                                  src={room.image}
                                  alt={room.name}
                                  className="w-full aspect-square object-cover rounded"
                                />
                              </div>

                              {/* Room Details */}
                              <div className="col-span-6">
                                <h4 className="font-semibold text-sm mb-1">
                                  {room.type}
                                </h4>
                                <div className="text-xs text-gray-600 mb-1">
                                  {room.details}
                                </div>
                                {room.nonRefundable && (
                                  <Badge className="bg-red-100 text-red-800 text-xs mb-2">
                                    Non Refundable Rate
                                  </Badge>
                                )}
                                <div className="space-y-1 text-xs">
                                  {room.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start">
                                      <span className="text-green-600 mr-1">
                                        •
                                      </span>
                                      <span className="text-gray-700">
                                        {feature}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Pricing and Actions */}
                              <div className="col-span-3">
                                <div className="bg-gray-50 p-2 rounded mb-2 text-center">
                                  <div className="text-lg font-bold text-gray-900">
                                    ₹
                                    {calculateTotalPrice(
                                      room.pricePerNight,
                                    ).toLocaleString()}
                                  </div>
                                  <div className="text-xs font-semibold text-gray-900">
                                    Total Price
                                  </div>
                                </div>

                                <div className="mb-2">
                                  <div className="flex items-center text-xs font-semibold text-green-700">
                                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1"></span>
                                    {room.statusColor === "green"
                                      ? "Cheapest Option Available"
                                      : "Premium Upgrade Available"}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <Button
                                    onClick={() => handleBooking(room)}
                                    className={`w-full font-semibold py-1 text-xs ${
                                      room.statusColor === "green"
                                        ? "bg-green-700 hover:bg-green-800 text-white"
                                        : "bg-blue-700 hover:bg-blue-800 text-white"
                                    }`}
                                  >
                                    Reserve Room
                                  </Button>
                                  <Button
                                    onClick={() => handleBargainClick(room)}
                                    className="w-full py-1 font-semibold bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs"
                                  >
                                    💰 Bargain Room
                                  </Button>
                                </div>

                                <div className="mt-2 text-center">
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
              </>
            )}

            {/* Other tabs content */}
            {activeTab === "gallery" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[hotel.image, ...roomTypes.map((r) => r.image)].map(
                    (img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Gallery image ${idx + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    ),
                  )}
                </div>
              </div>
            )}

            {activeTab === "amenities" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-lg font-semibold mb-3">
                  Property Amenities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Entertainment</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• TV Lounge</li>
                      <li>• Outdoor freshwater pool</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Facilities</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Hotel</li>
                      <li>• City centre</li>
                      <li>• Payment methods accepted</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Room Facilities</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Air conditioning</li>
                      <li>• Bathroom</li>
                      <li>• Balcony</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    Guest reviews for {hotel.name}
                  </h2>
                  <Button
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-800 text-white"
                    onClick={() => setIsReviewModalOpen(true)}
                  >
                    Write a review
                  </Button>
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-blue-700 text-white px-3 py-2 rounded font-bold text-lg">
                    8.5
                  </div>
                  <div>
                    <div className="font-semibold text-base">Excellent</div>
                    <div className="text-sm text-gray-600">
                      {hotel.reviews} reviews
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "street-view" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-lg font-semibold mb-3">Street View</h2>
                <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <div className="mb-2">🏢</div>
                    <div>Street View would load here</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "location" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-lg font-semibold mb-3">Location & Map</h2>
                <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <div>Interactive Map would load here</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Items Modal */}
      <Dialog open={showSavedModal} onOpenChange={setShowSavedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Bookmark className="w-5 h-5 mr-2" />
              Saved Hotels ({savedItems.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {savedItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No saved hotels yet
              </p>
            ) : (
              savedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-xs text-gray-600">
                      Rating: {item.rating}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/hotels/${item.id}`)}
                  >
                    View
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

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
              <h3 className="font-semibold">{hotel.name} - faredown</h3>
              <p className="text-sm text-gray-600 mt-1">
                Check out this amazing hotel in {hotel.location}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                🔗 Copy Link
              </Button>
              <Button variant="outline" size="sm">
                💬 WhatsApp
              </Button>
              <Button variant="outline" size="sm">
                🐦 Twitter
              </Button>
              <Button variant="outline" size="sm">
                📘 Facebook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Write a review for {hotel.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
              <label className="block text-sm font-medium mb-2">
                Review title *
              </label>
              <Input placeholder="Give your review a title" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Your experience *
              </label>
              <textarea
                placeholder="Share your experience"
                className="w-full p-3 border border-gray-300 rounded-md h-24"
              />
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
          checkInDate={new Date(2025, 6, 16)}
          checkOutDate={new Date(2025, 6, 19)}
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
