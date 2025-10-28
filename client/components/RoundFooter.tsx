import React from "react";
import { Handshake, CheckCircle } from "lucide-react";

interface RoundFooterProps {
  currencySymbol: string;
  lastTarget?: number | null;
  lastOffer?: number | null;
  lastOfferSecondsLeft?: number | null;
  disabled?: boolean;
  onSend: (price: number) => void;
  onAcceptPrevious?: () => void;
}

export const RoundFooter: React.FC<RoundFooterProps> = ({
  currencySymbol,
  lastTarget = null,
  lastOffer = null,
  lastOfferSecondsLeft = null,
  disabled = false,
  onSend,
  onAcceptPrevious,
}) => {
  const [mode, setMode] = React.useState<"reuse" | "new">(
    lastTarget != null ? "reuse" : "new",
  );
  const [value, setValue] = React.useState<string>(
    lastTarget != null ? String(Math.round(lastTarget)) : "",
  );

  React.useEffect(() => {
    if (lastTarget != null) {
      setMode("reuse");
      setValue(String(Math.round(lastTarget)));
    }
  }, [lastTarget]);

  const handleSend = () => {
    const v = Number(value);
    if (!isFinite(v) || v <= 0) return;
    onSend(v);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || lastTarget == null}
          onClick={() => {
            setMode("reuse");
            if (lastTarget != null) {
              onSend(Math.round(lastTarget));
            }
          }}
          className={`px-3 py-2 rounded-full text-sm border transition-colors ${mode === "reuse" ? "bg-[#0071c2] text-white border-[#0071c2]" : "bg-white text-[#0071c2] border-[#0071c2]"}`}
        >
          Use {currencySymbol}
          {lastTarget != null ? Math.round(lastTarget).toLocaleString() : "0"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setMode("new")}
          className={`px-3 py-2 rounded-full text-sm border transition-colors ${mode === "new" ? "bg-[#0071c2] text-white border-[#0071c2]" : "bg-white text-[#0071c2] border-[#0071c2]"}`}
        >
          Enter new price
        </button>
      </div>

      {mode === "new" && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            {currencySymbol}
          </span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            type="tel"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Enter your target price"
            className="pl-8 pr-12 py-3 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071c2]"
            disabled={disabled}
          />
          <button
            type="button"
            disabled={disabled || !value}
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg disabled:opacity-50"
            title="Send"
          >
            <Handshake className="w-4 h-4" />
          </button>
        </div>
      )}

      {lastOffer != null &&
        lastOfferSecondsLeft != null &&
        lastOfferSecondsLeft > 0 && (
          <button
            type="button"
            onClick={onAcceptPrevious}
            disabled={disabled}
            className="text-sm text-[#0071c2] hover:underline inline-flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Accept previous offer{" "}
            {currencySymbol}
            {Math.round(lastOffer).toLocaleString()} (
            {String(lastOfferSecondsLeft).padStart(2, "0")}s left)
          </button>
        )}
    </div>
  );
};

export default RoundFooter;
