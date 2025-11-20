import React, { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";

interface SessionData {
  sessionStartedAt: string;
  sessionExpiresAt: string;
  sessionTtlSeconds: number;
  sessionStatus: "active" | "expiring_soon" | "expired";
  supplier: string;
}

interface HotelSessionTimerProps {
  session: SessionData;
  source: string;
  onSessionExpired?: () => void;
}

export const HotelSessionTimer: React.FC<HotelSessionTimerProps> = ({
  session,
  source,
  onSessionExpired,
}) => {
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [status, setStatus] = useState<string>(session.sessionStatus);

  useEffect(() => {
    const calculateRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(session.sessionExpiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      setRemainingTime(remaining);

      // Update status based on remaining time
      if (remaining === 0) {
        setStatus("expired");
        onSessionExpired?.();
      } else if (remaining < 180) {
        // 3 minutes
        setStatus("expiring_soon");
      } else {
        setStatus("active");
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [session.sessionExpiresAt, onSessionExpired]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "bg-blue-50 border-blue-200 text-blue-900";
      case "expiring_soon":
        return "bg-amber-50 border-amber-300 text-amber-900";
      case "expired":
        return "bg-red-50 border-red-300 text-red-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  const getIconColor = () => {
    switch (status) {
      case "active":
        return "text-blue-600";
      case "expiring_soon":
        return "text-amber-600";
      case "expired":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getMessage = () => {
    if (status === "expired") {
      return "Price session expired. Refresh to see current prices.";
    }
    if (status === "expiring_soon") {
      return `Hurry, price session expires in ${formatTime(remainingTime)}`;
    }

    if (source === "cache_tbo") {
      return `Cached results valid for ${formatTime(remainingTime)}`;
    }

    return `Prices locked for ${formatTime(remainingTime)}`;
  };

  if (!session || !session.sessionExpiresAt) {
    return null;
  }

  return (
    <div className={`rounded-lg border p-4 mb-4 ${getStatusColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {status === "expired" || status === "expiring_soon" ? (
            <AlertCircle className={`w-5 h-5 ${getIconColor()}`} />
          ) : (
            <Clock className={`w-5 h-5 ${getIconColor()}`} />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {source === "cache_tbo" ? "Cached Results" : "Live Prices"}
              </p>
              <p className="text-sm mt-1">{getMessage()}</p>
            </div>
            {status !== "expired" && (
              <div className="text-right">
                <div className={`text-2xl font-bold ${getIconColor()}`}>
                  {formatTime(remainingTime)}
                </div>
                <div className="text-xs opacity-75">
                  {status === "expiring_soon"
                    ? "Minutes left"
                    : "Time remaining"}
                </div>
              </div>
            )}
          </div>

          {source === "cache_tbo" && status === "active" && (
            <div className="mt-2 text-xs opacity-75">
              Instant results from cache • Session from {session.supplier}
            </div>
          )}

          {source === "tbo_live" && status === "active" && (
            <div className="mt-2 text-xs opacity-75">
              Live prices from {session.supplier} • Complete your bargain and
              booking promptly
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelSessionTimer;
