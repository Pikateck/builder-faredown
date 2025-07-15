import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BookingSearchForm } from "@/components/BookingSearchForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  MapPin,
  Heart,
  Plane,
  Calendar,
  Users,
  TrendingUp,
  Award,
  Shield,
  Clock,
} from "lucide-react";

export default function Hotels() {
  const navigate = useNavigate();

  // Recent searches data
  const recentSearches = [
    {
      destination: "Dubai",
      dates: "Aug 1 - Aug 5",
      guests: "2 adults, 1 child",
      image:
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=100",
    },
    {
      destination: "Paris",
      dates: "Sep 15 - Sep 20",
      guests: "2 adults",
      image:
        "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=100",
    },
  ];

  // Interested properties data
  const interestedProperties = [
    {
      id: 1,
      name: "Grand Hyatt Dubai",
      location: "Dubai - Deira Creek",
      rating: 8.1,
      ratingText: "Excellent",
      reviews: 234,
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300",
      price: "₹32,850",
      originalPrice: "₹42,000",
      discount: 22,
    },
    {
      id: 2,
      name: "Marina Bay Hotel",
      location: "Dubai Marina",
      rating: 8.5,
      ratingText: "Wonderful",
      reviews: 156,
      image:
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=300",
      price: "₹28,500",
      originalPrice: "₹35,000",
      discount: 19,
    },
  ];

  // Special offers data
  const specialOffers = [
    {
      title: "Early Bird Special",
      description: "Book 30 days in advance and save up to 25%",
      discount: "Up to 25% OFF",
      validUntil: "Dec 31, 2024",
      image:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400",
    },
    {
      title: "Weekend Getaway",
      description: "Perfect for short breaks with exclusive weekend rates",
      discount: "Up to 20% OFF",
      validUntil: "Nov 30, 2024",
      image:
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400",
    },
  ];

  // Travel tips data
  const travelTips = [
    {
      title: "Best Time to Book Hotels",
      description:
        "Book hotels 2-4 weeks in advance for the best rates and availability.",
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
    },
    {
      title: "Loyalty Programs",
      description:
        "Join hotel loyalty programs for exclusive perks and room upgrades.",
      icon: <Award className="w-6 h-6 text-purple-600" />,
    },
    {
      title: "Travel Insurance",
      description:
        "Always consider travel insurance for peace of mind during your trips.",
      icon: <Shield className="w-6 h-6 text-green-600" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section with Search */}
      <div className="bg-[#003580] py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="mb-4">
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-semibold">
                🏨 AI Hotel Bargaining Available
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Find & Bargain Your Perfect Hotel Stay
            </h1>
            <p className="text-white text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Discover amazing hotels worldwide and{" "}
              <strong>negotiate the best prices</strong> with AI-powered
              bargaining
            </p>
          </div>

          {/* Hotel Search Form */}
          <div className="max-w-6xl mx-auto">
            <BookingSearchForm />
          </div>
        </div>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <section className="py-8 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your recent searches
            </h2>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  style={{ minWidth: "280px" }}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={search.image}
                      alt={search.destination}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {search.destination}
                      </div>
                      <div className="text-sm text-gray-600">
                        {search.dates}
                      </div>
                      <div className="text-sm text-gray-600">
                        {search.guests}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Interested Properties */}
      {interestedProperties.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Properties you might be interested in
              </h2>
              <Button variant="outline">View all</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interestedProperties.map((property) => (
                <Card
                  key={property.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/hotels/${property.id}`)}
                >
                  <div className="relative">
                    <img
                      src={property.image}
                      alt={property.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500 text-white">
                        -{property.discount}%
                      </Badge>
                    </div>
                    <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">
                      {property.name}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{property.location}</span>
                    </div>
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                        {property.rating}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {property.ratingText} ({property.reviews} reviews)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-blue-600">
                            {property.price}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {property.originalPrice}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">per night</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Special Offers */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Special Offers & Deals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specialOffers.map((offer, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-32 h-32 object-cover"
                  />
                  <CardContent className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{offer.title}</h3>
                      <Badge className="bg-green-500 text-white text-xs">
                        {offer.discount}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {offer.description}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      Valid until {offer.validUntil}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Travel Tips */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Travel Tips & Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {travelTips.map((tip, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="mb-4">{tip.icon}</div>
                  <h3 className="font-semibold text-lg mb-3">{tip.title}</h3>
                  <p className="text-gray-600 text-sm">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Faredown Hotels?
            </h2>
            <p className="text-gray-600 text-lg">
              Experience the future of hotel booking with AI-powered bargaining
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                AI Price Bargaining
              </h3>
              <p className="text-gray-600">
                Our AI negotiates the best hotel rates in real-time, saving you
                up to 30% on bookings.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Global Coverage</h3>
              <p className="text-gray-600">
                Access millions of hotels worldwide with verified reviews and
                instant confirmations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure Booking</h3>
              <p className="text-gray-600">
                Book with confidence using our secure payment system and free
                cancellation options.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
