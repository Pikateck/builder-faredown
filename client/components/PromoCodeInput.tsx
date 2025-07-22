/**
 * Promo Code Input Component
 * Reusable component for applying promo codes with validation
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Tag,
  Check,
  X,
  RefreshCw,
  Gift,
  Percent,
  DollarSign,
  Info,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { pricingService, type FlightPricingFilters, type HotelPricingFilters, type PromoDiscount } from '@/services/pricingService';

interface PromoCodeInputProps {
  type: 'flight' | 'hotel';
  filters: FlightPricingFilters | HotelPricingFilters;
  onPromoApplied: (promo: PromoDiscount | null) => void;
  onPromoRemoved: () => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
}

interface PromoValidationState {
  isValid: boolean;
  isLoading: boolean;
  message: string;
  promo?: PromoDiscount;
  error?: string;
}

export default function PromoCodeInput({
  type,
  filters,
  onPromoApplied,
  onPromoRemoved,
  disabled = false,
  className,
  placeholder = "Enter promo code",
  size = 'md',
  showLabel = true,
  showTooltip = true
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [validationState, setValidationState] = useState<PromoValidationState>({
    isValid: false,
    isLoading: false,
    message: ''
  });
  const [appliedPromo, setAppliedPromo] = useState<PromoDiscount | null>(null);

  // Reset validation when promo code changes
  useEffect(() => {
    if (!promoCode.trim()) {
      setValidationState({
        isValid: false,
        isLoading: false,
        message: ''
      });
    }
  }, [promoCode]);

  const validatePromoCode = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setValidationState({
      isValid: false,
      isLoading: true,
      message: 'Validating promo code...'
    });

    try {
      const result = await pricingService.applyPromoCode(code, filters, type);
      
      if (result.isValid && result.promo) {
        setValidationState({
          isValid: true,
          isLoading: false,
          message: result.message,
          promo: result.promo
        });
        setAppliedPromo(result.promo);
        onPromoApplied(result.promo);
      } else {
        setValidationState({
          isValid: false,
          isLoading: false,
          message: '',
          error: result.message
        });
      }
    } catch (error) {
      setValidationState({
        isValid: false,
        isLoading: false,
        message: '',
        error: 'Failed to validate promo code. Please try again.'
      });
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setAppliedPromo(null);
    setValidationState({
      isValid: false,
      isLoading: false,
      message: ''
    });
    onPromoRemoved();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setPromoCode(value);
    
    // Clear validation state if user modifies applied promo
    if (appliedPromo) {
      removePromoCode();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && promoCode.trim() && !validationState.isLoading) {
      validatePromoCode();
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return '';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center space-x-2">
          <Label htmlFor="promoCode" className={getSizeClasses()}>
            Promo Code
          </Label>
          {showTooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className={cn(getIconSize(), "text-gray-400 cursor-help")} />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-medium mb-2">How to use promo codes:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Enter your promo code</li>
                      <li>• Code will be validated instantly</li>
                      <li>• Discount will be applied to your booking</li>
                      <li>• Some codes have restrictions</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Input
              id="promoCode"
              value={promoCode}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || validationState.isLoading}
              className={cn(
                getSizeClasses(),
                "pr-10",
                validationState.isValid && "border-green-500 bg-green-50",
                validationState.error && "border-red-500",
                appliedPromo && "bg-green-50"
              )}
            />
            
            {/* Input Status Icon */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {validationState.isLoading && (
                <RefreshCw className={cn(getIconSize(), "animate-spin text-blue-500")} />
              )}
              {validationState.isValid && !validationState.isLoading && (
                <CheckCircle className={cn(getIconSize(), "text-green-500")} />
              )}
              {validationState.error && !validationState.isLoading && (
                <AlertCircle className={cn(getIconSize(), "text-red-500")} />
              )}
            </div>
          </div>

          {!appliedPromo ? (
            <Button
              onClick={validatePromoCode}
              disabled={!promoCode.trim() || validationState.isLoading || disabled}
              variant="outline"
              size={size}
            >
              {validationState.isLoading ? (
                <RefreshCw className={cn(getIconSize(), "animate-spin")} />
              ) : (
                <Tag className={getIconSize()} />
              )}
              {size !== 'sm' && !validationState.isLoading && (
                <span className="ml-2">Apply</span>
              )}
            </Button>
          ) : (
            <Button
              onClick={removePromoCode}
              variant="outline"
              size={size}
              className="text-red-600 hover:text-red-700"
            >
              <X className={getIconSize()} />
              {size !== 'sm' && <span className="ml-2">Remove</span>}
            </Button>
          )}
        </div>

        {/* Success Message */}
        {validationState.isValid && validationState.message && appliedPromo && (
          <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Gift className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-green-700 font-medium">
                {validationState.message}
              </p>
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <span className="font-medium">{appliedPromo.name}</span>
                </Badge>
                <div className="flex items-center space-x-1 text-sm text-green-600">
                  {appliedPromo.type === 'percent' ? (
                    <Percent className="w-3 h-3" />
                  ) : (
                    <DollarSign className="w-3 h-3" />
                  )}
                  <span>
                    {appliedPromo.from}-{appliedPromo.to}
                    {appliedPromo.type === 'percent' ? '%' : '₹'} off
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {validationState.error && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{validationState.error}</p>
          </div>
        )}

        {/* Popular Promo Codes Suggestions (could be fetched from API) */}
        {!appliedPromo && !promoCode && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Popular codes:</p>
            <div className="flex flex-wrap gap-2">
              {['FLYHIGH100', 'HOTELFEST', 'TRAVEL25'].map((code) => (
                <Button
                  key={code}
                  variant="ghost"
                  size="sm"
                  onClick={() => setPromoCode(code)}
                  className="h-7 px-2 text-xs border border-gray-200 hover:border-blue-300"
                  disabled={disabled}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {code}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Higher-order component for easy integration
export function withPromoCode<T extends object>(
  WrappedComponent: React.ComponentType<T & { appliedPromo?: PromoDiscount | null }>
) {
  return function PromoCodeWrapper(props: T & {
    type: 'flight' | 'hotel';
    filters: FlightPricingFilters | HotelPricingFilters;
  }) {
    const [appliedPromo, setAppliedPromo] = useState<PromoDiscount | null>(null);

    return (
      <div className="space-y-4">
        <PromoCodeInput
          type={props.type}
          filters={props.filters}
          onPromoApplied={setAppliedPromo}
          onPromoRemoved={() => setAppliedPromo(null)}
        />
        <WrappedComponent {...props} appliedPromo={appliedPromo} />
      </div>
    );
  };
}

export { type PromoDiscount };
