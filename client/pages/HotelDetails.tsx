import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  // Mock hotel data
  const hotel = {
    id: parseInt(hotelId || "3"),
    name: "Grand Hyatt Dubai",
    location: "Near Sheikh Zayed Road & Mall Mall, Dubai, United Arab Emirates",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    rating: 4.5,
    reviews: 1247,
    checkIn: "01-Aug-2025",
    checkOut: "05-Aug-2025",
    totalNights: 4,
    rooms: 1,
    adults: 2,
    totalPrice: 3249286,
    perNightPrice: 32850,
    available: true,
  };

  const roomTypes = [
    {
      id: "twin-skyline",
      name: "Twin Room with Skyline View",
      type: "1 X Twin Classic",
      details: "Twin bed",
      features: [
        "6.7 km from downtown",
        "Max 2 guests",
        "2 twin beds",
        "Free stay for your child",
        "Free cancellation",
        "No prepayment needed - pay at the property",
      ],
      originalPrice: 34957,
      upgradePrice: 34957,
      status: "Best Value - Start Here!",
      statusColor: "green",
      nonRefundable: true,
      image:
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300",
    },
    {
      id: "king-skyline",
      name: "King Room with Skyline View",
      upgradePrice: 34957,
      status: "Upgrade for +₹4,957",
      statusColor: "yellow",
    },
    {
      id: "superior-king",
      name: "Superior King Room",
      upgradePrice: 36633,
      status: "Upgrade for +₹6,633",
      statusColor: "yellow",
    },
    {
      id: "superior-twin-club",
      name: "Superior Twin Room - Club Access",
      upgradePrice: 52249,
      status: "Upgrade for +₹22,249",
      statusColor: "yellow",
    },
    {
      id: "grand-suite-garden",
      name: "One Bedroom Grand Suite with Garden View",
      upgradePrice: 61350,
      status: "Upgrade for +₹31,350",
      statusColor: "yellow",
    },
  ];

  const filters = {
    priceRange: { min: 0, max: 100000 },
    popularFilters: [
      {
        name: "Free cancellation",
        count: 4516,
        selected: false,
        popular: true,
      },
      { name: "No prepayment", count: 444, selected: false, popular: true },
      { name: "Downtown Dubai", count: 1166, selected: false },
      { name: "Apartments", count: 5356, selected: false },
      { name: "5 stars", count: 843, selected: false },
      { name: "Resorts", count: 59, selected: false },
      { name: "Breakfast & dinner included", count: 236, selected: false },
      { name: "Breakfast included", count: 624, selected: false },
    ],
    facilities: [
      { name: "Swimming pool", count: 1234 },
      { name: "WiFi", count: 5642 },
      { name: "Parking", count: 3211 },
      { name: "Restaurant", count: 2876 },
      { name: "Gym/Fitness center", count: 1543 },
      { name: "Spa", count: 876 },
      { name: "Business center", count: 1098 },
      { name: "Room service", count: 3456 },
    ],
    propertyType: [
      { name: "Hotels", count: 8743 },
      { name: "Apartments", count: 5356 },
      { name: "Resorts", count: 234 },
      { name: "Villas", count: 567 },
      { name: "Guest houses", count: 123 },
    ],
    neighborhood: [
      { name: "Downtown Dubai", count: 1166 },
      { name: "Dubai Marina", count: 876 },
      { name: "Business Bay", count: 543 },
      { name: "Jumeirah", count: 432 },
      { name: "Bur Dubai", count: 321 },
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
    setExpandedRoom(expandedRoom === roomId ? null : roomId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar - Filters */}
        <div className="w-full lg:w-80 bg-white border-r border-gray-200 min-h-screen">
          <div className="lg:hidden p-4 border-b border-gray-200">
            <button className="flex items-center justify-center w-full py-2 px-4 bg-blue-700 text-white rounded-md">
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
          <div className="p-4">
            {/* Filters Header */}
            <div className="flex items-center mb-6">
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
            <div className="mb-6">
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
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
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
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>₹0</span>
                  <span>₹1,00,000+</span>
                </div>
              </div>
            </div>

            {/* Popular Filters */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Popular Filters
              </label>
              <div className="space-y-2">
                {filters.popularFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={filter.selected}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {filter.name}
                      </span>
                      {filter.popular && (
                        <Badge className="ml-2 bg-orange-100 text-orange-800 text-xs">
                          Popular
                        </Badge>
                      )}
                    </label>
                    <span className="text-sm text-gray-500">
                      {filter.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Facilities */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Facilities
              </label>
              <div className="space-y-2">
                {filters.facilities.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {filter.name}
                      </span>
                    </label>
                    <span className="text-sm text-gray-500">
                      {filter.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Property Type
              </label>
              <div className="space-y-2">
                {filters.propertyType.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {filter.name}
                      </span>
                    </label>
                    <span className="text-sm text-gray-500">
                      {filter.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Neighborhood */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Neighborhood
              </label>
              <div className="space-y-2">
                {filters.neighborhood.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {filter.name}
                      </span>
                    </label>
                    <span className="text-sm text-gray-500">
                      {filter.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Star rating
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-md text-sm">
                <option>Any rating</option>
                <option>5 stars</option>
                <option>4 stars</option>
                <option>3 stars</option>
              </select>
            </div>

            {/* Clear All Filters Button */}
            <Button variant="outline" className="w-full">
              Clear All Filters
            </Button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
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
          <div className="p-3 sm:p-4 lg:p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Hotel Header */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-100 text-green-800">
                          Available
                        </Badge>
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
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
                          <span className="ml-2 font-medium">
                            {hotel.rating}
                          </span>
                          <span className="ml-1 text-sm text-gray-600">
                            ({hotel.reviews} reviews)
                          </span>
                        </div>
                        <button className="ml-4 text-blue-600 text-sm">
                          Write a review
                        </button>
                      </div>
                      <div className="flex items-center text-gray-600 mb-4">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{hotel.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Bookmark className="w-4 h-4 mr-1" />
                        Saved
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>

                  {/* Hotel Image and Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                    <div>
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-lg"
                      />
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Check-in</div>
                          <div className="font-medium">{hotel.checkIn}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Check-out</div>
                          <div className="font-medium">{hotel.checkOut}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">
                            Total: {hotel.totalNights} nights
                          </div>
                          <div className="font-medium">
                            {hotel.rooms} room, {hotel.adults} adults
                          </div>
                          <div className="text-gray-600 text-xs">
                            Excludes taxes and fees
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg text-right">
                        <div className="text-3xl font-bold text-gray-900">
                          ₹32,49,286
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          Total Price
                        </div>
                        <div className="text-sm text-gray-600">
                          Includes all taxes & charges
                        </div>
                        <div className="text-sm text-gray-600">
                          ₹32,850 per night (all-inclusive)
                        </div>
                      </div>

                      <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-lg">
                        ⚡ Upgrade & Save with Bargaining for All Rooms
                      </Button>
                    </div>
                  </div>

                  {/* All-Inclusive Pricing */}
                  <div className="mt-4 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-1 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current"
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

                {/* Available Rooms Section */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="bg-blue-700 text-white p-3 sm:p-4 rounded-t-lg">
                    <h2 className="text-base sm:text-lg font-semibold">
                      Available Rooms - Starting from Cheapest
                    </h2>
                    <p className="text-xs sm:text-sm opacity-90">
                      Start with our cheapest room, then upgrade to better
                      options for just a little more!
                    </p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {roomTypes.map((room, index) => (
                      <div key={room.id} className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <h3 className="font-medium text-sm sm:text-base truncate pr-2">
                                {room.name}
                              </h3>
                              {room.status && (
                                <Badge
                                  className={`${
                                    room.statusColor === "green"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-500 text-yellow-900 font-semibold"
                                  } text-xs flex-shrink-0 self-start sm:self-center`}
                                >
                                  {room.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <button
                              onClick={() => toggleRoomExpansion(room.id)}
                              className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                            >
                              <ChevronDown
                                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                                  expandedRoom === room.id ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Room Details */}
                        {expandedRoom === room.id && room.features && (
                          <div className="mt-3 sm:mt-4 border-t border-gray-100 pt-3 sm:pt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
                              {/* Room Image */}
                              <div className="lg:col-span-3">
                                <img
                                  src={room.image}
                                  alt={room.name}
                                  className="w-full h-32 sm:h-40 object-cover rounded-lg"
                                />
                              </div>

                              {/* Room Details */}
                              <div className="lg:col-span-5">
                                <div className="mb-3">
                                  <h4 className="font-semibold text-base mb-1">
                                    {room.type}
                                  </h4>
                                  <div className="text-sm text-gray-600 mb-2">
                                    {room.details}
                                  </div>
                                  {room.nonRefundable && (
                                    <Badge className="bg-red-100 text-red-800 text-xs mb-2">
                                      Non Refundable Rate
                                    </Badge>
                                  )}
                                </div>

                                <div className="space-y-1 text-sm">
                                  {room.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start">
                                      <span className="text-green-600 mr-2 flex-shrink-0">
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
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                                  <div className="text-right">
                                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                                      ₹32,49,286
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 mb-1">
                                      Total Price
                                    </div>
                                    <div className="text-xs text-gray-600 mb-1">
                                      Includes all taxes & charges
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      ₹32,850 per night (all-inclusive)
                                    </div>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <div className="flex items-center text-sm font-semibold text-green-700 mb-2">
                                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                                    Cheapest Option Available
                                  </div>
                                  <div className="text-xs text-gray-600 mb-3">
                                    See upgrade options below for better rooms
                                    at amazing discounted prices
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Button className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-md">
                                    Reserve Room
                                  </Button>
                                  <Button
                                    onClick={() => handleBargainClick(room)}
                                    className="w-full py-2.5 font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
                                  >
                                    💰 Bargain This Room
                                  </Button>
                                </div>

                                <div className="mt-3 space-y-1">
                                  <div className="flex items-center text-xs text-gray-600">
                                    <span>
                                      🏨 Pay at hotel • No prepayment needed
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Free cancellation
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

            {/* Other tab content would go here */}
            {activeTab === "gallery" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">Hotel Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <img
                      key={index}
                      src={`https://images.unsplash.com/photo-${1566073771259 + index}?w=300`}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === "amenities" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Property Amenities
                </h2>
                <p className="text-gray-600 mb-6">
                  See the 156+ great amenities and services available for the
                  guests of your stay
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">E</span>
                      </div>
                      <h3 className="font-medium">Entertainment</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• TV Lounge</li>
                      <li>• Outdoor freshwater pool</li>
                      <li>• Hotel</li>
                      <li>• American Express</li>
                      <li>• Diners Club</li>
                      <li>• MasterCard</li>
                      <li>• Visa</li>
                      <li>• City centre</li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">F</span>
                      </div>
                      <h3 className="font-medium">Facilities</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Total number of rooms</li>
                      <li>• Number of floors (main building)</li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">L</span>
                      </div>
                      <h3 className="font-medium">Location</h3>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Total number of rooms</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">R</span>
                    </div>
                    <h3 className="font-medium">
                      Room facilities (Standard room)
                    </h3>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Bathroom</li>
                    <li>• Internet access</li>
                    <li>• Tea & coffee making facilities</li>
                    <li>• Carpeted floors</li>
                    <li>• Centrally regulated air conditioning</li>
                    <li>• Living room</li>
                    <li>• Balcony</li>
                    <li>• Shower</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">
                    Guest reviews for {hotel.name}
                  </h2>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Write a review
                  </Button>
                </div>

                <div className="bg-blue-600 text-white p-4 rounded-lg mb-6">
                  <div className="flex items-center">
                    <div className="text-3xl font-bold mr-4">8.5</div>
                    <div>
                      <div className="text-lg font-medium">Excellent</div>
                      <div className="text-sm opacity-90">
                        1,247 reviews • We aim for 100% real reviews
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Staff</div>
                    <div className="text-2xl font-bold">9.6</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Facilities</div>
                    <div className="text-2xl font-bold">9</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Cleanliness
                    </div>
                    <div className="text-2xl font-bold">9.2</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Comfort</div>
                    <div className="text-2xl font-bold">9.1</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                          M
                        </div>
                        <div>
                          <div className="font-medium">Mia</div>
                          <div className="text-sm text-gray-600">
                            United Arab Emirates
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Two Room</div>
                        <div className="text-sm text-gray-600">August 2023</div>
                        <div className="text-sm text-gray-600">Family</div>
                      </div>
                    </div>
                    <p className="text-gray-700">
                      It's my pleasure to be thankful for the polite service and
                      see my birthday 😊 Thanks for making it special for me
                    </p>
                    <div className="flex items-center mt-2 text-sm">
                      <button className="text-blue-600 mr-4">
                        👍 Helpful (0)
                      </button>
                      <button className="text-gray-600">Not helpful</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "street-view" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">Street View</h2>
                <p className="text-gray-600 mb-4">
                  Explore the area around {hotel.name} with Google Street View
                </p>

                <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">📍</span>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Street View
                    </Button>
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="text-green-600">●●●●</span> Live Street
                      View
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "location" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">Location & Map</h2>
                <p className="text-gray-600 mb-4">
                  Find the exact location of {hotel.name} and nearby attractions
                </p>

                <div className="flex gap-2 mb-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-sm">
                    Map
                  </Button>
                  <Button variant="outline" className="text-sm">
                    Satellite
                  </Button>
                  <Button variant="outline" className="text-sm">
                    Terrain
                  </Button>
                </div>

                <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-gray-500">
                    Interactive map would be displayed here
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Hotel Details</h3>
                    <p className="text-sm text-gray-600">
                      <strong>Address:</strong> Sheikh Zayed Road, Dubai
                      Healthcare City, Near Sheikh Zayed Road & Mall Mall,
                      Dubai, United Arab Emirates
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Nearby Landmarks</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>Dubai International Airport - 8.5 km</li>
                      <li>Burj Khalifa - 12 km</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bargain Modal */}
      {selectedRoomType && (
        <EnhancedBargainModal
          roomType={{
            id: selectedRoomType.id || "twin-skyline",
            name: selectedRoomType.name || "Twin Room with Skyline View",
            description:
              selectedRoomType.features?.join(", ") ||
              "Comfortable room with city view",
            image: selectedRoomType.image || hotel.image,
            marketPrice: hotel.perNightPrice * 1.2,
            totalPrice: hotel.perNightPrice,
            total: hotel.perNightPrice,
            features: selectedRoomType.features || ["City View", "Free WiFi"],
            maxOccupancy: 2,
            bedType: "Twin Beds",
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
        />
      )}
    </div>
  );
}
