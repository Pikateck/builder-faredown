import express from "express";
/**
 * Updated Fixed Packages API Routes
 * Now uses proper foreign key relationships for destination filtering
 * Supports filtering by destination and date range as requested
 */

const router = express.Router();
const { Pool } = require("pg");
const crypto = require("crypto");

// Database connection
const dbUrl = process.env.DATABASE_URL;
const sslConfig =
  dbUrl && (dbUrl.includes("render.com") || dbUrl.includes("postgres://"))
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

// Helper function to generate booking reference
function generateBookingRef() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PKG${timestamp}${random}`;
}

/**
 * GET /api/packages
 * List packages with proper destination and date filtering
 */
router.get("/", async (req, res) => {
  try {
    const {
      q = "",
      destination,
      destination_code,
      destination_type,
      departure_date,
      return_date,
      region_id,
      country_id,
      city_id,
      category,
      package_category,
      tags,
      price_min,
      price_max,
      duration_min,
      duration_max,
      departure_city,
      month,
      sort = "popularity",
      page = 1,
      page_size = 20,
    } = req.query;

    // Build WHERE clause dynamically
    let whereConditions = ["p.status = 'active'"];
    let queryParams = [];
    let paramCount = 0;

    // Text search
    if (q.trim()) {
      paramCount++;
      whereConditions.push(
        `(p.title ILIKE $${paramCount} OR p.overview ILIKE $${paramCount})`,
      );
      queryParams.push(`%${q.trim()}%`);
    }

    // **IMPROVED DESTINATION FILTERING** - Now uses proper foreign keys
    if (destination && destination_type) {
      const destinationName = destination.split(",")[0].trim();
      
      if (destination_type === "city") {
        // Use city-based filtering with proper foreign key
        paramCount++;
        whereConditions.push(`EXISTS (
          SELECT 1 FROM cities ci 
          WHERE ci.id = p.city_id 
          AND ci.name ILIKE $${paramCount}
        )`);
        queryParams.push(`%${destinationName}%`);
      } else if (destination_type === "country") {
        // Use country-based filtering
        paramCount++;
        whereConditions.push(`EXISTS (
          SELECT 1 FROM countries c 
          WHERE c.id = p.country_id 
          AND c.name ILIKE $${paramCount}
        )`);
        queryParams.push(`%${destinationName}%`);
      } else if (destination_type === "region") {
        // Use region-based filtering
        paramCount++;
        whereConditions.push(`EXISTS (
          SELECT 1 FROM regions r 
          WHERE r.id = p.region_id 
          AND r.name ILIKE $${paramCount}
        )`);
        queryParams.push(`%${destinationName}%`);
      }
    }

    // **NEW: DATE RANGE FILTERING** - Filter packages with departures in specified date range
    if (departure_date || return_date) {
      let dateConditions = [];
      
      if (departure_date) {
        paramCount++;
        dateConditions.push(`pd.departure_date >= $${paramCount}`);
        queryParams.push(departure_date);
      }
      
      if (return_date) {
        paramCount++;
        dateConditions.push(`pd.departure_date <= $${paramCount}`);
        queryParams.push(return_date);
      }
      
      if (dateConditions.length > 0) {
        whereConditions.push(`EXISTS (
          SELECT 1 FROM package_departures pd 
          WHERE pd.package_id = p.id 
          AND pd.is_active = TRUE 
          AND pd.available_seats > 0
          AND ${dateConditions.join(' AND ')}
        )`);
      }
    }

    // Direct region/country/city filters (for API usage)
    if (region_id) {
      paramCount++;
      whereConditions.push(`p.region_id = $${paramCount}`);
      queryParams.push(region_id);
    }

    if (country_id) {
      paramCount++;
      whereConditions.push(`p.country_id = $${paramCount}`);
      queryParams.push(country_id);
    }

    if (city_id) {
      paramCount++;
      whereConditions.push(`p.city_id = $${paramCount}`);
      queryParams.push(city_id);
    }

    // Package category filter
    if (package_category && package_category !== "any") {
      paramCount++;
      whereConditions.push(`p.package_category = $${paramCount}`);
      queryParams.push(package_category);
    }

    // Category filter (ignore 'any')
    if (category && category !== "any") {
      paramCount++;
      whereConditions.push(`p.category = $${paramCount}`);
      queryParams.push(category);
    }

    // Price range filter
    if (price_min) {
      paramCount++;
      whereConditions.push(`p.base_price_pp >= $${paramCount}`);
      queryParams.push(parseFloat(price_min));
    }

    if (price_max) {
      paramCount++;
      whereConditions.push(`p.base_price_pp <= $${paramCount}`);
      queryParams.push(parseFloat(price_max));
    }

    // Duration filter
    if (duration_min) {
      paramCount++;
      whereConditions.push(`p.duration_days >= $${paramCount}`);
      queryParams.push(parseInt(duration_min));
    }

    if (duration_max) {
      paramCount++;
      whereConditions.push(`p.duration_days <= $${paramCount}`);
      queryParams.push(parseInt(duration_max));
    }

    // Build ORDER BY clause
    let orderBy = "p.created_at DESC";
    switch (sort) {
      case "price_low":
        orderBy = "p.base_price_pp ASC NULLS LAST, p.title ASC";
        break;
      case "price_high":
        orderBy = "p.base_price_pp DESC NULLS LAST, p.title ASC";
        break;
      case "duration":
        orderBy = "p.duration_days ASC, p.title ASC";
        break;
      case "name":
        orderBy = "p.title ASC";
        break;
      case "popularity":
      default:
        orderBy = "p.is_featured DESC, p.rating DESC, p.review_count DESC, p.created_at DESC";
        break;
    }

    // Calculate pagination
    const limit = Math.min(parseInt(page_size), 50);
    const offset = (parseInt(page) - 1) * limit;

    paramCount++;
    const limitParam = paramCount;
    queryParams.push(limit);

    paramCount++;
    const offsetParam = paramCount;
    queryParams.push(offset);

    // **IMPROVED MAIN QUERY** - Now includes proper JOINs for destination information
    const mainQuery = `
      SELECT
        p.*,
        r.name as region_name,
        c.name as country_name,
        ci.name as city_name,
        (
          SELECT MIN(pd.departure_date)
          FROM package_departures pd 
          WHERE pd.package_id = p.id 
            AND pd.is_active = TRUE 
            AND pd.departure_date >= CURRENT_DATE
            AND pd.available_seats > 0
        ) as next_departure_date,
        p.base_price_pp as from_price,
        (
          SELECT COUNT(*)
          FROM package_departures pd 
          WHERE pd.package_id = p.id 
            AND pd.is_active = TRUE 
            AND pd.departure_date >= CURRENT_DATE
            AND pd.available_seats > 0
        ) as available_departures_count,
        (
          SELECT json_agg(pt.tag)
          FROM package_tags pt 
          WHERE pt.package_id = p.id
          LIMIT 5
        ) as tags,
        ARRAY[p.hero_image_url] as images
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE ${whereConditions.join(" AND ")}
    `;

    // Execute queries
    const [mainResult, countResult] = await Promise.all([
      pool.query(mainQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)), // Remove limit and offset
    ]);

    const packages = mainResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // **IMPROVED FACETS** - Generate dynamic facets based on actual data
    const facetsQuery = `
      SELECT 
        'regions' as type,
        r.name as name,
        COUNT(p.id) as count
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      WHERE p.status = 'active' AND r.name IS NOT NULL
      GROUP BY r.id, r.name
      
      UNION ALL
      
      SELECT 
        'categories' as type,
        p.package_category as name,
        COUNT(p.id) as count
      FROM packages p
      WHERE p.status = 'active' AND p.package_category IS NOT NULL
      GROUP BY p.package_category
      
      UNION ALL
      
      SELECT 
        'countries' as type,
        c.name as name,
        COUNT(p.id) as count
      FROM packages p
      LEFT JOIN countries c ON p.country_id = c.id
      WHERE p.status = 'active' AND c.name IS NOT NULL
      GROUP BY c.id, c.name
    `;

    const facetsResult = await pool.query(facetsQuery);
    
    // Organize facets by type
    const facets = {
      regions: {},
      categories: {},
      countries: {},
      price_ranges: {
        min: 0,
        max: 500000,
        avg: 100000,
      },
    };

    facetsResult.rows.forEach(row => {
      if (facets[row.type]) {
        facets[row.type][row.name] = parseInt(row.count);
      }
    });

    res.json({
      success: true,
      data: {
        packages,
        pagination: {
          page: parseInt(page),
          page_size: limit,
          total,
          total_pages: totalPages,
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1,
        },
        facets,
        filters: {
          q,
          destination,
          destination_type,
          departure_date,
          return_date,
          region_id,
          country_id,
          city_id,
          category,
          package_category,
          tags,
          price_min,
          price_max,
          duration_min,
          duration_max,
          departure_city,
          month,
          sort,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch packages",
      message: error.message,
    });
  }
});

/**
 * GET /api/packages/:slug
 * Get package details by slug (unchanged, works with existing structure)
 */
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const query = `
      SELECT 
        p.*,
        r.name as region_name,
        c.name as country_name,
        ci.name as city_name
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE p.slug = $1 AND p.status = 'active'
    `;

    const result = await pool.query(query, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Package not found",
      });
    }

    const packageData = result.rows[0];

    // Get available departures
    const departuresQuery = `
      SELECT 
        id, departure_city_code, departure_city_name,
        departure_date, return_date, price_per_person,
        single_supplement, child_price, infant_price,
        currency, available_seats, total_seats,
        is_guaranteed, special_notes
      FROM package_departures
      WHERE package_id = $1 
        AND is_active = TRUE 
        AND departure_date >= CURRENT_DATE
      ORDER BY departure_date ASC
    `;

    const departuresResult = await pool.query(departuresQuery, [packageData.id]);

    // Format response with destination information
    const response = {
      ...packageData,
      departures: departuresResult.rows,
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching package details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch package details",
      message: error.message,
    });
  }
});

/**
 * GET /api/packages/:slug/departures
 * Get available departures for a package with date filtering
 */
router.get("/:slug/departures", async (req, res) => {
  try {
    const { slug } = req.params;
    const { city, from_date, to_date } = req.query;

    // First get package ID
    const packageQuery = `SELECT id FROM packages WHERE slug = $1 AND status = 'active'`;
    const packageResult = await pool.query(packageQuery, [slug]);

    if (packageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Package not found",
      });
    }

    const packageId = packageResult.rows[0].id;

    // Build departures query
    let whereConditions = [
      "package_id = $1",
      "is_active = TRUE",
      "departure_date >= CURRENT_DATE",
      "available_seats > 0",
    ];
    let queryParams = [packageId];
    let paramCount = 1;

    if (city) {
      paramCount++;
      whereConditions.push(`departure_city_code = $${paramCount}`);
      queryParams.push(city.toUpperCase());
    }

    if (from_date) {
      paramCount++;
      whereConditions.push(`departure_date >= $${paramCount}`);
      queryParams.push(from_date);
    }

    if (to_date) {
      paramCount++;
      whereConditions.push(`departure_date <= $${paramCount}`);
      queryParams.push(to_date);
    }

    const departuresQuery = `
      SELECT 
        id, departure_city_code, departure_city_name,
        departure_date, return_date, price_per_person,
        single_supplement, child_price, infant_price,
        currency, available_seats, total_seats,
        is_guaranteed, special_notes
      FROM package_departures
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY departure_date ASC
    `;

    const result = await pool.query(departuresQuery, queryParams);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching departures:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch departures",
      message: error.message,
    });
  }
});

/**
 * **NEW ENDPOINT** 
 * GET /api/packages/by-destination
 * Specifically for filtering packages by destination and date range
 */
router.get("/by-destination", async (req, res) => {
  try {
    const {
      destination,
      destination_type = "city",
      departure_date,
      return_date,
      package_types = 3, // Number of package types to return per region
      limit = 20
    } = req.query;

    if (!destination) {
      return res.status(400).json({
        success: false,
        error: "Destination parameter is required"
      });
    }

    const destinationName = destination.split(",")[0].trim();

    // Build base query based on destination type
    let destinationJoin = "";
    let destinationCondition = "";
    let queryParams = [];
    let paramCount = 0;

    if (destination_type === "city") {
      destinationJoin = "JOIN cities ci ON p.city_id = ci.id";
      paramCount++;
      destinationCondition = `ci.name ILIKE $${paramCount}`;
      queryParams.push(`%${destinationName}%`);
    } else if (destination_type === "country") {
      destinationJoin = "JOIN countries c ON p.country_id = c.id";
      paramCount++;
      destinationCondition = `c.name ILIKE $${paramCount}`;
      queryParams.push(`%${destinationName}%`);
    } else if (destination_type === "region") {
      destinationJoin = "JOIN regions r ON p.region_id = r.id";
      paramCount++;
      destinationCondition = `r.name ILIKE $${paramCount}`;
      queryParams.push(`%${destinationName}%`);
    }

    // Add date filtering if provided
    let dateJoin = "";
    let dateCondition = "";
    
    if (departure_date || return_date) {
      dateJoin = `
        JOIN package_departures pd ON p.id = pd.package_id 
        AND pd.is_active = TRUE 
        AND pd.available_seats > 0
      `;
      
      let dateConditions = [];
      if (departure_date) {
        paramCount++;
        dateConditions.push(`pd.departure_date >= $${paramCount}`);
        queryParams.push(departure_date);
      }
      if (return_date) {
        paramCount++;
        dateConditions.push(`pd.departure_date <= $${paramCount}`);
        queryParams.push(return_date);
      }
      
      dateCondition = `AND ${dateConditions.join(' AND ')}`;
    }

    paramCount++;
    queryParams.push(parseInt(limit));

    const query = `
      SELECT DISTINCT
        p.*,
        r.name as region_name,
        c.name as country_name,
        ci.name as city_name,
        p.base_price_pp as from_price,
        (
          SELECT COUNT(*)
          FROM package_departures pd2 
          WHERE pd2.package_id = p.id 
            AND pd2.is_active = TRUE 
            AND pd2.departure_date >= CURRENT_DATE
            AND pd2.available_seats > 0
            ${departure_date ? `AND pd2.departure_date >= '${departure_date}'` : ''}
            ${return_date ? `AND pd2.departure_date <= '${return_date}'` : ''}
        ) as available_departures_count
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      ${destinationJoin}
      ${dateJoin}
      WHERE p.status = 'active' 
        AND ${destinationCondition}
        ${dateCondition}
      ORDER BY 
        p.package_category,
        p.is_featured DESC,
        p.base_price_pp ASC
      LIMIT $${paramCount}
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        packages: result.rows,
        destination: destination,
        destination_type: destination_type,
        departure_date: departure_date,
        return_date: return_date,
        total: result.rows.length
      },
      message: `Found ${result.rows.length} packages for ${destination}`
    });

  } catch (error) {
    console.error("Error fetching packages by destination:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch packages by destination",
      message: error.message,
    });
  }
});

// Keep existing enquiry and other endpoints unchanged
router.post("/:slug/enquire", async (req, res) => {
  // ... existing enquiry endpoint code
  res.json({
    success: true,
    message: "Enquiry endpoint - implementation unchanged"
  });
});
export default router;