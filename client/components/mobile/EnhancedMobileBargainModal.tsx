import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingDown, 
  X, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  Zap,
  Target,
  Trophy,
  Sparkles,
  Timer,
  Lock
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { enhancedBargainService, EnhancedBargainResponse, EnhancedBargainSession } from "@/services/enhancedBargainService";

interface EnhancedMobileBargainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBargainSuccess: (finalPrice: number, savings: number) => void;
  module: 'flights' | 'hotels' | 'sightseeing' | 'transfers';
  itemName: string;
  supplierNetRate: number;
  itemDetails: {
    features?: string[];
    location?: string;
    provider?: string;
  };
  promoCode?: string;
}

type BargainPhase = 'loading' | 'input' | 'negotiating' | 'round_result' | 'hold' | 'success' | 'final_offer' | 'price_match';

export const EnhancedMobileBargainModal: React.FC<EnhancedMobileBargainModalProps> = ({
  isOpen,
  onClose,
  onBargainSuccess,
  module,
  itemName,
  supplierNetRate,
  itemDetails,
  promoCode,
}) => {
  const { formatPrice } = useCurrency();

  // State management
  const [phase, setPhase] = useState<BargainPhase>('loading');
  const [sessionId, setSessionId] = useState<string>('');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [maxRounds] = useState<number>(3);
  const [userOffer, setUserOffer] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<number>(supplierNetRate);
  const [displayPrice, setDisplayPrice] = useState<number>(supplierNetRate);
  const [savings, setSavings] = useState<number>(0);
  const [emotionalState, setEmotionalState] = useState<string>('optimistic');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [holdTimer, setHoldTimer] = useState<number>(30);
  const [holdExpiry, setHoldExpiry] = useState<string>('');
  const [isPriceMatch, setIsPriceMatch] = useState<boolean>(false);
  const [finalSavings, setFinalSavings] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [suggestion, setSuggestion] = useState<number>(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      resetModalState();
      initializeBargainSession();
    }
  }, [isOpen]);

  // Hold timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'hold' && holdTimer > 0) {
      interval = setInterval(() => {
        setHoldTimer(prev => {
          if (prev <= 1) {
            setPhase('input');
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, holdTimer]);

  const resetModalState = () => {
    setPhase('loading');
    setSessionId('');
    setCurrentRound(1);
    setUserOffer('');
    setAiResponse('');
    setCurrentPrice(supplierNetRate);
    setDisplayPrice(supplierNetRate);
    setSavings(0);
    setEmotionalState('optimistic');
    setIsProcessing(false);
    setHoldTimer(30);
    setHoldExpiry('');
    setIsPriceMatch(false);
    setFinalSavings(0);
    setError('');
    setSuggestion(0);
  };

  const initializeBargainSession = async () => {
    try {
      setError('');
      const response = await enhancedBargainService.startSession({
        module,
        supplier_net_rate: supplierNetRate,
        user_context: {
          item_name: itemName,
          location: itemDetails.location,
          features: itemDetails.features,
        },
        promo_code: promoCode,
      });

      setSessionId(response.session_id);
      setCurrentRound(response.current_round);
      setAiResponse(response.ai_message);
      setCurrentPrice(response.price_offered);
      setDisplayPrice(response.display_price);
      setSavings(response.your_savings);
      setEmotionalState(response.emotional_state);
      
      // Get AI suggestion for opening offer
      const suggestions = await enhancedBargainService.getAISuggestions(module, supplierNetRate, itemDetails);
      setSuggestion(suggestions.suggested_opening_offer);
      
      setPhase('input');
    } catch (error) {
      console.error('Failed to initialize bargain session:', error);
      setError('Failed to start bargain session. Please try again.');
      setPhase('input');
    }
  };

  const handleMakeOffer = async () => {
    if (!userOffer || !sessionId || isProcessing) return;

    const offerAmount = parseInt(userOffer);
    if (offerAmount >= currentPrice || offerAmount <= 0) {
      setError('Your offer must be lower than the current price and greater than 0');
      return;
    }

    setIsProcessing(true);
    setError('');
    setPhase('negotiating');

    try {
      const response = await enhancedBargainService.makeOffer({
        session_id: sessionId,
        user_offer: offerAmount,
        round_number: currentRound,
      });

      // Update state based on response
      setCurrentRound(response.current_round);
      setAiResponse(response.ai_message);
      setCurrentPrice(response.price_offered);
      setDisplayPrice(response.display_price);
      setSavings(response.your_savings);
      setEmotionalState(response.emotional_state);
      setIsPriceMatch(response.is_price_match);

      if (response.is_price_match) {
        setFinalSavings(response.your_savings);
        setPhase('price_match');
      } else if (response.is_final_round) {
        setPhase('final_offer');
      } else if (response.hold_expires_at) {
        setHoldExpiry(response.hold_expires_at);
        setHoldTimer(30);
        setPhase('hold');
      } else {
        setPhase('round_result');
      }

      setUserOffer('');
    } catch (error) {
      console.error('Failed to make offer:', error);
      setError('Failed to process your offer. Please try again.');
      setPhase('input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!sessionId) return;

    setIsProcessing(true);
    try {
      const response = await enhancedBargainService.acceptOffer({
        session_id: sessionId,
        final_price: currentPrice,
        accepted: true,
      });

      setFinalSavings(response.total_savings);
      onBargainSuccess(response.final_price, response.total_savings);
      setPhase('success');
    } catch (error) {
      console.error('Failed to accept offer:', error);
      setError('Failed to accept offer. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAndBook = () => {
    onBargainSuccess(supplierNetRate, 0);
    onClose();
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case 'loading':
        return <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />;
      case 'input':
        return <Target className="w-8 h-8 text-yellow-500" />;
      case 'negotiating':
        return <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />;
      case 'round_result':
        return <Zap className="w-8 h-8 text-orange-500" />;
      case 'hold':
        return <Lock className="w-8 h-8 text-red-500" />;
      case 'price_match':
        return <Trophy className="w-8 h-8 text-green-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'final_offer':
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      default:
        return <Sparkles className="w-8 h-8 text-blue-500" />;
    }
  };

  const getPhaseTitle = () => {
    switch (phase) {
      case 'loading':
        return 'Starting AI Bargain Engine...';
      case 'input':
        return `Round ${currentRound} of ${maxRounds} - Make Your Offer`;
      case 'negotiating':
        return 'AI Processing Your Offer...';
      case 'round_result':
        return 'AI Counter-Offer Received!';
      case 'hold':
        return 'Price Locked - Limited Time!';
      case 'price_match':
        return 'Perfect Match! 🎯';
      case 'success':
        return 'Deal Secured! 🎉';
      case 'final_offer':
        return 'Final Round - Last Chance!';
      default:
        return 'AI Bargain Engine';
    }
  };

  const getEmotionalMessage = () => {
    const messages = {
      optimistic: "✨ Looking great! I'm confident we can get you an amazing deal!",
      neutral: "🤔 Let's see what we can negotiate...",
      urgent: "⚡ Time is running out! Better deals are disappearing fast!",
      desperate: "🔥 URGENT: This might be your last chance for savings!"
    };
    return messages[emotionalState] || messages['neutral'];
  };

  const getRoundWarning = () => {
    if (currentRound === 2) {
      return "⚠️ Warning: Round 2 offers may be less attractive. Consider accepting if the current deal is good!";
    }
    if (currentRound === 3) {
      return "🚨 FINAL ROUND: This is your absolute last chance to negotiate. Prices may increase after this!";
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full max-w-none m-0 rounded-none bg-white overflow-y-auto">
        <DialogHeader className="border-b border-gray-200 pb-4 bg-gradient-to-r from-[#003580] to-[#0066CC] text-white -m-6 mb-0 p-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                {getPhaseIcon()}
              </div>
              <div>
                <span className="text-lg font-bold">{getPhaseTitle()}</span>
                <div className="text-sm opacity-90">{getEmotionalMessage()}</div>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-6">
          {/* Item Information */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="font-bold text-gray-900 mb-2">{itemName}</h3>
            {itemDetails.location && (
              <p className="text-sm text-gray-600 mb-2">📍 {itemDetails.location}</p>
            )}
            {itemDetails.provider && (
              <p className="text-sm text-gray-600 mb-3">🏢 {itemDetails.provider}</p>
            )}
            
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">Current Best Price:</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#003580]">
                  {formatPrice(displayPrice)}
                </span>
                {savings > 0 && (
                  <div className="text-sm text-green-600 font-semibold">
                    Save {formatPrice(savings)}!
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            {itemDetails.features && itemDetails.features.length > 0 && (
              <div className="space-y-1">
                {itemDetails.features.slice(0, 3).map((feature, idx) => (
                  <div key={idx} className="flex items-center text-xs text-gray-600">
                    <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Round Progress */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Negotiation Progress</span>
              <Badge variant={currentRound === maxRounds ? "destructive" : "default"}>
                Round {currentRound}/{maxRounds}
              </Badge>
            </div>
            <Progress 
              value={(currentRound / maxRounds) * 100} 
              className="h-2"
            />
          </div>

          {/* Round Warning */}
          {getRoundWarning() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 font-medium">
                {getRoundWarning()}
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Loading Phase */}
          {phase === 'loading' && (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900">Initializing AI Bargain Engine...</p>
              <p className="text-sm text-gray-600">Analyzing market conditions and preparing your negotiation strategy</p>
            </div>
          )}

          {/* Input Phase */}
          {phase === 'input' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">🎯 What's your target price?</h4>
                <p className="text-sm text-gray-600 mb-4">{aiResponse}</p>

                {suggestion > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      💡 <strong>AI Suggestion:</strong> Try starting with {formatPrice(suggestion)} for the best negotiation outcome!
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <Input
                      type="number"
                      placeholder="Enter your offer price"
                      value={userOffer}
                      onChange={(e) => setUserOffer(e.target.value)}
                      className="pl-8 h-12 text-lg border-2 focus:border-blue-500"
                      max={currentPrice - 1}
                      min={1}
                    />
                  </div>

                  {userOffer && parseInt(userOffer) >= currentPrice && (
                    <p className="text-sm text-red-600 font-medium">
                      ❌ Your offer must be lower than the current price
                    </p>
                  )}

                  {userOffer && parseInt(userOffer) > 0 && parseInt(userOffer) < currentPrice && (
                    <p className="text-sm text-green-600 font-medium">
                      ✅ Potential savings: {formatPrice(currentPrice - parseInt(userOffer))}
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleMakeOffer}
                disabled={!userOffer || parseInt(userOffer) >= currentPrice || parseInt(userOffer) <= 0 || isProcessing}
                className="w-full h-14 bg-gradient-to-r from-[#febb02] to-[#f4a902] hover:from-[#e5a700] to-[#d49600] text-black font-bold text-lg shadow-lg"
              >
                <TrendingDown className="w-6 h-6 mr-2" />
                Make Offer - Round {currentRound}
              </Button>
            </div>
          )}

          {/* Negotiating Phase */}
          {phase === 'negotiating' && (
            <div className="text-center py-8">
              <RefreshCw className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-2">AI Processing Your Offer...</h4>
              <p className="text-sm text-gray-600">Our AI is negotiating with the supplier for the best possible deal</p>
              <div className="mt-4">
                <Progress value={75} className="w-full h-3" />
              </div>
            </div>
          )}

          {/* Round Result Phase */}
          {phase === 'round_result' && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Zap className="w-6 h-6 text-orange-500 mr-2" />
                  <h4 className="font-bold text-gray-900">AI Counter-Offer</h4>
                </div>
                <p className="text-sm text-gray-700 mb-4">{aiResponse}</p>
                
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {formatPrice(currentPrice)}
                  </div>
                  <div className="text-sm text-gray-600">
                    You save {formatPrice(savings)} from original price!
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleAcceptOffer}
                  disabled={isProcessing}
                  className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Accept Deal
                </Button>
                <Button
                  onClick={() => setPhase('input')}
                  variant="outline"
                  className="h-12 font-bold border-2"
                >
                  <TrendingDown className="w-5 h-5 mr-2" />
                  Counter Offer
                </Button>
              </div>
            </div>
          )}

          {/* Hold Phase */}
          {phase === 'hold' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <Lock className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 mb-2">Price Locked!</h4>
                <p className="text-sm text-gray-700 mb-4">{aiResponse}</p>
                
                <div className="bg-white rounded-lg p-4 border border-red-200 mb-4">
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {formatPrice(currentPrice)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Your savings: {formatPrice(savings)}
                  </div>
                  <div className="flex items-center justify-center text-red-600 font-bold">
                    <Timer className="w-4 h-4 mr-1" />
                    {holdTimer}s remaining
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAcceptOffer}
                disabled={isProcessing}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold text-lg animate-pulse"
              >
                <Lock className="w-6 h-6 mr-2" />
                Secure This Price Now!
              </Button>
            </div>
          )}

          {/* Price Match Phase */}
          {phase === 'price_match' && (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <Trophy className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-gray-900 mb-2">Perfect Match! 🎯</h4>
                <p className="text-sm text-gray-700 mb-4">{aiResponse}</p>
                
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {formatPrice(currentPrice)}
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    You saved {formatPrice(finalSavings)}! 🎉
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAcceptOffer}
                disabled={isProcessing}
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-lg"
              >
                <Trophy className="w-6 h-6 mr-2" />
                Claim Your Perfect Deal!
              </Button>
            </div>
          )}

          {/* Final Offer Phase */}
          {phase === 'final_offer' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                  <h4 className="font-bold text-gray-900">Final Round - Last Chance!</h4>
                </div>
                <p className="text-sm text-gray-700 mb-4">{aiResponse}</p>
                
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {formatPrice(currentPrice)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Final savings: {formatPrice(savings)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleAcceptOffer}
                  disabled={isProcessing}
                  className="h-12 bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Accept Final
                </Button>
                <Button
                  onClick={handleRejectAndBook}
                  variant="outline"
                  className="h-12 font-bold border-2"
                >
                  Book Original
                </Button>
              </div>
            </div>
          )}

          {/* Success Phase */}
          {phase === 'success' && (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-gray-900 mb-2">Deal Secured! 🎉</h4>
                <p className="text-sm text-gray-700 mb-4">
                  Congratulations! You've successfully negotiated a great deal!
                </p>
                
                <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {formatPrice(currentPrice)}
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    Total Savings: {formatPrice(finalSavings)}! 💰
                  </div>
                </div>
              </div>

              <Button
                onClick={onClose}
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-lg"
              >
                <Sparkles className="w-6 h-6 mr-2" />
                Continue to Booking
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedMobileBargainModal;
