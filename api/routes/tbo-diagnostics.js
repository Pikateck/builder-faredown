/**
 * TBO Diagnostics Endpoint
 * Provides one-click verification of TBO connectivity, proxy setup, and API access
 * GET /api/tbo/diagnostics
 */

const express = require("express");
const axios = require("axios");
const { tboRequest, tboVia } = require("../lib/tboRequest");
const winston = require("winston");

const router = express.Router();

// Initialize logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}] [TBO-DIAG] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Detect outbound IP through multiple methods
 */
async function detectOutboundIP() {
  const ips = {
    via_ipify: null,
    via_ifconfig: null,
    via_icanhazip: null,
    detected_at: new Date().toISOString(),
  };

  const services = [
    {
      name: "via_ipify",
      url: "https://api.ipify.org?format=json",
      parser: (data) => data.ip,
    },
    {
      name: "via_ifconfig",
      url: "http://ifconfig.me",
      parser: (data) => (typeof data === "string" ? data.trim() : data.ip),
    },
    {
      name: "via_icanhazip",
      url: "https://icanhazip.com/",
      parser: (data) => (typeof data === "string" ? data.trim() : data.ip),
    },
  ];

  for (const service of services) {
    try {
      const response = await tboRequest(service.url, {
        method: "GET",
        timeout: 5000,
      });
      const data =
        typeof response.data === "string"
          ? response.data
          : JSON.parse(response.data);
      ips[service.name] = service.parser(data);
    } catch (e) {
      ips[service.name] = `ERROR: ${e.message}`;
    }
  }

  return ips;
}

/**
 * Test TBO Hotel Search API with sample payload
 */
async function testTBOHotelSearch() {
  const testPayload = {
    ClientId: process.env.TBO_HOTEL_CLIENT_ID || process.env.TBO_CLIENT_ID,
    UserName: process.env.TBO_HOTEL_USER_ID || process.env.TBO_API_USER_ID,
    Password: process.env.TBO_HOTEL_PASSWORD || process.env.TBO_API_PASSWORD,
    EndUserIp: process.env.TBO_END_USER_IP || "192.168.5.56",
    CheckIn: "31/10/2025", // dd/mm/yyyy format (CORRECT for TBO API)
    CheckOut: "03/11/2025",
    CityId: "130443", // Numeric CityId for Dubai (CORRECT format)
    NoOfRooms: 1,
    RoomGuests: [{ NoOfAdults: 2, NoOfChild: 0 }],
    GuestNationality: "IN",
    PreferredCurrency: "INR",
    IsNearBySearchAllowed: true,
  };

  const endpoint =
    process.env.TBO_HOTEL_SEARCH_URL ||
    "https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult";

  const result = {
    endpoint: endpoint + "Search",
    request_masked: {
      ClientId: testPayload.ClientId,
      UserName: testPayload.UserName,
      Password: "***MASKED***",
      EndUserIp: testPayload.EndUserIp,
      CheckIn: testPayload.CheckIn,
      CheckOut: testPayload.CheckOut,
      City: testPayload.City,
      NoOfRooms: testPayload.NoOfRooms,
      GuestNationality: testPayload.GuestNationality,
      PreferredCurrency: testPayload.PreferredCurrency,
    },
    via: tboVia(),
    test_at: new Date().toISOString(),
    response: null,
    error: null,
    status_code: null,
  };

  try {
    logger.info("Testing TBO Hotel Search", {
      endpoint: result.endpoint,
      city: testPayload.City,
      dates: `${testPayload.CheckIn} to ${testPayload.CheckOut}`,
      clientId: testPayload.ClientId,
    });

    const response = await tboRequest(result.endpoint, {
      method: "POST",
      data: testPayload,
      timeout: 20000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    result.status_code = response.status;
    result.response = response.data;

    // Log success with status code
    if (response.data?.Status?.Code === 1) {
      logger.info("✅ TBO Hotel Search SUCCESS", {
        statusCode: response.data.Status.Code,
        hotelCount: Array.isArray(response.data.HotelResults)
          ? response.data.HotelResults.length
          : 0,
        responseTime: response.data?.ResponseTime,
      });
    } else {
      logger.warn("⚠️ TBO Hotel Search non-success status", {
        statusCode: response.data?.Status?.Code,
        description: response.data?.Status?.Description,
        errorCode: response.data?.Error?.ErrorCode,
        errorMessage: response.data?.Error?.ErrorMessage,
      });
    }
  } catch (e) {
    result.error = {
      message: e.message,
      code: e.code,
      statusCode: e.response?.status,
      statusText: e.response?.statusText,
      responseData: e.response?.data
        ? JSON.stringify(e.response.data).substring(0, 200)
        : null,
    };

    logger.error("❌ TBO Hotel Search FAILED", {
      message: e.message,
      statusCode: e.response?.status,
      endpoint: result.endpoint,
    });
  }

  return result;
}

/**
 * GET /api/tbo/diagnostics
 * Run complete diagnostics
 */
router.get("/diagnostics", async (req, res) => {
  try {
    logger.info("🔍 TBO Diagnostics request started");

    const [ipDetection, hotelSearchTest] = await Promise.all([
      detectOutboundIP(),
      testTBOHotelSearch(),
    ]);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      status: "completed",
      environment: {
        node_env: process.env.NODE_ENV,
        use_supplier_proxy:
          process.env.USE_SUPPLIER_PROXY === "true" ? "YES" : "NO",
        fixie_url: process.env.FIXIE_URL ? "CONFIGURED" : "NOT_SET",
        http_proxy: process.env.HTTP_PROXY ? "CONFIGURED" : "NOT_SET",
        https_proxy: process.env.HTTPS_PROXY ? "CONFIGURED" : "NOT_SET",
      },
      outbound_ip: ipDetection,
      tbo_hotel_search: hotelSearchTest,
      summary: {
        proxy_configured:
          !!process.env.HTTP_PROXY || !!process.env.FIXIE_URL ? "YES" : "NO",
        outbound_ip_detected:
          ipDetection.via_ipify ||
          ipDetection.via_ifconfig ||
          ipDetection.via_icanhazip
            ? "YES"
            : "NO",
        tbo_search_success:
          hotelSearchTest.response?.Status?.Code === 1 ? "YES" : "NO",
        tbo_status_code: hotelSearchTest.response?.Status?.Code || null,
        tbo_status_description:
          hotelSearchTest.response?.Status?.Description || null,
      },
    };

    logger.info("✅ TBO Diagnostics completed", {
      proxyConfigured: diagnostics.summary.proxy_configured,
      outboundIpDetected: diagnostics.summary.outbound_ip_detected,
      tboSearchSuccess: diagnostics.summary.tbo_search_success,
      tboStatusCode: diagnostics.summary.tbo_status_code,
    });

    res.json(diagnostics);
  } catch (error) {
    logger.error("❌ TBO Diagnostics failed", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: "error",
      error: error.message,
      diagnostics_failed: true,
    });
  }
});

module.exports = router;
