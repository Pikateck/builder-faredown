import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Star,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Calendar,
  MapPin,
  Flag,
  ThumbsUp,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  Loader2,
  MoreHorizontal,
} from "lucide-react";

interface Review {
  id: string;
  property_id: number;
  user_id?: string;
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
  status: "pending" | "approved" | "rejected";
  helpful_count: number;
  reported_count: number;
  reviewer_name: string;
  reviewer_country_name: string;
  created_at: string;
  updated_at?: string;
  response_body?: string;
  response_date?: string;
}

interface AdminStats {
  total_reviews: number;
  pending_reviews: number;
  approved_reviews: number;
  rejected_reviews: number;
  verified_reviews: number;
  reported_reviews: number;
  avg_rating: number;
  reviews_last_24h: number;
  reviews_last_7d: number;
}

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

const ReviewCard: React.FC<{
  review: Review;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRespond: (id: string) => void;
  isLoading: boolean;
}> = ({ review, onApprove, onReject, onRespond, isLoading }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
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
                    Verified
                  </Badge>
                )}
                <Badge className={`text-xs ${getStatusColor(review.status)}`}>
                  {review.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-3 h-3" />
                {review.reviewer_country_name}
                <span>•</span>
                <span>{review.trip_type}</span>
                {review.room_type && (
                  <>
                    <span>•</span>
                    <span>{review.room_type}</span>
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

        {/* Review Content */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
          <p className="text-gray-700 leading-relaxed">{review.body}</p>
        </div>

        {/* Stay Details */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {getDaysBetween(review.stay_start, review.stay_end)} nights •{" "}
              {new Date(review.stay_start).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
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
              Property Response
            </h4>
            <p className="text-blue-800 text-sm">{review.response_body}</p>
            <p className="text-xs text-blue-600 mt-2">
              {formatDate(review.response_date!)}
            </p>
          </div>
        )}

        {/* Metrics */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            <span>{review.helpful_count} helpful</span>
          </div>
          {review.reported_count > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <Flag className="w-3 h-3" />
              <span>{review.reported_count} reports</span>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {review.status === "pending" && (
              <>
                <Button
                  size="sm"
                  onClick={() => onApprove(review.id)}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(review.id)}
                  disabled={isLoading}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRespond(review.id)}
              disabled={isLoading}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              {review.response_body ? "Edit Response" : "Respond"}
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            ID: {review.id.slice(0, 8)}...
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatsCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, icon, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ResponseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  existingResponse?: string;
  onSubmit: (reviewId: string, response: string) => void;
  isSubmitting: boolean;
}> = ({
  isOpen,
  onClose,
  reviewId,
  existingResponse,
  onSubmit,
  isSubmitting,
}) => {
  const [response, setResponse] = useState(existingResponse || "");

  useEffect(() => {
    setResponse(existingResponse || "");
  }, [existingResponse, isOpen]);

  const handleSubmit = () => {
    if (response.trim().length < 10) {
      toast({
        title: "Error",
        description: "Response must be at least 10 characters long",
        variant: "destructive",
      });
      return;
    }
    onSubmit(reviewId, response.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingResponse ? "Edit Response" : "Respond to Review"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your response
            </label>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write a professional response to this review..."
              className="min-h-[100px]"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {response.length}/1000 characters
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Response"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ReviewModerationPanel: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "pending",
    property_id: "",
    verified: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [responseModal, setResponseModal] = useState({
    isOpen: false,
    reviewId: "",
    existingResponse: "",
  });

  // Fetch admin stats
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/reviews/stats", {
        headers: {
          "X-User-ID": "admin", // Replace with actual admin auth
        },
      });
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch reviews for moderation
  const fetchReviews = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...filters,
      });

      const response = await fetch(`/api/admin/reviews?${params}`, {
        headers: {
          "X-User-ID": "admin", // Replace with actual admin auth
        },
      });
      const result = await response.json();

      if (result.success) {
        setReviews(result.data);
        setCurrentPage(page);
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

  // Load data on mount and filter changes
  useEffect(() => {
    fetchStats();
    fetchReviews(1);
  }, [filters]);

  // Handle review approval
  const handleApprove = async (reviewId: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
        method: "POST",
        headers: {
          "X-User-ID": "admin",
        },
      });

      const result = await response.json();

      if (result.success) {
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? { ...review, status: "approved" as const }
              : review,
          ),
        );

        toast({
          title: "Success",
          description: "Review approved successfully",
          variant: "default",
        });

        // Refresh stats
        fetchStats();
      } else {
        throw new Error(result.error || "Failed to approve review");
      }
    } catch (error) {
      console.error("Error approving review:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to approve review",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle review rejection
  const handleReject = async (reviewId: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": "admin",
        },
        body: JSON.stringify({ reason: "Rejected by admin" }),
      });

      const result = await response.json();

      if (result.success) {
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? { ...review, status: "rejected" as const }
              : review,
          ),
        );

        toast({
          title: "Success",
          description: "Review rejected",
          variant: "default",
        });

        // Refresh stats
        fetchStats();
      } else {
        throw new Error(result.error || "Failed to reject review");
      }
    } catch (error) {
      console.error("Error rejecting review:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to reject review",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle response submission
  const handleResponseSubmit = async (
    reviewId: string,
    responseText: string,
  ) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": "admin",
        },
        body: JSON.stringify({ body: responseText }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the review in the list
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? {
                  ...review,
                  response_body: responseText,
                  response_date: new Date().toISOString(),
                }
              : review,
          ),
        );

        setResponseModal({ isOpen: false, reviewId: "", existingResponse: "" });

        toast({
          title: "Success",
          description: "Response added successfully",
          variant: "default",
        });
      } else {
        throw new Error(result.error || "Failed to submit response");
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit response",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Open response modal
  const openResponseModal = (reviewId: string) => {
    const review = reviews.find((r) => r.id === reviewId);
    setResponseModal({
      isOpen: true,
      reviewId,
      existingResponse: review?.response_body || "",
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Review Moderation
          </h1>
          <p className="text-gray-600">Manage and moderate customer reviews</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Reviews
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Reviews"
            value={stats.total_reviews.toLocaleString()}
            icon={<MessageSquare className="w-6 h-6" />}
            color="blue"
          />
          <StatsCard
            title="Pending Review"
            value={stats.pending_reviews}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="yellow"
          />
          <StatsCard
            title="Avg Rating"
            value={stats.avg_rating ? stats.avg_rating.toFixed(1) : "N/A"}
            icon={<Star className="w-6 h-6" />}
            color="green"
          />
          <StatsCard
            title="Reported"
            value={stats.reported_reviews}
            icon={<Flag className="w-6 h-6" />}
            color="red"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Reviews</SelectItem>
                <SelectItem value="approved">Approved Reviews</SelectItem>
                <SelectItem value="rejected">Rejected Reviews</SelectItem>
                <SelectItem value="">All Reviews</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.verified}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, verified: value }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Reviews</SelectItem>
                <SelectItem value="true">Verified Only</SelectItem>
                <SelectItem value="false">Unverified Only</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Property ID"
              value={filters.property_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, property_id: e.target.value }))
              }
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reviews found
            </h3>
            <p className="text-gray-600">
              No reviews match your current filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onApprove={handleApprove}
              onReject={handleReject}
              onRespond={openResponseModal}
              isLoading={isActionLoading}
            />
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => fetchReviews(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">Page {currentPage}</span>
            <Button
              variant="outline"
              onClick={() => fetchReviews(currentPage + 1)}
              disabled={isLoading}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {/* Response Modal */}
      <ResponseModal
        isOpen={responseModal.isOpen}
        onClose={() =>
          setResponseModal({
            isOpen: false,
            reviewId: "",
            existingResponse: "",
          })
        }
        reviewId={responseModal.reviewId}
        existingResponse={responseModal.existingResponse}
        onSubmit={handleResponseSubmit}
        isSubmitting={isActionLoading}
      />
    </div>
  );
};

export default ReviewModerationPanel;
