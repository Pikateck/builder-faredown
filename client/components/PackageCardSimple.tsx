import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BargainButton } from "@/components/ui/BargainButton";
import {
  Calendar,
  MapPin,
  Star,
  Clock,
  Plane,
  Users,
  Tag,
  TrendingDown,
  Eye,
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

interface PackageCardSimpleProps {
  package: Package;
}

export function PackageCardSimple({ package: pkg }: PackageCardSimpleProps) {
  const navigate = useNavigate();

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/packages/${pkg.slug}`);
  };

  const handleBargainClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Bargain clicked for package:', pkg.slug);
  };
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Image */}
        <div className="h-48 relative">
          <img
            src={
              pkg.hero_image_url ||
              `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format`
            }
            alt={pkg.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
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

          {/* Price Badge */}
          <div className="absolute bottom-3 right-3 bg-white rounded-lg px-3 py-2 shadow-lg">
            <div className="text-right">
              <div className="text-xs text-gray-600">From</div>
              <div className="text-lg font-bold text-blue-600">
                {formatPrice(pkg.from_price, pkg.currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <Link
            to={`/packages/${pkg.slug}`}
            className="block hover:text-blue-600 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
              {pkg.title}
            </h3>
          </Link>
          
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{pkg.region_name}{pkg.country_name && ` • ${pkg.country_name}`}</span>
          </div>
          
          {pkg.rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center bg-blue-600 text-white px-2 py-1 rounded text-sm">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {pkg.rating}
              </div>
              <span className="text-sm text-gray-600">{pkg.review_count} reviews</span>
            </div>
          )}

          {/* Package Details */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-blue-500" />
              <span>{pkg.duration_days}D/{pkg.duration_nights}N</span>
            </div>
            
            {pkg.next_departure_date && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-green-500" />
                <span className="truncate">{formatDate(pkg.next_departure_date)}</span>
              </div>
            )}
          </div>

          {/* Highlights */}
          {pkg.highlights && pkg.highlights.length > 0 && (
            <div className="mb-4">
              <ul className="text-sm text-gray-600 space-y-1">
                {pkg.highlights.slice(0, 2).map((highlight, index) => (
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

          {/* Pricing Display */}
          <div className="mb-4 text-right">
            <div className="text-xl font-bold text-gray-900 mb-1">
              {formatPrice(totalPrice)}
            </div>
            <div className="text-sm text-gray-600">
              {formatPrice(pricePerPerson)} per person
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleViewDetails}
              style={{
                backgroundColor: "#003580",
                color: "#ffffff",
                border: "1px solid #003580",
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
            <BargainButton
              onClick={handleBargainClick}
              useEnhancedModal={true}
              module="sightseeing"
              itemName={pkg.title}
              supplierNetRate={totalPrice}
              itemDetails={{
                location: `${pkg.region_name}, ${pkg.country_name}`,
                provider: "Package Provider",
                features: pkg.highlights?.slice(0, 5) || []
              }}
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
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              Bargain
            </BargainButton>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Image */}
        <div className="w-64 h-48 relative flex-shrink-0">
          <img
            src={
              pkg.hero_image_url ||
              `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format`
            }
            alt={pkg.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {pkg.is_featured && (
              <Badge className="bg-yellow-500 text-black text-xs font-semibold px-2 py-1">
                Featured
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <Link
                to={`/packages/${pkg.slug}`}
                className="block hover:text-blue-600 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 text-xl mb-2 line-clamp-2">
                  {pkg.title}
                </h3>
              </Link>
              
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{pkg.region_name}{pkg.country_name && ` • ${pkg.country_name}`}</span>
              </div>
              
              {pkg.rating > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center bg-blue-600 text-white px-2 py-1 rounded text-sm">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {pkg.rating}
                  </div>
                  <span className="text-sm text-gray-600">{pkg.review_count} reviews</span>
                </div>
              )}
            </div>

            {/* Pricing Display */}
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatPrice(totalPrice)}
              </div>
              <div className="text-sm text-gray-600">
                {formatPrice(pricePerPerson)} per person
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-blue-500" />
              <span>{pkg.duration_days}D/{pkg.duration_nights}N</span>
            </div>
            
            {pkg.next_departure_date && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-green-500" />
                <span>{formatDate(pkg.next_departure_date)}</span>
              </div>
            )}

            <div className="flex items-center">
              <Plane className="w-4 h-4 mr-2 text-purple-500" />
              <span>{pkg.available_departures_count} departures</span>
            </div>
          </div>

          {/* Highlights */}
          {pkg.highlights && pkg.highlights.length > 0 && (
            <div className="mb-4 flex-1">
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

          {/* Action Buttons */}
          <div className="flex gap-3 mt-auto">
            <button
              onClick={handleViewDetails}
              style={{
                backgroundColor: "#003580",
                color: "#ffffff",
                border: "1px solid #003580",
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
            <BargainButton
              onClick={handleBargainClick}
              useEnhancedModal={true}
              module="sightseeing"
              itemName={pkg.title}
              supplierNetRate={totalPrice}
              itemDetails={{
                location: `${pkg.region_name}, ${pkg.country_name}`,
                provider: "Package Provider",
                features: pkg.highlights?.slice(0, 5) || []
              }}
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
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              Bargain
            </BargainButton>
          </div>
        </div>
      </div>
    </div>
  );
}
