/**
 * useBargainEngine Hook
 * Shared bargain logic for Hotels, Flights, Transfers, Packages, and Add-ons
 * Ensures identical behavior across all product types
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BargainEngine,
  BargainProduct,
  BargainSession,
  BargainRound,
  initializeBargainEngine,
  getBargainEngine,
} from '@/services/BargainEngine';
import { chatAnalyticsService } from '@/services/chatAnalyticsService';

export interface UseBargainEngineProps {
  product: BargainProduct;
  basePrice: number;
  onPriceSelected: (sessionId: string, selectedPrice: number, selectedRound: 1 | 2) => void;
  onAbandon?: (sessionId: string, reason: 'timer_expired' | 'user_exit') => void;
}

export interface UseBargainEngineReturn {
  sessionId: string | null;
  session: BargainSession | null;
  round: number;
  timerDuration: number;
  safeDealPrice: number | null;
  finalOfferPrice: number | null;
  maxRounds: number;
  isSessionActive: boolean;
  isSessionExpired: boolean;
  
  // Actions
  startSession: () => string;
  submitRound1Price: (userWishPrice: number) => BargainRound;
  submitRound2Price: (userWishPrice: number) => BargainRound;
  selectPrice: (selectedRound: 1 | 2) => number;
  abandonSession: (reason: 'timer_expired' | 'user_exit') => number;
  getSession: () => BargainSession | null;
  cleanupExpiredSessions: () => void;
}

/**
 * Initialize BargainEngine on first use
 */
let bargainEngineInitialized = false;

function ensureBargainEngineInitialized(): BargainEngine {
  if (!bargainEngineInitialized) {
    initializeBargainEngine(chatAnalyticsService);
    bargainEngineInitialized = true;
  }
  return getBargainEngine();
}

/**
 * Hook: useBargainEngine
 * Provides bargain logic interface for any product type
 */
export function useBargainEngine(props: UseBargainEngineProps): UseBargainEngineReturn {
  const { product, basePrice, onPriceSelected, onAbandon } = props;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<BargainSession | null>(null);
  const [round, setRound] = useState<number>(0);
  const engineRef = useRef<BargainEngine | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize BargainEngine reference
  useEffect(() => {
    engineRef.current = ensureBargainEngineInitialized();
  }, []);

  // Cleanup expired sessions periodically
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      if (engineRef.current) {
        engineRef.current.cleanupExpiredSessions();
      }
    }, 60000); // Every minute

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  // Start a new bargain session
  const startSession = useCallback((): string => {
    if (!engineRef.current) throw new Error('BargainEngine not initialized');

    const newSession = engineRef.current.initSession(product, basePrice);
    setSessionId(newSession.sessionId);
    setSession(newSession);
    setRound(1);

    return newSession.sessionId;
  }, [product, basePrice]);

  // Submit Round 1 price
  const submitRound1Price = useCallback(
    (userWishPrice: number): BargainRound => {
      if (!sessionId || !engineRef.current) {
        throw new Error('Bargain session not initialized');
      }

      const round = engineRef.current.processRound1(sessionId, userWishPrice);
      const updatedSession = engineRef.current.getSession(sessionId);
      if (updatedSession) {
        setSession(updatedSession);
        setRound(1);
      }

      return round;
    },
    [sessionId]
  );

  // Submit Round 2 price
  const submitRound2Price = useCallback(
    (userWishPrice: number): BargainRound => {
      if (!sessionId || !engineRef.current) {
        throw new Error('Bargain session not initialized');
      }

      const round = engineRef.current.processRound2(sessionId, userWishPrice);
      const updatedSession = engineRef.current.getSession(sessionId);
      if (updatedSession) {
        setSession(updatedSession);
        setRound(2);
      }

      return round;
    },
    [sessionId]
  );

  // User selects a price (Round 1 or Round 2)
  const selectPrice = useCallback(
    (selectedRound: 1 | 2): number => {
      if (!sessionId || !engineRef.current) {
        throw new Error('Bargain session not initialized');
      }

      const selectedPrice = engineRef.current.selectPrice(sessionId, selectedRound);
      const updatedSession = engineRef.current.getSession(sessionId);
      if (updatedSession) {
        setSession(updatedSession);
      }

      // Notify parent component
      onPriceSelected(sessionId, selectedPrice, selectedRound);

      return selectedPrice;
    },
    [sessionId, onPriceSelected]
  );

  // Abandon session (timer expires or user exits)
  const abandonSession = useCallback(
    (reason: 'timer_expired' | 'user_exit'): number => {
      if (!sessionId || !engineRef.current) {
        throw new Error('Bargain session not initialized');
      }

      const revertedPrice = engineRef.current.abandonBargain(sessionId, reason);

      // Notify parent component
      if (onAbandon) {
        onAbandon(sessionId, reason);
      }

      return revertedPrice;
    },
    [sessionId, onAbandon]
  );

  // Get current session
  const getSession = useCallback((): BargainSession | null => {
    if (!sessionId || !engineRef.current) return null;
    return engineRef.current.getSession(sessionId);
  }, [sessionId]);

  // Cleanup expired sessions
  const cleanupExpiredSessions = useCallback((): void => {
    if (engineRef.current) {
      engineRef.current.cleanupExpiredSessions();
    }
  }, []);

  const isSessionActive = sessionId !== null && session !== null && !session.selectedPrice;
  const isSessionExpired = sessionId ? engineRef.current?.isSessionExpired(sessionId) ?? false : false;

  return {
    sessionId,
    session,
    round,
    timerDuration: engineRef.current?.getTimerDuration() ?? 30,
    safeDealPrice: session?.round1?.systemOffer ?? null,
    finalOfferPrice: session?.round2?.systemOffer ?? null,
    maxRounds: engineRef.current?.getMaxRounds() ?? 2,
    isSessionActive,
    isSessionExpired,

    startSession,
    submitRound1Price,
    submitRound2Price,
    selectPrice,
    abandonSession,
    getSession,
    cleanupExpiredSessions,
  };
}

export default useBargainEngine;
