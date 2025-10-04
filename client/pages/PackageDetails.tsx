import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ErrorBanner";
import { BargainButton } from "@/components/ui/BargainButton";
import { MobilePackageBooking } from "@/components/mobile/MobilePackageBooking";
import ConversationalBargainModal from "@/components/ConversationalBargainModal";
import { useBookNowGuard, createBookingContext } from "@/hooks/useBookNowGuard";
import { apiClient } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDateContext } from "@/contexts/DateContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  MapPin,
  Star,
  Clock,
  Users,
  Camera,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Calendar,
  Plane,
  Hotel,
  Utensils,
  Bus,
  ArrowLeft,
  MessageSquare,
  Phone,
  Info,
  Globe,
  Shield,
  Award,
  TrendingDown,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

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
  total_seats: number;
  is_guaranteed: boolean;
  early_bird_discount?: number;
  early_bird_deadline?: string;
  special_notes?: string;
}

interface PackageItineraryDay {
  day_number: number;
  title: string;
  description: string;
  cities?: string;
  meals_included?: string;
  accommodation?: string;
  activities?: string[];
  transport?: string;
}

interface PackageDetails {
  id: number;
  slug: string;
  title: string;
  region_name: string;
  country_name: string;
  city_name: string;
  duration_days: number;
  duration_nights: number;
  overview: string;
  description: string;
  highlights: string[];
  base_price_pp: number;
  currency: string;
  hero_image_url: string;
  gallery_images: string[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  category: string;
  themes: string[];
  inclusions: string[];
  exclusions: string[];
  terms_conditions: string;
  cancellation_policy: string;
  visa_required: boolean;
  passport_required: boolean;
  minimum_age: number;
  maximum_group_size: number;
  itinerary: PackageItineraryDay[];
  departures: PackageDeparture[];
  tags: string[];
  media: Array<{
    url: string;
    type: string;
    title?: string;
    alt_text?: string;
  }>;
  reviews_summary: {
    total_reviews: number;
    average_rating: number;
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
  };
  recent_reviews: Array<{
    rating: number;
    title: string;
    review_text: string;
    reviewer_name: string;
    reviewer_location: string;
    travel_date: string;
    traveler_type: string;
    created_at: string;
  }>;
}

export default function PackageDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [packageData, setPackageData] = useState<PackageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDeparture, setSelectedDeparture] =
    useState<PackageDeparture | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [travelers, setTravelers] = useState({ adults: 2, children: 0 });
  const [showBargainModal, setShowBargainModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Remove useApi hook - use apiClient directly
  const { formatPrice } = useCurrency();
  const { isAuthenticated } = useAuth();
  const { selectedDate } = useDateContext();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Book Now Guard
  const { handleBookNow: guardBookNow } = useBookNowGuard();

  // Fetch package details
  useEffect(() => {
    if (!slug) return;

    const fetchPackageDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiClient.get(`/packages/${slug}`);

        if (response.success) {
          console.log('📦 Package data received:', {
            title: response.data.title,
            hasDescription: !!response.data.description,
            hasOverview: !!response.data.overview,
            descriptionLength: response.data.description?.length || 0,
            overviewLength: response.data.overview?.length || 0,
            highlightsType: typeof response.data.highlights,
            highlightsLength: response.data.highlights?.length || 0,
            highlights: response.data.highlights,
            inclusionsLength: response.data.inclusions?.length || 0,
            exclusionsLength: response.data.exclusions?.length || 0
          });

          setPackageData(response.data);

          // Auto-select first available departure
          if (response.data.departures?.length > 0) {
            setSelectedDeparture(response.data.departures[0]);
          }
        } else {
          setError(response.error || "Package not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load package details");
      } finally {
        setLoading(false);
      }
    };

    fetchPackageDetails();
  }, [slug]);

  const handleBookNow = () => {
    if (!packageData || !selectedDeparture) return;

    const bookingContext = createBookingContext.package(
      packageData,
      selectedDeparture,
      travelers,
      {
        slug,
        selectedDate: selectedDeparture.departure_date,
      },
    );

    guardBookNow(bookingContext, () => {
      if (isMobile) {
        setShowBookingModal(true);
      } else {
        // Navigate to booking page
        navigate(`/packages/${slug}/booking`, {
          state: {
            package: packageData,
            departure: selectedDeparture,
            travelers,
          },
        });
      }
    });
  };

  const handleStartBargain = () => {
    if (!packageData || !selectedDeparture) return;
    setShowBargainModal(true);
  };

  const handleBargainAccept = (
    finalPrice: number,
    orderRef: string,
    holdData?: any,
  ) => {
    // Close the bargain modal
    setShowBargainModal(false);

    // Navigate to booking with bargained price
    navigate(`/packages/${slug}/booking`, {
      state: {
        package: packageData,
        departure: selectedDeparture,
        travelers,
        bargainedPrice: finalPrice,
        orderRef,
        holdData,
      },
    });
  };

  const handleBargainHold = (orderRef: string) => {
    // Handle price hold functionality
    console.log(`Price held with order reference: ${orderRef}`);
  };

  const handleBargainClose = () => {
    setShowBargainModal(false);
  };

  const images = packageData?.media?.filter((m) => m.type === "image") || [];
  const displayImages =
    images.length > 0
      ? images
      : [{ url: packageData?.hero_image_url, alt_text: packageData?.title }];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading package details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Package Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "The package you're looking for doesn't exist."}
            </p>
            <Button
              onClick={() => navigate("/packages")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Browse All Packages
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button onClick={() => navigate(-1)} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>

        {/* Hero Section */}
        <div className="relative h-64 md:h-96 bg-gradient-to-r from-blue-900 to-blue-600 rounded-xl overflow-hidden mb-6">
          <img
            src={
              packageData.hero_image_url ||
              packageData.media?.find((m) => m.type === "image")?.url ||
              (packageData.slug?.includes("paris")
                ? "https://images.pexels.com/photos/2564066/pexels-photo-2564066.jpeg?auto=compress&cs=tinysrgb&w=800"
                : packageData.slug?.includes("dubai")
                  ? "https://images.pexels.com/photos/19894545/pexels-photo-19894545.jpeg?auto=compress&cs=tinysrgb&w=800"
                  : packageData.slug?.includes("bali")
                    ? "https://images.pexels.com/photos/6965513/pexels-photo-6965513.jpeg?auto=compress&cs=tinysrgb&w=800"
                    : "https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?auto=compress&cs=tinysrgb&w=800")
            }
            alt={packageData.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F7456191e08dd4de1a7a13f9d335b9417?format=webp&width=800";
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>

          {/* Package Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {packageData.is_featured && (
                  <Badge className="bg-yellow-500 text-black">Featured</Badge>
                )}
                {packageData.category && (
                  <Badge
                    variant="secondary"
                    className="bg-white bg-opacity-20 text-white"
                  >
                    {packageData.category}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-bold mb-2">
                {packageData.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {packageData.region_name}
                  {packageData.country_name && ` • ${packageData.country_name}`}
                </div>

                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {packageData.duration_days}D/{packageData.duration_nights}N
                </div>

                {packageData.rating > 0 && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-current text-yellow-400" />
                    {packageData.rating} ({packageData.review_count} reviews)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Overview */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Package Overview</h2>
                <p className="text-gray-700 leading-relaxed">
                  {packageData.description || packageData.overview}
                </p>

                {packageData.highlights &&
                  packageData.highlights.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">Highlights</h3>
                      <ul className="space-y-2">
                        {packageData.highlights.map((highlight, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Itinerary */}
            {packageData.itinerary && packageData.itinerary.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Day-wise Itinerary
                  </h2>
                  <div className="space-y-6">
                    {packageData.itinerary.map((day) => (
                      <div
                        key={day.day_number}
                        className="border-l-2 border-blue-200 pl-4 pb-6 last:pb-0"
                      >
                        <div className="flex items-center mb-2">
                          <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold -ml-6 mr-3">
                            {day.day_number}
                          </div>
                          <h3 className="font-semibold text-lg">{day.title}</h3>
                        </div>

                        <p className="text-gray-700 mb-3">{day.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {day.cities && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                              <span>
                                <strong>Cities:</strong> {day.cities}
                              </span>
                            </div>
                          )}

                          {day.meals_included && (
                            <div className="flex items-center">
                              <Utensils className="w-4 h-4 mr-2 text-orange-500" />
                              <span>
                                <strong>Meals:</strong> {day.meals_included}
                              </span>
                            </div>
                          )}

                          {day.accommodation && (
                            <div className="flex items-center">
                              <Hotel className="w-4 h-4 mr-2 text-purple-500" />
                              <span>
                                <strong>Stay:</strong> {day.accommodation}
                              </span>
                            </div>
                          )}

                          {day.transport && (
                            <div className="flex items-center">
                              <Bus className="w-4 h-4 mr-2 text-green-500" />
                              <span>
                                <strong>Transport:</strong> {day.transport}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packageData.inclusions && packageData.inclusions.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 text-green-700">
                      ✓ Inclusions
                    </h3>
                    <ul className="space-y-2">
                      {packageData.inclusions.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {packageData.exclusions && packageData.exclusions.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 text-red-700">
                      ✗ Exclusions
                    </h3>
                    <ul className="space-y-2">
                      {packageData.exclusions.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <X className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Important Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Important Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-blue-500" />
                    <span>
                      <strong>Visa Required:</strong>{" "}
                      {packageData.visa_required ? "Yes" : "No"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-green-500" />
                    <span>
                      <strong>Passport Required:</strong>{" "}
                      {packageData.passport_required ? "Yes" : "No"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-500" />
                    <span>
                      <strong>Min Age:</strong> {packageData.minimum_age} years
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Award className="w-4 h-4 mr-2 text-orange-500" />
                    <span>
                      <strong>Max Group:</strong>{" "}
                      {packageData.maximum_group_size} people
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            {/* Price & Booking Card */}
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-600 mb-1">
                    Starting from
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(
                      selectedDeparture?.price_per_person ||
                        packageData.base_price_pp,
                      packageData.currency,
                    )}
                  </div>
                  <div className="text-sm text-gray-600">per person</div>
                </div>

                {/* Departure Selection */}
                {packageData.departures &&
                  packageData.departures.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Departure
                      </label>
                      <select
                        value={selectedDeparture?.id || ""}
                        onChange={(e) => {
                          const departure = packageData.departures.find(
                            (d) => d.id === parseInt(e.target.value),
                          );
                          setSelectedDeparture(departure || null);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        {packageData.departures.map((departure) => (
                          <option key={departure.id} value={departure.id}>
                            {departure.departure_city_name} -{" "}
                            {format(
                              parseISO(departure.departure_date),
                              "EEE, MMM d, yyyy",
                            )}
                            (
                            {formatPrice(
                              departure.price_per_person,
                              departure.currency,
                            )}
                            )
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                {/* Travelers */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Travelers
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Adults
                      </label>
                      <select
                        value={travelers.adults}
                        onChange={(e) =>
                          setTravelers((prev) => ({
                            ...prev,
                            adults: parseInt(e.target.value),
                          }))
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Children
                      </label>
                      <select
                        value={travelers.children}
                        onChange={(e) =>
                          setTravelers((prev) => ({
                            ...prev,
                            children: parseInt(e.target.value),
                          }))
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        {[0, 1, 2, 3, 4].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Total Price */}
                {selectedDeparture && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Adults ({travelers.adults})</span>
                        <span>
                          {formatPrice(
                            selectedDeparture.price_per_person *
                              travelers.adults,
                            selectedDeparture.currency,
                          )}
                        </span>
                      </div>
                      {travelers.children > 0 && (
                        <div className="flex justify-between">
                          <span>Children ({travelers.children})</span>
                          <span>
                            {formatPrice(
                              (selectedDeparture.child_price ||
                                selectedDeparture.price_per_person * 0.75) *
                                travelers.children,
                              selectedDeparture.currency,
                            )}
                          </span>
                        </div>
                      )}
                      <hr className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-blue-600">
                          {formatPrice(
                            selectedDeparture.price_per_person *
                              travelers.adults +
                              (selectedDeparture.child_price ||
                                selectedDeparture.price_per_person * 0.75) *
                                travelers.children,
                            selectedDeparture.currency,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleBookNow}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    disabled={!selectedDeparture}
                  >
                    Book Now
                  </Button>

                  <BargainButton
                    onClick={handleStartBargain}
                    className="w-full"
                    disabled={!selectedDeparture}
                  >
                    Start Bargaining
                  </BargainButton>
                </div>

                {/* Quick Info */}
                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                  <div>✓ Free cancellation up to 24 hours</div>
                  <div>✓ Instant confirmation</div>
                  <div>✓ 24/7 customer support</div>
                </div>

                {/* Always Visible Contact Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Phone className="w-4 h-4 text-blue-600 mr-2" />
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">
                        Need Help? Call toll-free
                      </p>
                      <a
                        href="tel:+18001234567"
                        className="text-lg font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        1-800-123-4567
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Booking Modal */}
        {isMobile && showBookingModal && (
          <MobilePackageBooking
            package={packageData}
            departure={selectedDeparture}
            travelers={travelers}
            onClose={() => setShowBookingModal(false)}
          />
        )}

        {/* Bargain Modal */}
        {showBargainModal && selectedDeparture && (
          <ConversationalBargainModal
            isOpen={showBargainModal}
            onClose={handleBargainClose}
            onAccept={handleBargainAccept}
            onHold={handleBargainHold}
            onBackToResults={handleBargainClose}
            module="packages"
            basePrice={
              selectedDeparture.price_per_person * travelers.adults +
              (selectedDeparture.child_price ||
                selectedDeparture.price_per_person * 0.75) *
                travelers.children
            }
            productRef={`package_${packageData.id}_departure_${selectedDeparture.id}`}
            userName={isAuthenticated ? undefined : "Guest"}
          />
        )}
      </div>
    </div>
  );
}
