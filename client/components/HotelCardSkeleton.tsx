/**
 * Hotel Card Skeleton
 * Shows loading placeholder while hotel metadata is being fetched
 * Displays "Fetching live prices..." state
 */

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function HotelCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-4 animate-in fade-in duration-300">
      {/* Image skeleton */}
      <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 h-48 w-full">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Hotel name skeleton */}
      <div className="mb-2">
        <Skeleton className="h-6 w-48 mb-2" />
      </div>

      {/* Star rating skeleton */}
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>

      {/* Address skeleton */}
      <div className="mb-3">
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Amenities skeleton */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Pricing section with "Fetching" state */}
      <div className="border-t pt-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-32" />
          <Badge variant="secondary" className="animate-pulse">
            ⏳ Fetching live prices...
          </Badge>
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Button skeleton */}
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}
