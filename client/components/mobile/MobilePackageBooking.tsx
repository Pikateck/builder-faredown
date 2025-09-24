import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  X,
  MapPin,
  Clock,
  Calendar,
  Users,
  Plane,
  TrendingDown,
  CheckCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface PackageDeparture {
  id: number;
  departure_city_code: string;
  departure_city_name: string;
  departure_date: string;
  return_date?: string;
  price_per_person: number;
  single_supplement: number;
  child_price: number;
  currency: string;
  available_seats: number;
  is_guaranteed: boolean;
}

interface PackageDetails {
  id: number;
  slug: string;
  title: string;
  region_name: string;
  country_name: string;
  duration_days: number;
  duration_nights: number;
  overview: string;
  hero_image_url: string;
  category: string;
  highlights: string[];
}

interface MobilePackageBookingProps {
  package: PackageDetails;
  departure: PackageDeparture | null;
  travelers: {
    adults: number;
    children: number;
  };
  onClose: () => void;
}

export function MobilePackageBooking({
  package: pkg,
  departure,
  travelers,
  onClose,
}: MobilePackageBookingProps) {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [currentStep, setCurrentStep] = useState(1);

  const totalPrice = departure
    ? departure.price_per_person * travelers.adults +
      (departure.child_price || departure.price_per_person * 0.75) * travelers.children
    : 0;

  const handleProceedToBooking = () => {
    navigate(`/packages/${pkg.slug}/booking`, {
      state: {
        package: pkg,
        departure,
        travelers,
      },
    });
    onClose();
  };

  const handleStartBargain = () => {
    // Close modal and trigger bargain
    onClose();
    // The parent component should handle opening the bargain modal
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Book Package</h2>
            <p className="text-sm text-gray-600">Complete your booking</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Package Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-3">
                <img
                  src={
                    pkg.hero_image_url ||
                    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop&auto=format"
                  }
                  alt={pkg.title}
                  className="w-20 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm line-clamp-2">{pkg.title}</h3>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {pkg.region_name}
                    {pkg.country_name && ` • ${pkg.country_name}`}
                  </div>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {pkg.duration_days}D/{pkg.duration_nights}N
                  </div>
                  {pkg.category && (
                    <Badge variant="secondary" className="text-xs mt-2">
                      {pkg.category}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Departure Details */}
          {departure && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Selected Departure</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Plane className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-sm">From {departure.departure_city_name}</span>
                    </div>
                    {departure.is_guaranteed && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Guaranteed
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-green-500" />
                    <span className="text-sm">
                      {format(parseISO(departure.departure_date), "MMM d, yyyy")}
                      {departure.return_date && (
                        <span> - {format(parseISO(departure.return_date), "MMM d, yyyy")}</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-500" />
                    <span className="text-sm">
                      {departure.available_seats} seats available
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Travelers */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Travelers</h4>
              <div className="flex items-center justify-between text-sm">
                <span>Adults: {travelers.adults}</span>
                <span>Children: {travelers.children}</span>
              </div>
            </CardContent>
          </Card>

          {/* Highlights */}
          {pkg.highlights && pkg.highlights.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Package Highlights</h4>
                <div className="space-y-2">
                  {pkg.highlights.slice(0, 4).map((highlight, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{highlight}</span>
                    </div>
                  ))}
                  {pkg.highlights.length > 4 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{pkg.highlights.length - 4} more highlights
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Breakdown */}
          {departure && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Price Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Adults ({travelers.adults})</span>
                    <span>
                      {formatPrice(departure.price_per_person * travelers.adults, departure.currency)}
                    </span>
                  </div>
                  
                  {travelers.children > 0 && (
                    <div className="flex justify-between">
                      <span>Children ({travelers.children})</span>
                      <span>
                        {formatPrice(
                          (departure.child_price || departure.price_per_person * 0.75) * travelers.children,
                          departure.currency
                        )}
                      </span>
                    </div>
                  )}
                  
                  <hr className="my-2" />
                  
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span className="text-blue-600">
                      {formatPrice(totalPrice, departure.currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pb-6">
            <Button
              onClick={handleProceedToBooking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              disabled={!departure}
            >
              Continue to Booking
            </Button>
            
            <Button
              onClick={handleStartBargain}
              variant="outline"
              className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 py-3"
              disabled={!departure}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Try Bargaining First
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
