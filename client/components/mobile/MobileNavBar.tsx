import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Search,
  Filter,
  MapPin,
  Share2,
  Bookmark,
  Star,
} from "lucide-react";

interface MobileNavBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showSearch?: boolean;
  showFilter?: boolean;
  showMap?: boolean;
  showShare?: boolean;
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  onShareClick?: () => void;
  onFilterClick?: () => void;
  rating?: number;
  reviewCount?: number;
  rightActions?: React.ReactNode;
  backgroundColor?: string;
}

export function MobileNavBar({
  title,
  subtitle,
  onBack,
  showSearch = false,
  showFilter = false,
  showMap = false,
  showShare = false,
  showBookmark = false,
  isBookmarked = false,
  onBookmarkToggle,
  onShareClick,
  onFilterClick,
  rating,
  reviewCount,
  rightActions,
  backgroundColor = "#003580",
}: MobileNavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Check if we can go back in history
      if (window.history.length > 1 && document.referrer) {
        navigate(-1);
      } else {
        // Fallback navigation based on current path
        const currentPath = location.pathname;
        if (currentPath.includes('/hotels/')) {
          navigate('/hotels/results');
        } else if (currentPath.includes('/flights/')) {
          navigate('/flights');
        } else {
          navigate('/');
        }
      }
    }
  };

  return (
    <div className="md:hidden bg-white">
      {/* Main Header */}
      <div 
        className="text-white"
        style={{ backgroundColor }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2 mr-3 flex-shrink-0"
              onClick={handleBack}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-lg line-clamp-1">
                {title}
              </h1>
              {subtitle && (
                <div className="flex items-center text-blue-200">
                  {rating && (
                    <>
                      <Star className="w-3 h-3 fill-current mr-1" />
                      <span className="text-xs">{rating}</span>
                      {reviewCount && (
                        <span className="text-xs ml-1">• {reviewCount} reviews</span>
                      )}
                    </>
                  )}
                  {!rating && (
                    <p className="text-xs truncate">{subtitle}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {rightActions}
            
            {showBookmark && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2"
                onClick={onBookmarkToggle}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
              </Button>
            )}
            
            {showShare && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2"
                onClick={onShareClick}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {(showSearch || showFilter || showMap) && (
        <div className="bg-white border-b border-gray-200 p-3">
          <div className="flex gap-2 overflow-x-auto">
            {showSearch && (
              <Button variant="outline" size="sm" className="flex items-center gap-2 whitespace-nowrap min-w-fit">
                <Search className="w-4 h-4" />
                Search
              </Button>
            )}
            
            {showFilter && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 whitespace-nowrap min-w-fit"
                onClick={onFilterClick}
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            )}
            
            {showMap && (
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <MapPin className="w-4 h-4 mr-1" />
                Map
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
