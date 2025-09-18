import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Star,
  ThumbsUp,
  Flag,
  ChevronDown,
  Filter,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Review {
  id: string;
  overall_rating: number;
  staff_rating?: number;
  cleanliness_rating?: number;
  value_rating?: number;
  facilities_rating?: number;
  comfort_rating?: number;
  location_rating?: number;
  wifi_rating?: number;
  title: string;
  body: string;
  trip_type: string;
  room_type?: string;
  country_code: string;
  stay_start: string;
  stay_end: string;
  verified_stay: boolean;
  helpful_count: number;
  reported_count: number;
  reviewer_name: string;
  reviewer_country_name: string;
  created_at: string;
  response_body?: string;
  response_date?: string;
  photo_count: number;
}

interface ReviewSummary {
  total_approved: number;
  total_verified: number;
  avg_overall: number;
  avg_staff?: number;
  avg_cleanliness?: number;
  avg_value?: number;
  avg_facilities?: number;
  avg_comfort?: number;
  avg_location?: number;
  avg_wifi?: number;
  leisure_count: number;
  business_count: number;
  family_count: number;
  couple_count: number;
  solo_count: number;
}

interface ReviewsSectionProps {
  propertyId: string;
  onWriteReviewClick: () => void;
}

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "top", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
  { value: "helpful", label: "Most Helpful" },
];

const FILTER_OPTIONS = [
  { value: "all", label: "All Reviews" },
  { value: "verified", label: "Verified Stays Only" },
];

const TRIP_TYPE_OPTIONS = [
  { value: "", label: "All Trip Types" },
  { value: "Leisure", label: "Leisure" },
  { value: "Business", label: "Business" },
  { value: "Family", label: "Family" },
  { value: "Couple", label: "Couple" },
  { value: "Solo", label: "Solo Travel" },
];

const StarDisplay: React.FC<{ rating: number; size?: "sm" | "md" }> = ({
  rating,
  size = "sm",
}) => {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

const RatingBar: React.FC<{
  label: string;
  rating?: number;
  maxRating?: number;
}> = ({ label, rating, maxRating = 5 }) => {
  if (!rating) return null;

  const percentage = (rating / maxRating) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700 w-20">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-900 w-8">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

const ReviewCard: React.FC<{
  review: Review;
  onHelpfulClick: (reviewId: string) => void;
  onReportClick: (reviewId: string) => void;
  isLoadingAction: boolean;
}> = ({ review, onHelpfulClick, onReportClick, isLoadingAction }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysBetween = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {review.reviewer_name}
                </span>
                {review.verified_stay && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified Stay
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-3 h-3" />
                {review.reviewer_country_name}
                {review.trip_type && (
                  <>
                    <span>•</span>
                    <span>{review.trip_type}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <StarDisplay rating={review.overall_rating} />
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(review.created_at)}
            </p>
          </div>
        </div>

        {/* Review Title */}
        <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>

        {/* Review Body */}
        <p className="text-gray-700 mb-4 leading-relaxed">{review.body}</p>

        {/* Stay Details */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              Stayed {getDaysBetween(review.stay_start, review.stay_end)} nights
              in{" "}
              {new Date(review.stay_start).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          {review.room_type && (
            <>
              <span>•</span>
              <span>{review.room_type}</span>
            </>
          )}
        </div>

        {/* Category Ratings */}
        {(review.staff_rating ||
          review.cleanliness_rating ||
          review.value_rating) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            {review.staff_rating && (
              <div className="text-center">
                <StarDisplay rating={review.staff_rating} />
                <p className="text-xs text-gray-600 mt-1">Staff</p>
              </div>
            )}
            {review.cleanliness_rating && (
              <div className="text-center">
                <StarDisplay rating={review.cleanliness_rating} />
                <p className="text-xs text-gray-600 mt-1">Cleanliness</p>
              </div>
            )}
            {review.value_rating && (
              <div className="text-center">
                <StarDisplay rating={review.value_rating} />
                <p className="text-xs text-gray-600 mt-1">Value</p>
              </div>
            )}
            {review.location_rating && (
              <div className="text-center">
                <StarDisplay rating={review.location_rating} />
                <p className="text-xs text-gray-600 mt-1">Location</p>
              </div>
            )}
          </div>
        )}

        {/* Property Response */}
        {review.response_body && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-medium text-blue-900 mb-2">
              Response from property
            </h4>
            <p className="text-blue-800 text-sm">{review.response_body}</p>
            <p className="text-xs text-blue-600 mt-2">
              {formatDate(review.response_date!)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onHelpfulClick(review.id)}
              disabled={isLoadingAction}
              className="text-gray-600 hover:text-blue-600"
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Helpful ({review.helpful_count})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReportClick(review.id)}
              disabled={isLoadingAction}
              className="text-gray-600 hover:text-red-600"
            >
              <Flag className="w-4 h-4 mr-1" />
              Report
            </Button>
          </div>
          {review.photo_count > 0 && (
            <Badge variant="outline" className="text-xs">
              {review.photo_count} photo{review.photo_count > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  propertyId,
  onWriteReviewClick,
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    sort: "recent",
    filter: "all",
    trip_type: "",
  });

  // Fetch reviews
  const fetchReviews = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        sort: filters.sort,
        filter: filters.filter,
        ...(filters.trip_type && { trip_type: filters.trip_type }),
      });

      const response = await fetch(
        `/api/properties/${propertyId}/reviews?${params}`,
      );
      const result = await response.json();

      if (result.success) {
        setReviews(result.data.reviews);
        setSummary(result.data.summary);
        setCurrentPage(result.data.pagination.page);
        setTotalPages(result.data.pagination.pages);
      } else {
        throw new Error(result.error || "Failed to fetch reviews");
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load reviews when filters change
  useEffect(() => {
    fetchReviews(1);
  }, [propertyId, filters]);

  // Handle helpful click
  const handleHelpfulClick = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to mark reviews as helpful",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAction(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: {
          "X-User-ID": user.id,
        },
      });

      const result = await response.json();

      if (result.success) {
        // Update the review in the list
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? { ...review, helpful_count: result.data.helpful_count }
              : review,
          ),
        );

        toast({
          title: "Thank you!",
          description: "Review marked as helpful",
          variant: "default",
        });
      } else {
        throw new Error(result.error || "Failed to mark as helpful");
      }
    } catch (error) {
      console.error("Error marking helpful:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to mark as helpful",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Handle report click
  const handleReportClick = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to report reviews",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAction(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id,
        },
        body: JSON.stringify({ reason: "Reported by user" }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Reported",
          description: "Review has been reported for moderation",
          variant: "default",
        });
      } else {
        throw new Error(result.error || "Failed to report review");
      }
    } catch (error) {
      console.error("Error reporting review:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to report review",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {summary && summary.total_approved > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold text-gray-900">
                    {summary.avg_overall?.toFixed(1) || "N/A"}
                  </div>
                  <div>
                    <StarDisplay
                      rating={Math.round(summary.avg_overall || 0)}
                      size="md"
                    />
                    <p className="text-sm text-gray-600">
                      Based on {summary.total_approved} review
                      {summary.total_approved > 1 ? "s" : ""}
                    </p>
                    {summary.total_verified > 0 && (
                      <p className="text-xs text-gray-500">
                        {summary.total_verified} verified stay
                        {summary.total_verified > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Ratings */}
              <div className="space-y-2">
                <RatingBar label="Staff" rating={summary.avg_staff} />
                <RatingBar
                  label="Cleanliness"
                  rating={summary.avg_cleanliness}
                />
                <RatingBar label="Value" rating={summary.avg_value} />
                <RatingBar label="Facilities" rating={summary.avg_facilities} />
                <RatingBar label="Comfort" rating={summary.avg_comfort} />
                <RatingBar label="Location" rating={summary.avg_location} />
                <RatingBar label="Free WiFi" rating={summary.avg_wifi} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with Write Review Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Guest Reviews</h2>
        <Button
          onClick={onWriteReviewClick}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Write a Review
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={filters.sort}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, sort: value }))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.filter}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, filter: value }))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.trip_type}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, trip_type: value }))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIP_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-600 mb-4">
              Be the first to share your experience at this property.
            </p>
            <Button onClick={onWriteReviewClick}>Write the First Review</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpfulClick={handleHelpfulClick}
              onReportClick={handleReportClick}
              isLoadingAction={isLoadingAction}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => fetchReviews(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchReviews(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewsSection;
