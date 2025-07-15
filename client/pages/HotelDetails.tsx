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
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Phone,
  Mail,
  Clock,
  Check,
  TrendingDown,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatPriceWithSymbol, calculateTotalPrice } from "@/lib/pricing";

export default function HotelDetails() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { selectedCurrency } = useCurrency();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLiked, setIsLiked] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<any>(null);
  const [isBargainModalOpen, setIsBargainModalOpen] = useState(false);

  // Mock hotel data (in a real app, this would be fetched based on hotelId)
  const hotel = {
    id: parseInt(hotelId || "1"),
    name: "Grand Plaza Hotel",
    location: "Dubai, United Arab Emirates",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800",
    ],
    rating: 4.8,
    reviews: 1234,
    originalPrice: 299,
    currentPrice: 179,
    description:
      "Experience luxury in the heart of Dubai with stunning city views, world-class amenities, and exceptional service. Located in the prestigious downtown area, our hotel offers easy access to major attractions while providing a peaceful retreat.",
    amenities: [
      "Free WiFi",
      "Parking",
      "Restaurant",
      "Gym",
      "Pool",
      "Spa",
      "Room Service",
      "Concierge",
      "Laundry",
    ],
    features: [
      "City View",
      "Business Center",
      "24/7 Reception",
      "Airport Shuttle",
    ],
    address: "123 Sheikh Zayed Road, Downtown Dubai, Dubai, UAE",
    phone: "+971 4 123 4567",
    email: "info@grandplazadubai.com",
    checkIn: "3:00 PM",
    checkOut: "12:00 PM",
    roomTypes: [
      {
        name: "Standard Room",
        price: 179,
        features: ["King Bed", "City View", "Free WiFi", "Air Conditioning"],
        size: "35 sqm",
        maxGuests: 2,
      },
      {
        name: "Deluxe Suite",
        price: 259,
        features: ["King Bed", "City View", "Separate Living Area", "Minibar"],
        size: "55 sqm",
        maxGuests: 3,
      },
      {
        name: "Presidential Suite",
        price: 459,
        features: [
          "King Bed",
          "Panoramic View",
          "Butler Service",
          "Private Balcony",
        ],
        size: "85 sqm",
        maxGuests: 4,
      },
    ],
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + hotel.images.length) % hotel.images.length,
    );
  };

  const handleBooking = (roomType: any) => {
    navigate(
      `/hotels/booking?hotelId=${hotel.id}&roomType=${roomType.name}&price=${roomType.price}`,
    );
  };

  const handleBargainClick = (roomType: any) => {
    setSelectedRoomType(roomType);
    setIsBargainModalOpen(true);
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "gallery", label: "Gallery" },
    { id: "amenities", label: "Amenities" },
    { id: "reviews", label: "Reviews" },
    { id: "location", label: "Location" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <button
            onClick={() => navigate("/hotels/results")}
            className="hover:text-blue-600"
          >
            Hotels
          </button>
          <span className="mx-2">›</span>
          <span>Dubai</span>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium">{hotel.name}</span>
        </div>

        {/* Hotel Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Image Gallery */}
            <div className="lg:w-2/3">
              <div className="relative">
                <img
                  src={hotel.images[currentImageIndex]}
                  alt={hotel.name}
                  className="w-full h-80 lg:h-96 object-cover rounded-lg"
                />
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {hotel.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex
                          ? "bg-white"
                          : "bg-white bg-opacity-50"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Hotel Info */}
            <div className="lg:w-1/3">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {hotel.name}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{hotel.location}</span>
                  </div>
                  <div className="flex items-center mb-4">
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
                      <span className="ml-2 text-sm font-medium">
                        {hotel.rating}
                      </span>
                      <span className="ml-1 text-sm text-gray-600">
                        ({hotel.reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-2 rounded-full ${isLiked ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-full bg-gray-100 text-gray-600">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPriceWithSymbol(
                        hotel.currentPrice,
                        selectedCurrency.code,
                      )}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      per night
                    </span>
                  </div>
                  {hotel.originalPrice > hotel.currentPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatPriceWithSymbol(
                        hotel.originalPrice,
                        selectedCurrency.code,
                      )}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Includes taxes and fees
                </p>
              </div>

              {/* Quick Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span>
                    Check-in: {hotel.checkIn} | Check-out: {hotel.checkOut}
                  </span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{hotel.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{hotel.email}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  onClick={() =>
                    handleBargainClick(
                      hotel.roomTypes[0] || {
                        name: "Standard Room",
                        price: hotel.currentPrice,
                        features: ["King Bed", "City View"],
                        maxGuests: 2,
                      },
                    )
                  }
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Bargain Best Price
                </Button>
                <Button
                  onClick={() =>
                    handleBooking(
                      hotel.roomTypes[0] || {
                        name: "Standard Room",
                        price: hotel.currentPrice,
                      },
                    )
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    About this hotel
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {hotel.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Hotel Address</h3>
                  <p className="text-gray-700">{hotel.address}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Room Types</h3>
                  <div className="grid gap-4">
                    {hotel.roomTypes.map((room, index) => (
                      <Card key={index} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div className="lg:flex-1">
                              <h4 className="font-semibold text-lg mb-2">
                                {room.name}
                              </h4>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {room.features.map((feature, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span>Size: {room.size}</span>
                                <span className="mx-2">|</span>
                                <span>Max guests: {room.maxGuests}</span>
                              </div>
                            </div>
                            <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col items-start lg:items-end">
                              <div className="mb-2">
                                <span className="text-xl font-bold text-blue-600">
                                  {formatPriceWithSymbol(
                                    room.price,
                                    selectedCurrency.code,
                                  )}
                                </span>
                                <span className="text-sm text-gray-600 ml-1">
                                  per night
                                </span>
                              </div>
                              <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto">
                                <Button
                                  onClick={() => handleBargainClick(room)}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                                >
                                  <TrendingDown className="w-4 h-4 mr-1" />
                                  Bargain
                                </Button>
                                <Button
                                  onClick={() => handleBooking(room)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Book Now
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === "gallery" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotel.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${hotel.name} - Image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90"
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}

            {/* Amenities Tab */}
            {activeTab === "amenities" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Hotel Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Guest Reviews</h3>
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                      <span className="ml-2 font-medium">John D.</span>
                      <span className="ml-2 text-sm text-gray-600">
                        2 days ago
                      </span>
                    </div>
                    <p className="text-gray-700">
                      "Excellent hotel with amazing service. The location is
                      perfect and the rooms are very comfortable. Highly
                      recommended!"
                    </p>
                  </div>
                  <div className="border-b border-gray-200 pb-4">
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(4)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 text-yellow-400 fill-current"
                          />
                        ))}
                        <Star className="w-4 h-4 text-gray-300" />
                      </div>
                      <span className="ml-2 font-medium">Sarah M.</span>
                      <span className="ml-2 text-sm text-gray-600">
                        1 week ago
                      </span>
                    </div>
                    <p className="text-gray-700">
                      "Great hotel overall. The breakfast was fantastic and the
                      staff was very helpful. Minor issue with room cleaning but
                      everything else was perfect."
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === "location" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Location & Map</h3>
                <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-gray-500">
                    Interactive map would be displayed here
                  </span>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Address</h4>
                  <p className="text-gray-700">{hotel.address}</p>
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
            id: selectedRoomType.name.toLowerCase().replace(/\s+/g, "-"),
            name: selectedRoomType.name,
            description: selectedRoomType.features.join(", "),
            image: hotel.images[0],
            marketPrice: selectedRoomType.price * 1.2, // Simulate original price
            totalPrice: selectedRoomType.price,
            features: selectedRoomType.features,
            maxOccupancy: selectedRoomType.maxGuests,
            bedType: "King Bed",
          }}
          hotel={{
            id: hotel.id,
            name: hotel.name,
            location: hotel.location,
            rating: hotel.rating,
            image: hotel.images[0],
          }}
          isOpen={isBargainModalOpen}
          onClose={() => {
            setIsBargainModalOpen(false);
            setSelectedRoomType(null);
          }}
          checkInDate={new Date()}
          checkOutDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
          roomsCount={1}
        />
      )}
    </div>
  );
}
