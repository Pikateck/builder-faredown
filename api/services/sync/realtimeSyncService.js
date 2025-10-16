/**
 * Real-Time Synchronization Service (Phase 3)
 * Async, non-blocking supplier sync with fallback handling
 * Periodically refreshes rates from all suppliers independently
 */

const db = require("../../database/connection");
const supplierAdapterManager = require("../adapters/supplierAdapterManager");
const winston = require("winston");

class RealTimeSyncService {
  constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] [REALTIME_SYNC] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
        }),
      ),
      transports: [new winston.transports.Console()],
    });

    this.syncJobs = new Map(); // Track running sync jobs
    this.syncConfig = {
      RATEHAWK: { intervalMs: 3600000, maxAge: 7200000 }, // 1hr sync, 2hr max age
      HOTELBEDS: { intervalMs: 3600000, maxAge: 7200000 }, // 1hr sync, 2hr max age
      TBO: { intervalMs: 3600000, maxAge: 7200000 }, // 1hr sync, 2hr max age
    };
  }

  /**
   * Start all supplier sync jobs
   * Non-blocking - runs in background
   */
  startAllSyncJobs() {
    try {
      this.logger.info("Starting real-time sync for all suppliers");

      const suppliers = ["RATEHAWK", "HOTELBEDS", "TBO"];
      for (const supplier of suppliers) {
        this.startSupplierSync(supplier);
      }

      this.logger.info("All sync jobs started in background");
    } catch (error) {
      this.logger.error("Error starting sync jobs", { error: error.message });
    }
  }

  /**
   * Start sync for a specific supplier
   * Runs independently with automatic fallback on failure
   */
  startSupplierSync(supplierCode) {
    try {
      // Prevent duplicate sync jobs
      if (this.syncJobs.has(supplierCode)) {
        this.logger.warn(`Sync job already running for ${supplierCode}`);
        return;
      }

      const config = this.syncConfig[supplierCode];
      if (!config) {
        this.logger.warn(`No sync config for supplier ${supplierCode}`);
        return;
      }

      // Schedule periodic sync
      const jobId = setInterval(async () => {
        try {
          await this.syncSupplierRates(supplierCode);
        } catch (error) {
          this.logger.error(`Sync error for ${supplierCode}`, {
            error: error.message,
          });
          // Continue running - don't let errors stop the interval
        }
      }, config.intervalMs);

      this.syncJobs.set(supplierCode, jobId);
      this.logger.info(`Started sync job for ${supplierCode}`, {
        intervalMinutes: config.intervalMs / 60000,
      });

      // Run initial sync immediately (non-blocking)
      setImmediate(() => this.syncSupplierRates(supplierCode));
    } catch (error) {
      this.logger.error(`Failed to start sync for ${supplierCode}`, {
        error: error.message,
      });
    }
  }

  /**
   * Sync rates for a specific supplier
   * Finds stale offers and refreshes them
   * Non-blocking - errors are logged but don't interrupt
   */
  async syncSupplierRates(supplierCode) {
    const startTime = Date.now();

    try {
      this.logger.info(`Starting rate sync for ${supplierCode}`);

      // Get stale offers (older than max age)
      const config = this.syncConfig[supplierCode];
      const staleOffers = await this.getStaleOffers(supplierCode, config.maxAge);

      if (staleOffers.length === 0) {
        this.logger.debug(`No stale offers to sync for ${supplierCode}`);
        return;
      }

      this.logger.info(`Found ${staleOffers.length} stale offers for ${supplierCode}`);

      // Group by property and search context
      const syncBatches = this.groupOffersBySyncContext(staleOffers);

      let successCount = 0;
      let failureCount = 0;

      // Process each sync batch independently
      for (const batch of syncBatches) {
        try {
          const result = await this.resyncOfferBatch(batch, supplierCode);
          successCount += result.updated;
          failureCount += result.failed;
        } catch (batchError) {
          this.logger.warn(`Batch sync failed for ${supplierCode}`, {
            error: batchError.message,
            batchSize: batch.searchContext,
          });
          failureCount++;
          // Continue with next batch - don't let one failure stop all
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info(`Completed rate sync for ${supplierCode}`, {
        staleOffers: staleOffers.length,
        updated: successCount,
        failed: failureCount,
        duration: `${duration}ms`,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Rate sync failed for ${supplierCode}`, {
        error: error.message,
        duration: `${duration}ms`,
      });
      // Don't throw - service continues regardless of errors
    }
  }

  /**
   * Get stale offers (older than max age)
   * Only returns offers where rates have likely changed
   */
  async getStaleOffers(supplierCode, maxAgeMs) {
    try {
      const staleDate = new Date(Date.now() - maxAgeMs);

      const result = await db.query(
        `SELECT DISTINCT ON (ru.property_id, ru.search_checkin, ru.search_checkout)
          ru.property_id,
          ru.search_checkin,
          ru.search_checkout,
          hu.city,
          hu.country,
          COUNT(*) as offer_count
         FROM room_offer_unified ru
         JOIN hotel_unified hu ON ru.property_id = hu.property_id
         WHERE ru.supplier_code = $1
         AND ru.created_at < $2
         AND (ru.expires_at IS NULL OR ru.expires_at < NOW())
         GROUP BY ru.property_id, ru.search_checkin, ru.search_checkout, hu.city, hu.country
         LIMIT 100`,
        [supplierCode, staleDate],
      );

      return result.rows;
    } catch (error) {
      this.logger.error("Error fetching stale offers", {
        supplier: supplierCode,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Group stale offers by search context (city, dates)
   * Enables efficient batch resyncing
   */
  groupOffersBySyncContext(offers) {
    const grouped = new Map();

    for (const offer of offers) {
      const contextKey = `${offer.city}|${offer.search_checkin}|${offer.search_checkout}`;

      if (!grouped.has(contextKey)) {
        grouped.set(contextKey, {
          searchContext: {
            city: offer.city,
            country: offer.country,
            checkIn: offer.search_checkin,
            checkOut: offer.search_checkout,
          },
          properties: [],
        });
      }

      grouped.get(contextKey).properties.push(offer.property_id);
    }

    return Array.from(grouped.values());
  }

  /**
   * Resync offer batch by calling supplier API
   * Returns count of updated and failed offers
   */
  async resyncOfferBatch(batch, supplierCode) {
    try {
      const adapter = supplierAdapterManager.getAdapter(supplierCode);
      if (!adapter) {
        return { updated: 0, failed: batch.properties.length };
      }

      // Prepare search params for resync
      const searchParams = {
        destination: batch.searchContext.city,
        destinationCode: batch.searchContext.city.substring(0, 3).toUpperCase(),
        checkIn: batch.searchContext.checkIn,
        checkOut: batch.searchContext.checkOut,
        rooms: [{ adults: 2, children: 0 }],
        currency: "USD",
        maxResults: 100,
      };

      this.logger.debug(`Resyncing ${batch.properties.length} properties for ${supplierCode}`);

      // Call adapter (will persist via persistToMasterSchema)
      const results = await adapter.searchHotels(searchParams);

      // Mark old offers as expired
      await this.markOffersExpired(
        batch.properties,
        supplierCode,
        batch.searchContext.checkIn,
        batch.searchContext.checkOut,
      );

      return { updated: results.length, failed: 0 };
    } catch (error) {
      this.logger.warn("Error resyncing offer batch", {
        error: error.message,
        supplier: supplierCode,
      });
      return { updated: 0, failed: batch.properties.length };
    }
  }

  /**
   * Mark old offers as expired after resync
   * Prevents old stale rates from being returned
   */
  async markOffersExpired(propertyIds, supplierCode, checkIn, checkOut) {
    try {
      if (propertyIds.length === 0) return;

      const placeholders = propertyIds.map((_, i) => `$${i + 4}`).join(",");

      await db.query(
        `UPDATE room_offer_unified
         SET expires_at = NOW()
         WHERE property_id = ANY(ARRAY[${placeholders}])
         AND supplier_code = $1
         AND search_checkin = $2
         AND search_checkout = $3
         AND expires_at IS NULL`,
        [supplierCode, checkIn, checkOut, ...propertyIds],
      );

      this.logger.debug(`Marked ${propertyIds.length} offers as expired`, {
        supplier: supplierCode,
      });
    } catch (error) {
      this.logger.warn("Error marking offers expired", {
        error: error.message,
      });
    }
  }

  /**
   * Stop all sync jobs
   * Call during graceful shutdown
   */
  stopAllSyncJobs() {
    try {
      this.logger.info("Stopping all sync jobs");

      for (const [supplier, jobId] of this.syncJobs) {
        clearInterval(jobId);
        this.logger.info(`Stopped sync job for ${supplier}`);
      }

      this.syncJobs.clear();
    } catch (error) {
      this.logger.error("Error stopping sync jobs", { error: error.message });
    }
  }

  /**
   * Get sync status for a supplier
   * Returns last sync time and next scheduled time
   */
  async getSupplierSyncStatus(supplierCode) {
    try {
      const isRunning = this.syncJobs.has(supplierCode);

      // Get last sync log
      const result = await db.query(
        `SELECT MAX(created_at) as last_sync
         FROM room_offer_unified
         WHERE supplier_code = $1`,
        [supplierCode],
      );

      const config = this.syncConfig[supplierCode];

      return {
        supplier_code: supplierCode,
        is_running: isRunning,
        last_sync: result.rows[0]?.last_sync,
        next_sync: new Date(Date.now() + config.intervalMs),
        interval_minutes: config.intervalMs / 60000,
        max_age_minutes: config.maxAge / 60000,
      };
    } catch (error) {
      this.logger.error("Error getting sync status", {
        supplier: supplierCode,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get all sync statuses
   */
  async getAllSyncStatuses() {
    const suppliers = ["RATEHAWK", "HOTELBEDS", "TBO"];
    const statuses = [];

    for (const supplier of suppliers) {
      const status = await this.getSupplierSyncStatus(supplier);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  /**
   * Force immediate resync for a supplier
   * Useful for testing or manual refresh
   */
  async forceResync(supplierCode) {
    try {
      this.logger.info(`Force resyncing ${supplierCode}`);
      await this.syncSupplierRates(supplierCode);
      return { status: "success", supplier: supplierCode };
    } catch (error) {
      this.logger.error("Force resync failed", {
        supplier: supplierCode,
        error: error.message,
      });
      return {
        status: "error",
        supplier: supplierCode,
        error: error.message,
      };
    }
  }
}

module.exports = RealTimeSyncService;
