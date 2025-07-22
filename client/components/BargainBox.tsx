/**
 * Bargain Box Component
 * Interactive price negotiation interface with real-time validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DollarSign,
  TrendingDown,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  MessageCircle,
  Clock,
  Sparkles,
  Info,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Gift,
  Star,
  Percent,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  pricingService, 
  type PricingContext, 
  type BargainValidationResult,
  type DynamicPricingResult 
} from '@/services/pricingService';
import { formatPrice } from '@/lib/formatPrice';

interface BargainBoxProps {
  context: PricingContext;
  onPriceAccepted: (finalPrice: number, sessionId: string) => void;
  onCancel?: () => void;
  className?: string;
  showPromoInput?: boolean;
  maxAttempts?: number;
}

interface BargainSession {
  id?: string;
  attempts: number;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
  originalPrice: number;
  currentOffer?: number;
  finalPrice?: number;
  aiMessages: Array<{
    type: 'user' | 'ai' | 'system';
    message: string;
    price?: number;
    timestamp: Date;
  }>;
}

export default function BargainBox({
  context,
  onPriceAccepted,
  onCancel,
  className,
  showPromoInput = true,
  maxAttempts = 3
}: BargainBoxProps) {
  const [userPrice, setUserPrice] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [pricingResult, setPricingResult] = useState<DynamicPricingResult | null>(null);
  const [bargainSession, setBargainSession] = useState<BargainSession | null>(null);
  const [validationResult, setValidationResult] = useState<BargainValidationResult | null>(null);
  const [showPriceHelp, setShowPriceHelp] = useState(false);
  const [sliderValue, setSliderValue] = useState([0]);
  const [isNegotiating, setIsNegotiating] = useState(false);
  
  // Initialize pricing data
  useEffect(() => {
    initializePricing();
  }, [context]);

  // Update slider when user types price
  useEffect(() => {
    if (userPrice && pricingResult) {
      const price = parseFloat(userPrice);
      const range = pricingResult.discountedPriceRange || pricingResult.originalPriceRange;
      const percentage = Math.min(100, Math.max(0, 
        ((price - range.min) / (range.max - range.min)) * 100
      ));
      setSliderValue([percentage]);
    }
  }, [userPrice, pricingResult]);

  const initializePricing = async () => {
    try {
      const result = await pricingService.getDynamicPricing(context);
      setPricingResult(result);
      
      // Initialize bargain session
      const session: BargainSession = {
        attempts: 0,
        status: 'active',
        originalPrice: result.originalPriceRange.max,
        aiMessages: [
          {
            type: 'system',
            message: `Welcome to Faredown Bargain! The listed price is ₹${result.originalPriceRange.max.toLocaleString()}. What price would you like to pay?`,
            timestamp: new Date()
          }
        ]
      };
      setBargainSession(session);
      
      // Set initial suggested price
      const suggestedPrice = result.discountedPriceRange?.recommended || result.bargainRange.recommended;
      setUserPrice(suggestedPrice.toString());
      
    } catch (error) {
      console.error('Failed to initialize pricing:', error);
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setIsApplyingPromo(true);
    try {
      const result = await pricingService.applyPromoCode(
        promoCode.trim(),
        context.filters,
        context.type
      );
      
      if (result.isValid && result.promo) {
        const updatedContext = { ...context, promo: result.promo };
        const newPricingResult = await pricingService.getDynamicPricing(updatedContext);
        setPricingResult(newPricingResult);
        setPromoApplied(true);
        
        addAIMessage('system', `Promo code "${promoCode}" applied! ${result.message}`);
        
        // Update suggested price
        const newSuggestedPrice = newPricingResult.discountedPriceRange?.recommended || newPricingResult.bargainRange.recommended;
        setUserPrice(newSuggestedPrice.toString());
        
      } else {
        addAIMessage('system', `Promo code "${promoCode}" is not valid: ${result.message}`, 'error');
      }
    } catch (error) {
      addAIMessage('system', 'Failed to apply promo code. Please try again.', 'error');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const validateBargainPrice = async () => {
    const price = parseFloat(userPrice);
    if (isNaN(price) || price <= 0) {
      addAIMessage('system', 'Please enter a valid price amount.', 'error');
      return;
    }

    if (!bargainSession || bargainSession.attempts >= maxAttempts) {
      addAIMessage('system', 'Maximum negotiation attempts reached.', 'error');
      return;
    }

    setIsValidating(true);
    setIsNegotiating(true);
    
    try {
      const updatedContext = { ...context };
      if (promoApplied && pricingResult?.promo) {
        updatedContext.promo = pricingResult.promo;
      }

      const result = await pricingService.validateBargainPrice(
        price,
        updatedContext,
        promoApplied ? promoCode : undefined
      );

      setValidationResult(result);
      
      // Update bargain session
      const updatedSession = {
        ...bargainSession,
        id: result.sessionId || bargainSession.id,
        attempts: bargainSession.attempts + 1
      };

      if (result.status === 'matched') {
        updatedSession.status = 'accepted';
        updatedSession.finalPrice = result.finalPrice;
        addAIMessage('ai', result.message);
        addAIMessage('system', 'Congratulations! Your bargain has been accepted. 🎉');
        
        setTimeout(() => {
          if (result.finalPrice && result.sessionId) {
            onPriceAccepted(result.finalPrice, result.sessionId);
          }
        }, 2000);

      } else if (result.status === 'counter') {
        updatedSession.currentOffer = result.counterOffer;
        addAIMessage('ai', result.message, 'counter', result.counterOffer);

      } else {
        addAIMessage('ai', result.message, 'reject');
        if (updatedSession.attempts >= maxAttempts) {
          updatedSession.status = 'expired';
          addAIMessage('system', 'Negotiation limit reached. You can book at the original price.');
        }
      }

      setBargainSession(updatedSession);
      
    } catch (error) {
      console.error('Bargain validation error:', error);
      addAIMessage('system', 'Failed to validate your price. Please try again.', 'error');
    } finally {
      setIsValidating(false);
      setIsNegotiating(false);
    }
  };

  const acceptCounterOffer = async () => {
    if (!validationResult?.counterOffer || !bargainSession?.id) return;

    try {
      const response = await fetch('/api/promo/counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: bargainSession.id,
          action: 'accept'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        addAIMessage('system', 'Great! Counter offer accepted. 🎉');
        setBargainSession(prev => prev ? { ...prev, status: 'accepted', finalPrice: validationResult.counterOffer } : null);
        
        setTimeout(() => {
          onPriceAccepted(validationResult.counterOffer!, bargainSession.id!);
        }, 1500);
      }
    } catch (error) {
      console.error('Accept counter offer error:', error);
    }
  };

  const rejectCounterOffer = () => {
    addAIMessage('user', `I'd like to stick with my offer of ₹${parseFloat(userPrice).toLocaleString()}`);
    addAIMessage('ai', "I understand. Feel free to try a different amount or book at the original price.");
    
    setBargainSession(prev => prev ? { ...prev, currentOffer: undefined } : null);
    setValidationResult(null);
  };

  const addAIMessage = (type: 'user' | 'ai' | 'system', message: string, messageType?: 'error' | 'counter' | 'reject', price?: number) => {
    setBargainSession(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        aiMessages: [
          ...prev.aiMessages,
          {
            type,
            message,
            price,
            timestamp: new Date()
          }
        ]
      };
    });
  };

  const handleSliderChange = (value: number[]) => {
    if (!pricingResult) return;
    
    setSliderValue(value);
    const range = pricingResult.discountedPriceRange || pricingResult.originalPriceRange;
    const price = range.min + ((range.max - range.min) * value[0] / 100);
    setUserPrice(Math.round(price).toString());
  };

  const getSavingsInfo = () => {
    if (!pricingResult || !userPrice) return null;
    
    const price = parseFloat(userPrice);
    const originalPrice = pricingResult.originalPriceRange.max;
    const savings = originalPrice - price;
    const savingsPercent = (savings / originalPrice) * 100;
    
    return {
      amount: savings,
      percent: savingsPercent.toFixed(1)
    };
  };

  const getPriceStatus = () => {
    if (!pricingResult || !userPrice) return 'neutral';
    
    const price = parseFloat(userPrice);
    const bargainRange = pricingResult.bargainRange;
    
    if (price >= bargainRange.min && price <= bargainRange.max) {
      return 'good';
    } else if (price < bargainRange.min) {
      return 'low';
    } else {
      return 'high';
    }
  };

  if (!pricingResult || !bargainSession) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading bargain interface...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const savingsInfo = getSavingsInfo();
  const priceStatus = getPriceStatus();
  const currentRange = pricingResult.discountedPriceRange || pricingResult.originalPriceRange;

  return (
    <Card className={cn("w-full max-w-lg", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Bargain Box</span>
          </CardTitle>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>{bargainSession.attempts}/{maxAttempts} attempts</span>
          </Badge>
        </div>
        
        {pricingResult.promo && (
          <div className="flex items-center space-x-2 text-sm">
            <Gift className="w-4 h-4 text-green-600" />
            <span className="text-green-600">Promo "{pricingResult.promo.name}" applied</span>
            <Badge variant="secondary" className="text-xs">
              {pricingResult.promo.from}-{pricingResult.promo.to}
              {pricingResult.promo.type === 'percent' ? '%' : '₹'} off
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price Information */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Original Price:</span>
            <span className="font-medium line-through text-gray-500">
              ₹{pricingResult.originalPriceRange.max.toLocaleString()}
            </span>
          </div>
          
          {pricingResult.discountedPriceRange && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">With Promo:</span>
              <span className="font-medium text-green-600">
                ₹{pricingResult.discountedPriceRange.min.toLocaleString()} - ₹{pricingResult.discountedPriceRange.max.toLocaleString()}
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Bargain Range:</span>
            <span className="font-medium text-blue-600">
              ₹{pricingResult.bargainRange.min.toLocaleString()} - ₹{pricingResult.bargainRange.max.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Promo Code Input */}
        {showPromoInput && !promoApplied && (
          <div className="space-y-2">
            <Label htmlFor="promoCode">Promo Code (Optional)</Label>
            <div className="flex space-x-2">
              <Input
                id="promoCode"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="flex-1"
              />
              <Button
                onClick={applyPromoCode}
                disabled={!promoCode.trim() || isApplyingPromo}
                variant="outline"
                size="sm"
              >
                {isApplyingPromo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Price Input with Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="userPrice">Your Price</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPriceHelp(true)}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tips for better bargain success</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <Input
                id="userPrice"
                type="number"
                value={userPrice}
                onChange={(e) => setUserPrice(e.target.value)}
                placeholder="Enter your price"
                className={cn(
                  "text-lg font-medium pl-8",
                  priceStatus === 'good' && "border-green-500 text-green-700",
                  priceStatus === 'low' && "border-yellow-500 text-yellow-700",
                  priceStatus === 'high' && "border-blue-500 text-blue-700"
                )}
              />
              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Price Slider */}
            <div className="space-y-2">
              <Slider
                value={sliderValue}
                onValueChange={handleSliderChange}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>₹{currentRange.min.toLocaleString()}</span>
                <span>₹{currentRange.max.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Price Status Indicator */}
          {userPrice && (
            <div className="space-y-2">
              <div className={cn(
                "flex items-center space-x-2 text-sm",
                priceStatus === 'good' && "text-green-600",
                priceStatus === 'low' && "text-yellow-600",
                priceStatus === 'high' && "text-blue-600"
              )}>
                {priceStatus === 'good' && <CheckCircle className="w-4 h-4" />}
                {priceStatus === 'low' && <AlertTriangle className="w-4 h-4" />}
                {priceStatus === 'high' && <TrendingDown className="w-4 h-4" />}
                <span>
                  {priceStatus === 'good' && "Great price! High chance of acceptance"}
                  {priceStatus === 'low' && "Price is quite low, may get counter offer"}
                  {priceStatus === 'high' && "Price is above bargain range, easily acceptable"}
                </span>
              </div>
              
              {savingsInfo && savingsInfo.amount > 0 && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    You'll save ₹{savingsInfo.amount.toLocaleString()} ({savingsInfo.percent}%)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Counter Offer Section */}
        {validationResult?.status === 'counter' && validationResult.counterOffer && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Counter Offer</span>
                </div>
                <p className="text-sm text-yellow-700">{validationResult.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-yellow-800">
                    ₹{validationResult.counterOffer.toLocaleString()}
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={acceptCounterOffer}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={rejectCounterOffer}
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Conversation */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {bargainSession.aiMessages.slice(-3).map((msg, index) => (
            <div
              key={index}
              className={cn(
                "text-sm p-2 rounded",
                msg.type === 'user' && "bg-blue-50 text-blue-800 ml-8",
                msg.type === 'ai' && "bg-gray-50 text-gray-700 mr-8",
                msg.type === 'system' && "bg-green-50 text-green-700 text-center"
              )}
            >
              {msg.message}
              {msg.price && (
                <span className="font-medium ml-2">
                  ₹{msg.price.toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={validateBargainPrice}
            disabled={
              !userPrice || 
              isValidating || 
              bargainSession.status !== 'active' ||
              bargainSession.attempts >= maxAttempts ||
              isNaN(parseFloat(userPrice))
            }
            className="flex-1"
          >
            {isValidating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : isNegotiating ? (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                Negotiating...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Make Offer
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        {/* Status Messages */}
        {bargainSession.status === 'accepted' && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Bargain Accepted!</span>
            </div>
            <p className="text-sm text-gray-600">Redirecting to booking confirmation...</p>
          </div>
        )}

        {bargainSession.status === 'expired' && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-yellow-600">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Negotiation Ended</span>
            </div>
            <p className="text-sm text-gray-600">You can still book at the original price.</p>
          </div>
        )}
      </CardContent>

      {/* Price Help Dialog */}
      <Dialog open={showPriceHelp} onOpenChange={setShowPriceHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bargain Tips</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Best Practices</span>
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Start with a reasonable offer (10-15% below listed price)</li>
                <li>• Prices in the green range have higher acceptance rates</li>
                <li>• Use promo codes before bargaining for better discounts</li>
                <li>• Be prepared for counter offers on low prices</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span>Price Ranges</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-200 rounded"></div>
                  <span>Green: High acceptance chance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                  <span>Yellow: May get counter offer</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-200 rounded"></div>
                  <span>Blue: Easily acceptable</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPriceHelp(false)}>Got it!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
