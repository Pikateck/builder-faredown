import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CountrySelect } from "@/components/ui/country-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Star,
  MessageSquare,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import useCountries from "@/hooks/useCountries";

// Rating categories configuration
const RATING_CATEGORIES = [
  { key: "staff_rating", label: "Staff" },
  { key: "cleanliness_rating", label: "Cleanliness" },
  { key: "value_rating", label: "Value for money" },
  { key: "wifi_rating", label: "Free WiFi" },
  { key: "facilities_rating", label: "Facilities" },
  { key: "comfort_rating", label: "Comfort" },
  { key: "location_rating", label: "Location" },
];

const TRIP_TYPES = ["Leisure", "Business", "Family", "Couple", "Solo"];

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: {
    id: string;
    name: string;
    roomTypes?: { id: string; name: string }[];
  };
  searchDates?: {
    checkIn?: string;
    checkOut?: string;
  };
}

interface ReviewForm {
  overall_rating: number;
  staff_rating: number;
  cleanliness_rating: number;
  value_rating: number;
  wifi_rating: number;
  facilities_rating: number;
  comfort_rating: number;
  location_rating: number;
  title: string;
  body: string;
  trip_type: string;
  room_type: string;
  country_code: string;
  stay_start: string;
  stay_end: string;
  reviewer_name: string;
}

const StarRating: React.FC<{
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
}> = ({ rating, onRatingChange, size = "md", label }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hoverRating || rating);
        return (
          <Star
            key={star}
            className={`${sizeClasses[size]} cursor-pointer touch-manipulation transition-all duration-150 ${
              isActive
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300 hover:text-yellow-400"
            }`}
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          />
        );
      })}
      {label && <span className="ml-2 text-sm text-gray-600">{label}</span>}
    </div>
  );
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  hotel,
  searchDates,
}) => {
  const { user } = useAuth();
  const { countries } = useCountries({ autoFetch: true });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with defaults
  const [form, setForm] = useState<ReviewForm>({
    overall_rating: 0,
    staff_rating: 0,
    cleanliness_rating: 0,
    value_rating: 0,
    wifi_rating: 0,
    facilities_rating: 0,
    comfort_rating: 0,
    location_rating: 0,
    title: "",
    body: "",
    trip_type: "",
    room_type: "",
    country_code: "",
    stay_start: "",
    stay_end: "",
    reviewer_name: "",
  });

  // Prefill form when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultStayStart = searchDates?.checkIn || "";
      const defaultStayEnd = searchDates?.checkOut || "";

      setForm((prev) => ({
        ...prev,
        reviewer_name: user?.name || user?.firstName || "",
        country_code: user?.country_code || "",
        stay_start: defaultStayStart,
        stay_end: defaultStayEnd,
      }));
      setErrors({});
    }
  }, [isOpen, user, searchDates]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (form.overall_rating === 0) {
      newErrors.overall_rating = "Overall rating is required";
    }

    if (!form.title.trim() || form.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (form.title.length > 200) {
      newErrors.title = "Title must be under 200 characters";
    }

    if (!form.body.trim() || form.body.length < 50) {
      newErrors.body = "Review must be at least 50 characters";
    } else if (form.body.length > 2000) {
      newErrors.body = "Review must be under 2000 characters";
    }

    if (!form.reviewer_name.trim()) {
      newErrors.reviewer_name = "Name is required";
    }

    if (!form.country_code) {
      newErrors.country_code = "Country is required";
    }

    if (!form.stay_start) {
      newErrors.stay_start = "Stay start date is required";
    }

    if (!form.stay_end) {
      newErrors.stay_end = "Stay end date is required";
    }

    if (
      form.stay_start &&
      form.stay_end &&
      new Date(form.stay_start) >= new Date(form.stay_end)
    ) {
      newErrors.stay_end = "End date must be after start date";
    }

    if (!form.trip_type) {
      newErrors.trip_type = "Trip type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors and try again",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/properties/${hotel.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "guest",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Review Submitted!",
          description: "Your review has been submitted and is pending approval",
          variant: "default",
        });
        onClose();

        // Reset form
        setForm({
          overall_rating: 0,
          staff_rating: 0,
          cleanliness_rating: 0,
          value_rating: 0,
          wifi_rating: 0,
          facilities_rating: 0,
          comfort_rating: 0,
          location_rating: 0,
          title: "",
          body: "",
          trip_type: "",
          room_type: "",
          country_code: "",
          stay_start: "",
          stay_end: "",
          reviewer_name: "",
        });
      } else {
        throw new Error(result.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Submission Failed",
        description:
          error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is valid for submit button
  const isFormValid =
    form.overall_rating > 0 &&
    form.title.trim().length >= 3 &&
    form.body.trim().length >= 50 &&
    form.reviewer_name.trim() &&
    form.country_code &&
    form.stay_start &&
    form.stay_end &&
    form.trip_type;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg md:text-xl font-bold flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
            Write a review for {hotel.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Overall Rating */}
          <div>
            <Label className="text-sm font-medium text-gray-900">
              Overall rating *
            </Label>
            <div className="mt-2">
              <StarRating
                rating={form.overall_rating}
                onRatingChange={(rating) =>
                  setForm((prev) => ({ ...prev, overall_rating: rating }))
                }
                size="lg"
              />
            </div>
            {errors.overall_rating && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.overall_rating}
              </p>
            )}
          </div>

          {/* Category Ratings */}
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-3 block">
              Rate your experience
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RATING_CATEGORIES.map((category) => (
                <div
                  key={category.key}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {category.label}
                  </span>
                  <StarRating
                    rating={form[category.key as keyof ReviewForm] as number}
                    onRatingChange={(rating) =>
                      setForm((prev) => ({ ...prev, [category.key]: rating }))
                    }
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Review Title */}
          <div>
            <Label
              htmlFor="title"
              className="text-sm font-medium text-gray-900"
            >
              Review title *
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Give your review a title"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className={`mt-2 ${errors.title ? "border-red-500" : ""}`}
              maxLength={200}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.title && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.title}
                </p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {form.title.length}/200
              </p>
            </div>
          </div>

          {/* Review Body */}
          <div>
            <Label htmlFor="body" className="text-sm font-medium text-gray-900">
              Tell us about your experience *
            </Label>
            <Textarea
              id="body"
              placeholder="Share your experience to help other travelers"
              value={form.body}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, body: e.target.value }))
              }
              className={`mt-2 min-h-[100px] ${errors.body ? "border-red-500" : ""}`}
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.body && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.body}
                </p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {form.body.length}/2000{" "}
                {form.body.length < 50 && `(minimum 50)`}
              </p>
            </div>
          </div>

          {/* Personal Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="reviewer_name"
                className="text-sm font-medium text-gray-900"
              >
                Your name *
              </Label>
              <Input
                id="reviewer_name"
                type="text"
                placeholder="Enter your name"
                value={form.reviewer_name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    reviewer_name: e.target.value,
                  }))
                }
                className={`mt-2 ${errors.reviewer_name ? "border-red-500" : ""}`}
              />
              {errors.reviewer_name && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.reviewer_name}
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-900">
                Country *
              </Label>
              <div className="mt-2">
                <CountrySelect
                  value={form.country_code}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, country_code: value }))
                  }
                  placeholder="Select your country"
                  className={errors.country_code ? "border-red-500" : ""}
                />
              </div>
              {errors.country_code && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.country_code}
                </p>
              )}
            </div>
          </div>

          {/* Stay Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="stay_start"
                className="text-sm font-medium text-gray-900"
              >
                Stay start date *
              </Label>
              <Input
                id="stay_start"
                type="date"
                value={form.stay_start}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, stay_start: e.target.value }))
                }
                className={`mt-2 ${errors.stay_start ? "border-red-500" : ""}`}
              />
              {errors.stay_start && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.stay_start}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="stay_end"
                className="text-sm font-medium text-gray-900"
              >
                Stay end date *
              </Label>
              <Input
                id="stay_end"
                type="date"
                value={form.stay_end}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, stay_end: e.target.value }))
                }
                className={`mt-2 ${errors.stay_end ? "border-red-500" : ""}`}
              />
              {errors.stay_end && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.stay_end}
                </p>
              )}
            </div>
          </div>

          {/* Room Type */}
          <div>
            <Label className="text-sm font-medium text-gray-900">
              Room type (optional)
            </Label>
            <Select
              value={form.room_type}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, room_type: value }))
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {hotel.roomTypes?.map((room) => (
                  <SelectItem key={room.id} value={room.name}>
                    {room.name}
                  </SelectItem>
                )) || (
                  <>
                    <SelectItem value="Standard Room">Standard Room</SelectItem>
                    <SelectItem value="Deluxe Room">Deluxe Room</SelectItem>
                    <SelectItem value="Suite">Suite</SelectItem>
                    <SelectItem value="Family Room">Family Room</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Trip Type */}
          <div>
            <Label className="text-sm font-medium text-gray-900">
              Type of trip *
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TRIP_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={form.trip_type === type ? "default" : "outline"}
                  className={`px-4 py-2 text-sm transition-all duration-200 ${
                    form.trip_type === type
                      ? "bg-blue-600 text-white"
                      : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                  }`}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, trip_type: type }))
                  }
                >
                  {type}
                </Button>
              ))}
            </div>
            {errors.trip_type && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.trip_type}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
