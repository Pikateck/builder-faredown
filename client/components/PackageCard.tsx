import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Star,
  Users,
  Clock,
  Plane,
  Heart,
  Tag,
  Eye,
  TrendingDown,
  CheckCircle,
  Shield,
} from "lucide-react";
import { format } from "date-fns";

interface Package {
  id: number;
  slug: string;
  title: string;
  region_name: string;
  country_name: string;
  duration_days: number;
  duration_nights: number;
  from_price: number;
  currency: string;
  next_departure_date: string;
  available_departures_count: number;
  hero_image_url: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
  tags: string[];
  highlights: string[];
  category: string;
}

interface PackageCardProps {
  package: Package;
}

export function PackageCard({ package: pkg }: PackageCardProps) {
  const formatPrice = (price: number, currency: string = "INR") => {
    if (currency === "INR") {
      return `₹${price.toLocaleString()}`;
    }
    return `${currency} ${price.toLocaleString()}`;
  };

  // Calculate total price and per person price (assuming 2 adults by default)
  const adults = 2;
  const totalPrice = pkg.from_price * adults;
  const pricePerPerson = pkg.from_price;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-white border border-gray-200">
      {/* Image Section */}
      <div className="relative">
        <Link to={`/packages/${pkg.slug}`}>
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={
                pkg.hero_image_url ||
                `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format`
              }
              alt={pkg.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {pkg.is_featured && (
            <Badge className="bg-yellow-500 text-black text-xs font-semibold px-2 py-1">
              Featured
            </Badge>
          )}
          {pkg.category && (
            <Badge variant="secondary" className="text-xs px-2 py-1 capitalize">
              {pkg.category}
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
          <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
        </button>

        {/* Price Badge */}
        <div className="absolute bottom-3 right-3 bg-white rounded-lg px-3 py-2 shadow-lg">
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900 mb-1">
              {formatPrice(totalPrice)}
            </div>
            <div className="text-xs text-gray-600">
              {formatPrice(pricePerPerson)} per person
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3">
          <Link
            to={`/packages/${pkg.slug}`}
            className="block hover:text-blue-600 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
              {pkg.title}
            </h3>
          </Link>

          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">
              {pkg.region_name}
              {pkg.country_name && ` • ${pkg.country_name}`}
            </span>
          </div>

          {/* Rating */}
          {pkg.rating > 0 && (
            <div className="flex items-center text-sm">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <span className="font-medium text-gray-900">{pkg.rating}</span>
              <span className="text-gray-600 ml-1">
                ({pkg.review_count} reviews)
              </span>
            </div>
          )}
        </div>

        {/* Package Details */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-blue-500" />
            <span>
              {pkg.duration_days}D/{pkg.duration_nights}N
            </span>
          </div>

          {pkg.next_departure_date && (
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-green-500" />
              <span className="truncate">
                {formatDate(pkg.next_departure_date)}
              </span>
            </div>
          )}

          <div className="flex items-center text-gray-600">
            <Plane className="w-4 h-4 mr-2 text-purple-500" />
            <span>{pkg.available_departures_count} departures</span>
          </div>

          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2 text-orange-500" />
            <span>Group tour</span>
          </div>
        </div>

        {/* Highlights */}
        {pkg.highlights && pkg.highlights.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Highlights:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {pkg.highlights.slice(0, 3).map((highlight, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5 mr-2" />
                  <span className="line-clamp-1">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Features */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>Free cancellation</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>Reserve now, pay later</span>
          </div>
        </div>

        {/* Tags */}
        {pkg.tags && pkg.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {pkg.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs px-2 py-1 text-gray-600 border-gray-300"
              >
                {tag}
              </Badge>
            ))}
            {pkg.tags.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs px-2 py-1 text-gray-500 border-gray-300"
              >
                +{pkg.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link to={`/packages/${pkg.slug}`} className="flex-1">
            <button
              style={{
                backgroundColor: "#003580",
                color: "#ffffff",
                border: "1px solid #003580",
                borderRadius: "6px",
                padding: "10px 16px",
                fontWeight: "600",
                fontSize: "13px",
                minHeight: "40px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,53,128,0.15)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#002a66";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,53,128,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#003580";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,53,128,0.15)";
              }}
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
          </Link>
          <button
            style={{
              backgroundColor: "#febb02",
              color: "#000000",
              border: "none",
              borderRadius: "6px",
              padding: "10px 16px",
              fontWeight: "600",
              fontSize: "13px",
              minHeight: "40px",
              width: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            Bargain
          </button>
        </div>

      </CardContent>
    </Card>
  );
}
