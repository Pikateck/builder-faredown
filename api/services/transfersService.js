/**
 * Transfers Service
 * Handles transfer search, booking, and management operations
 * Integrates with supplier adapters and applies business logic
 */

const HotelbedsTransfersAdapter = require("./adapters/hotelbedsTransfersAdapter");
const transfersRepository = require("../repositories/transfersRepository");
const markupService = require("./markupService");
const promoService = require("./promoService");
const auditService = require("./auditService");
const winston = require("winston");

class TransfersService {
  constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] [TRANSFERS] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
        })
      ),
      transports: [new winston.transports.Console()],
    });

    // Initialize adapters
    this.adapters = {
      hotelbeds: new HotelbedsTransfersAdapter(),
    };

    // Default settings
    this.defaultSettings = {
      maxResults: 20,
      cacheTimeoutMinutes: 60,
      defaultCurrency: "INR",
      defaultLanguage: "ENG",
      searchTimeoutMs: 30000,
    };
  }

  /**
   * Search for available transfers
   * @param {Object} searchParams - Search parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Search results with transfers
   */
  async searchTransfers(searchParams, options = {}) {
    const startTime = Date.now();
    const sessionId = this.generateSessionId();

    try {
      this.logger.info("Starting transfer search", {
        sessionId,
        pickupLocation: searchParams.pickupLocation,
        dropoffLocation: searchParams.dropoffLocation,
        pickupDate: searchParams.pickupDate,
        isRoundTrip: searchParams.isRoundTrip,
      });

      // Validate search parameters
      this.validateSearchParams(searchParams);

      // Check cache first
      const cachedResults = await this.getCachedResults(searchParams);
      if (cachedResults && !options.bypassCache) {
        this.logger.info("Returning cached results", {
          sessionId,
          transfersCount: cachedResults.transfers.length,
          cacheAge: Date.now() - new Date(cachedResults.cachedAt).getTime(),
        });

        return this.applyBusinessLogic(cachedResults, searchParams, sessionId);
      }

      // Search with suppliers
      const results = await this.searchWithSuppliers(searchParams, sessionId);

      // Cache results
      await this.cacheResults(searchParams, results, sessionId);

      // Apply business logic (markup, promos, etc.)
      const finalResults = await this.applyBusinessLogic(results, searchParams, sessionId);

      const duration = Date.now() - startTime;
      this.logger.info("Transfer search completed", {
        sessionId,
        transfersCount: finalResults.transfers.length,
        duration,
        suppliers: Object.keys(results.supplierResults),
      });

      return finalResults;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error("Transfer search failed", {
        sessionId,
        error: error.message,
        duration,
        searchParams,
      });

      throw new Error(`Transfer search failed: ${error.message}`);
    }
  }

  /**
   * Get detailed information about a specific transfer
   * @param {string} transferId - Transfer product ID
   * @param {Object} searchParams - Original search parameters
   * @returns {Promise<Object>} - Transfer details
   */
  async getTransferDetails(transferId, searchParams) {
    try {
      this.logger.info("Getting transfer details", { transferId });

      // Parse supplier from transfer ID
      const { supplierCode, productId } = this.parseTransferId(transferId);
      const adapter = this.adapters[supplierCode];

      if (!adapter) {
        throw new Error(`Unsupported supplier: ${supplierCode}`);
      }

      // Get details from supplier
      const details = await adapter.getTransferDetails(productId, searchParams);

      // Apply business logic
      const enhancedDetails = await this.enhanceTransferDetails(details, searchParams);

      this.logger.info("Transfer details retrieved", {
        transferId,
        supplierCode,
        vehicleType: details.vehicleType,
        totalPrice: enhancedDetails.pricing.totalPrice,
      });

      return enhancedDetails;
    } catch (error) {
      this.logger.error("Failed to get transfer details", {
        transferId,
        error: error.message,
      });

      throw new Error(`Failed to get transfer details: ${error.message}`);
    }
  }

  /**
   * Book a transfer
   * @param {Object} bookingData - Booking information
   * @returns {Promise<Object>} - Booking confirmation
   */
  async bookTransfer(bookingData) {
    const bookingRef = this.generateBookingReference();

    try {
      this.logger.info("Starting transfer booking", {
        bookingRef,
        transferId: bookingData.transferId,
        totalAmount: bookingData.totalAmount,
      });

      // Validate booking data
      this.validateBookingData(bookingData);

      // Parse supplier from transfer ID
      const { supplierCode, productId } = this.parseTransferId(bookingData.transferId);
      const adapter = this.adapters[supplierCode];

      if (!adapter) {
        throw new Error(`Unsupported supplier: ${supplierCode}`);
      }

      // Apply final pricing (with promos, markups, etc.)
      const finalPricing = await this.calculateFinalPricing(bookingData);

      // Create booking record in database
      const dbBooking = await transfersRepository.createBooking({
        bookingRef,
        ...bookingData,
        ...finalPricing,
        status: "pending",
      });

      // Book with supplier
      const supplierBooking = await adapter.bookTransfer({
        ...bookingData,
        clientReference: bookingRef,
      });

      // Update booking with supplier response
      await transfersRepository.updateBooking(dbBooking.id, {
        supplierBookingRef: supplierBooking.bookingReference,
        supplierResponse: supplierBooking.rawResponse,
        status: supplierBooking.status === "CONFIRMED" ? "confirmed" : "pending",
        confirmationDate: supplierBooking.confirmationDate,
      });

      // Log booking for audit
      await auditService.logTransferBooking({
        bookingId: dbBooking.id,
        bookingRef,
        supplierCode,
        userId: bookingData.userId,
        action: "booking_created",
        data: {
          transferId: bookingData.transferId,
          totalAmount: finalPricing.totalAmount,
          supplierBookingRef: supplierBooking.bookingReference,
        },
      });

      const result = {
        success: true,
        bookingReference: bookingRef,
        supplierReference: supplierBooking.bookingReference,
        status: supplierBooking.status,
        confirmationDate: supplierBooking.confirmationDate,
        transferDetails: supplierBooking.transferDetails,
        pricing: finalPricing,
        voucherUrl: supplierBooking.voucherUrl,
        bookingId: dbBooking.id,
      };

      this.logger.info("Transfer booking completed", {
        bookingRef,
        supplierBookingRef: supplierBooking.bookingReference,
        status: result.status,
        totalAmount: finalPricing.totalAmount,
      });

      return result;
    } catch (error) {
      this.logger.error("Transfer booking failed", {
        bookingRef,
        error: error.message,
        transferId: bookingData.transferId,
      });

      // Update booking status to failed
      try {
        await transfersRepository.updateBookingByRef(bookingRef, {
          status: "failed",
          internalNotes: `Booking failed: ${error.message}`,
        });
      } catch (updateError) {
        this.logger.error("Failed to update booking status", {
          bookingRef,
          error: updateError.message,
        });
      }

      throw new Error(`Transfer booking failed: ${error.message}`);
    }
  }

  /**
   * Cancel a transfer booking
   * @param {string} bookingReference - Booking reference
   * @param {Object} cancellationData - Cancellation details
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelTransfer(bookingReference, cancellationData = {}) {
    try {
      this.logger.info("Cancelling transfer", { bookingReference });

      // Get booking from database
      const booking = await transfersRepository.getBookingByRef(bookingReference);
      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.status === "cancelled") {
        throw new Error("Booking is already cancelled");
      }

      // Get supplier adapter
      const adapter = this.adapters[booking.supplierCode];
      if (!adapter) {
        throw new Error(`Unsupported supplier: ${booking.supplierCode}`);
      }

      // Cancel with supplier
      const cancellationResult = await adapter.cancelTransfer(
        booking.supplierBookingRef,
        cancellationData.cancellationFlag
      );

      // Update booking in database
      await transfersRepository.updateBooking(booking.id, {
        status: "cancelled",
        cancellationDate: new Date(),
        internalNotes: `Cancelled: ${cancellationData.reason || "Customer request"}`,
      });

      // Log cancellation
      await auditService.logTransferBooking({
        bookingId: booking.id,
        bookingRef: bookingReference,
        userId: cancellationData.userId,
        action: "booking_cancelled",
        data: {
          reason: cancellationData.reason,
          cancellationResult,
        },
      });

      this.logger.info("Transfer cancelled successfully", {
        bookingReference,
        supplierBookingRef: booking.supplierBookingRef,
      });

      return {
        success: true,
        bookingReference,
        status: "cancelled",
        cancellationDate: new Date().toISOString(),
        refundAmount: cancellationResult.refundAmount || 0,
        cancellationFee: cancellationResult.cancellationFee || 0,
      };
    } catch (error) {
      this.logger.error("Transfer cancellation failed", {
        bookingReference,
        error: error.message,
      });

      throw new Error(`Transfer cancellation failed: ${error.message}`);
    }
  }

  /**
   * Get booking details
   * @param {string} bookingReference - Booking reference
   * @returns {Promise<Object>} - Booking details
   */
  async getBookingDetails(bookingReference) {
    try {
      this.logger.info("Getting booking details", { bookingReference });

      const booking = await transfersRepository.getBookingByRef(bookingReference);
      if (!booking) {
        throw new Error("Booking not found");
      }

      // Get live status from supplier if needed
      if (booking.status === "pending" || booking.status === "confirmed") {
        try {
          const adapter = this.adapters[booking.supplierCode];
          if (adapter) {
            const liveDetails = await adapter.getBookingDetails(booking.supplierBookingRef);
            
            // Update status if changed
            if (liveDetails.status !== booking.status) {
              await transfersRepository.updateBooking(booking.id, {
                status: liveDetails.status,
              });
              booking.status = liveDetails.status;
            }
          }
        } catch (error) {
          this.logger.warn("Failed to get live booking status", {
            bookingReference,
            error: error.message,
          });
        }
      }

      return {
        bookingReference: booking.bookingRef,
        supplierReference: booking.supplierBookingRef,
        status: booking.status,
        transferDetails: {
          pickupLocation: booking.pickupLocation,
          dropoffLocation: booking.dropoffLocation,
          pickupDate: booking.pickupDate,
          pickupTime: booking.pickupTime,
          vehicleType: booking.vehicleType,
          vehicleClass: booking.vehicleClass,
          maxPassengers: booking.totalPassengers,
        },
        guestDetails: booking.guestDetails,
        pricing: {
          basePrice: booking.basePrice,
          markupAmount: booking.markupAmount,
          discountAmount: booking.discountAmount,
          totalAmount: booking.totalAmount,
          currency: booking.currency,
        },
        dates: {
          bookingDate: booking.bookingDate,
          confirmationDate: booking.confirmationDate,
          cancellationDate: booking.cancellationDate,
        },
        driverDetails: booking.driverName ? {
          name: booking.driverName,
          phone: booking.driverPhone,
          vehicle: {
            make: booking.vehicleMake,
            model: booking.vehicleModel,
            color: booking.vehicleColor,
            licensePlate: booking.vehicleLicensePlate,
          },
        } : null,
        trackingUrl: booking.trackingUrl,
        voucherUrl: booking.receiptUrl,
      };
    } catch (error) {
      this.logger.error("Failed to get booking details", {
        bookingReference,
        error: error.message,
      });

      throw new Error(`Failed to get booking details: ${error.message}`);
    }
  }

  /**
   * Search with all available suppliers
   * @param {Object} searchParams - Search parameters
   * @param {string} sessionId - Session ID for tracking
   * @returns {Promise<Object>} - Combined results
   */
  async searchWithSuppliers(searchParams, sessionId) {
    const searchPromises = [];
    const supplierResults = {};

    // Search with Hotelbeds (primary supplier)
    if (this.adapters.hotelbeds) {
      searchPromises.push(
        this.adapters.hotelbeds
          .searchTransfers(searchParams)
          .then((results) => {
            supplierResults.hotelbeds = results;
            return results;
          })
          .catch((error) => {
            this.logger.error("Hotelbeds search failed", {
              sessionId,
              error: error.message,
            });
            supplierResults.hotelbeds = [];
            return [];
          })
      );
    }

    // Wait for all searches to complete
    const allResults = await Promise.all(searchPromises);

    // Combine and deduplicate results
    const combinedTransfers = allResults.flat();

    return {
      transfers: combinedTransfers,
      supplierResults,
      searchParams,
      sessionId,
      searchedAt: new Date().toISOString(),
    };
  }

  /**
   * Apply business logic (markup, promos, filtering)
   * @param {Object} results - Raw search results
   * @param {Object} searchParams - Search parameters
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Enhanced results
   */
  async applyBusinessLogic(results, searchParams, sessionId) {
    const enhancedTransfers = [];

    for (const transfer of results.transfers) {
      try {
        // Apply markup rules
        const markupAmount = await markupService.calculateTransferMarkup(transfer, searchParams);
        
        // Calculate total price with markup
        const totalPrice = parseFloat(transfer.basePrice) + markupAmount;
        
        // Check for applicable promo codes
        let discountAmount = 0;
        if (searchParams.promoCode) {
          try {
            const promoResult = await promoService.validateTransferPromo(
              searchParams.promoCode,
              {
                transferId: transfer.id,
                totalPrice,
                route: `${searchParams.pickupLocation}-${searchParams.dropoffLocation}`,
                vehicleType: transfer.vehicleType,
              }
            );
            
            if (promoResult.isValid) {
              discountAmount = promoResult.discountAmount;
            }
          } catch (promoError) {
            this.logger.warn("Promo validation failed", {
              sessionId,
              promoCode: searchParams.promoCode,
              error: promoError.message,
            });
          }
        }

        // Calculate final price
        const finalPrice = Math.max(totalPrice - discountAmount, transfer.basePrice * 1.05); // Never-loss protection

        enhancedTransfers.push({
          ...transfer,
          pricing: {
            basePrice: transfer.basePrice,
            markupAmount,
            discountAmount,
            totalPrice: finalPrice,
            currency: transfer.currency,
            savings: totalPrice - finalPrice,
          },
          id: `${transfer.supplierCode}_${transfer.id}`, // Prefix with supplier
          searchSessionId: sessionId,
          enhancedAt: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.error("Failed to enhance transfer", {
          sessionId,
          transferId: transfer.id,
          error: error.message,
        });

        // Include transfer without enhancements
        enhancedTransfers.push({
          ...transfer,
          pricing: {
            basePrice: transfer.basePrice,
            markupAmount: 0,
            discountAmount: 0,
            totalPrice: transfer.basePrice,
            currency: transfer.currency,
            savings: 0,
          },
          id: `${transfer.supplierCode}_${transfer.id}`,
          searchSessionId: sessionId,
        });
      }
    }

    // Sort by price
    enhancedTransfers.sort((a, b) => a.pricing.totalPrice - b.pricing.totalPrice);

    return {
      transfers: enhancedTransfers,
      searchParams,
      sessionId,
      summary: {
        totalResults: enhancedTransfers.length,
        priceRange: enhancedTransfers.length > 0 ? {
          min: Math.min(...enhancedTransfers.map(t => t.pricing.totalPrice)),
          max: Math.max(...enhancedTransfers.map(t => t.pricing.totalPrice)),
          currency: enhancedTransfers[0]?.pricing.currency || "INR",
        } : null,
        vehicleTypes: [...new Set(enhancedTransfers.map(t => t.vehicleType))],
        suppliers: [...new Set(enhancedTransfers.map(t => t.supplierCode))],
      },
      searchedAt: new Date().toISOString(),
    };
  }

  /**
   * Validate search parameters
   * @param {Object} searchParams - Parameters to validate
   */
  validateSearchParams(searchParams) {
    const required = ["pickupLocation", "dropoffLocation", "pickupDate"];
    
    for (const field of required) {
      if (!searchParams[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate dates
    const pickupDate = new Date(searchParams.pickupDate);
    if (pickupDate < new Date()) {
      throw new Error("Pickup date cannot be in the past");
    }

    if (searchParams.isRoundTrip && searchParams.returnDate) {
      const returnDate = new Date(searchParams.returnDate);
      if (returnDate <= pickupDate) {
        throw new Error("Return date must be after pickup date");
      }
    }

    // Validate passenger counts
    if (searchParams.passengers) {
      const { adults, children, infants } = searchParams.passengers;
      if (adults < 1 || adults > 8) {
        throw new Error("Adults count must be between 1 and 8");
      }
      if (children < 0 || children > 6) {
        throw new Error("Children count must be between 0 and 6");
      }
      if (infants < 0 || infants > 3) {
        throw new Error("Infants count must be between 0 and 3");
      }
    }
  }

  /**
   * Generate unique session ID
   * @returns {string} - Session ID
   */
  generateSessionId() {
    return `TS${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate booking reference
   * @returns {string} - Booking reference
   */
  generateBookingReference() {
    return `TR${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  /**
   * Parse transfer ID to extract supplier and product ID
   * @param {string} transferId - Transfer ID
   * @returns {Object} - Supplier code and product ID
   */
  parseTransferId(transferId) {
    const parts = transferId.split("_");
    if (parts.length !== 2) {
      throw new Error("Invalid transfer ID format");
    }

    return {
      supplierCode: parts[0].toLowerCase(),
      productId: parts[1],
    };
  }

  // Additional helper methods would go here...
  // (getCachedResults, cacheResults, enhanceTransferDetails, calculateFinalPricing, etc.)
}

module.exports = new TransfersService();
