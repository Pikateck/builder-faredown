const redis = require("redis");
const logger = require("../services/logger");

let redisClient = null;
let isConnecting = false;

const DEFAULT_TTL = 1800; // 30 minutes

/**
 * Get or create Redis client with auto-reconnect
 */
async function getRedis() {
  if (redisClient) {
    return redisClient;
  }

  if (isConnecting) {
    // Wait for connection to complete
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (redisClient) {
          clearInterval(checkInterval);
          resolve(redisClient);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("Redis connection timeout"));
      }, 10000);
    });
  }

  isConnecting = true;

  try {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      logger.warn("⚠️  REDIS_URL not configured, Redis caching disabled");
      isConnecting = false;
      return null;
    }

    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error("Redis: Max retries exceeded, giving up");
            return new Error("Max retries exceeded");
          }
          return Math.min(retries * 50, 500);
        },
        connectTimeout: 10000,
      },
      retry_strategy: (options) => {
        if (options.error && options.error.code === "ECONNREFUSED") {
          logger.error("Redis connection refused");
          return new Error("Redis connection refused");
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error("Redis retry time exhausted");
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      },
    });

    redisClient.on("error", (err) => {
      logger.error("Redis client error:", err.message);
      redisClient = null;
    });

    redisClient.on("connect", () => {
      logger.info("✅ Redis connected");
    });

    redisClient.on("ready", () => {
      logger.info("✅ Redis ready");
    });

    redisClient.on("reconnecting", () => {
      logger.warn("⚠️  Redis reconnecting...");
    });

    await redisClient.connect();
    isConnecting = false;
    return redisClient;
  } catch (error) {
    logger.error("Failed to initialize Redis client:", error.message);
    isConnecting = false;
    redisClient = null;
    return null;
  }
}

/**
 * Get value from Redis
 * @param {string} key
 * @returns {Promise<string|null>}
 */
async function get(key) {
  try {
    const client = await getRedis();
    if (!client) return null;
    return await client.get(key);
  } catch (error) {
    logger.warn(`Redis GET error for key ${key}:`, error.message);
    return null;
  }
}

/**
 * Set value in Redis with TTL
 * @param {string} key
 * @param {string} value
 * @param {number} ttl - seconds (default: 1800)
 * @returns {Promise<boolean>}
 */
async function set(key, value, ttl = DEFAULT_TTL) {
  try {
    const client = await getRedis();
    if (!client) return false;
    await client.setEx(key, ttl, value);
    return true;
  } catch (error) {
    logger.warn(`Redis SET error for key ${key}:`, error.message);
    return false;
  }
}

/**
 * Get JSON object from Redis
 * @param {string} key
 * @returns {Promise<object|null>}
 */
async function getJSON(key) {
  try {
    const client = await getRedis();
    if (!client) return null;
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    logger.warn(`Redis GET JSON error for key ${key}:`, error.message);
    return null;
  }
}

/**
 * Set JSON object in Redis with TTL
 * @param {string} key
 * @param {object} value
 * @param {number} ttl - seconds (default: 1800)
 * @returns {Promise<boolean>}
 */
async function setJSON(key, value, ttl = DEFAULT_TTL) {
  try {
    const client = await getRedis();
    if (!client) return false;
    const serialized = JSON.stringify(value);
    await client.setEx(key, ttl, serialized);
    return true;
  } catch (error) {
    logger.warn(`Redis SET JSON error for key ${key}:`, error.message);
    return false;
  }
}

/**
 * Delete key from Redis
 * @param {string} key
 * @returns {Promise<boolean>}
 */
async function del(key) {
  try {
    const client = await getRedis();
    if (!client) return false;
    await client.del(key);
    return true;
  } catch (error) {
    logger.warn(`Redis DEL error for key ${key}:`, error.message);
    return false;
  }
}

/**
 * Delete multiple keys from Redis
 * @param {string[]} keys
 * @returns {Promise<number>}
 */
async function delMany(keys) {
  try {
    if (keys.length === 0) return 0;
    const client = await getRedis();
    if (!client) return 0;
    return await client.del(keys);
  } catch (error) {
    logger.warn(`Redis DEL MANY error:`, error.message);
    return 0;
  }
}

/**
 * Increment counter in Redis
 * @param {string} key
 * @param {number} increment
 * @returns {Promise<number|null>}
 */
async function incr(key, increment = 1) {
  try {
    const client = await getRedis();
    if (!client) return null;
    return await client.incrBy(key, increment);
  } catch (error) {
    logger.warn(`Redis INCR error for key ${key}:`, error.message);
    return null;
  }
}

/**
 * Check if key exists in Redis
 * @param {string} key
 * @returns {Promise<boolean>}
 */
async function exists(key) {
  try {
    const client = await getRedis();
    if (!client) return false;
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    logger.warn(`Redis EXISTS error for key ${key}:`, error.message);
    return false;
  }
}

/**
 * Get keys matching pattern
 * @param {string} pattern - e.g., "loc:city:*"
 * @returns {Promise<string[]>}
 */
async function keys(pattern) {
  try {
    const client = await getRedis();
    if (!client) return [];
    return await client.keys(pattern);
  } catch (error) {
    logger.warn(`Redis KEYS error for pattern ${pattern}:`, error.message);
    return [];
  }
}

/**
 * Get TTL for key (in seconds)
 * @param {string} key
 * @returns {Promise<number|null>}
 */
async function ttl(key) {
  try {
    const client = await getRedis();
    if (!client) return null;
    return await client.ttl(key);
  } catch (error) {
    logger.warn(`Redis TTL error for key ${key}:`, error.message);
    return null;
  }
}

/**
 * Set TTL for existing key
 * @param {string} key
 * @param {number} ttl - seconds
 * @returns {Promise<boolean>}
 */
async function setTTL(key, ttl) {
  try {
    const client = await getRedis();
    if (!client) return false;
    await client.expire(key, ttl);
    return true;
  } catch (error) {
    logger.warn(`Redis EXPIRE error for key ${key}:`, error.message);
    return false;
  }
}

/**
 * Flush all keys in Redis (use with caution)
 * @returns {Promise<boolean>}
 */
async function flushAll() {
  try {
    const client = await getRedis();
    if (!client) return false;
    await client.flushAll();
    logger.info("✅ Redis flushed");
    return true;
  } catch (error) {
    logger.error("Redis FLUSH error:", error.message);
    return false;
  }
}

/**
 * Utility: normalize search string for cache keys
 * @param {string} text
 * @returns {string}
 */
function normalize(text) {
  return (text || "").toLowerCase().replace(/\s+/g, "");
}

module.exports = {
  getRedis,
  get,
  set,
  getJSON,
  setJSON,
  del,
  delMany,
  incr,
  exists,
  keys,
  ttl,
  setTTL,
  flushAll,
  normalize,
  DEFAULT_TTL,
};
