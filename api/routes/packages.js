/**
 * Fixed Packages API Routes
 * Handles all public package operations - listing, details, departures, bookings
 * Integrates with existing bargain system and follows established patterns
 */

const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const crypto = require("crypto");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Helper function to generate booking reference
function generateBookingRef() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PKG${timestamp}${random}`;
}

// Helper function for SQL parameter placeholders
function createPlaceholders(start, count) {
  return Array.from({ length: count }, (_, i) => `$${start + i}`).join(', ');
}

/**
 * GET /api/packages
 * List packages with filters and pagination
 */
router.get("/", async (req, res) => {
  try {
    const {
      q = "",
      destination,
      destination_code,
      destination_type,
      region_id,
      country_id,
      city_id,
      category,
      tags,
      price_min,
      price_max,
      duration_min,
      duration_max,
      departure_city,
      month,
      sort = "popularity",
      page = 1,
      page_size = 20
    } = req.query;

    // Debug logging for destination filtering
    if (destination || destination_code || destination_type) {
      console.log('🔍 Packages API - Destination filtering:', {
        destination,
        destination_code,
        destination_type
      });
    }

    // Build WHERE clause dynamically
    let whereConditions = ["p.status = 'active'"];
    let queryParams = [];
    let paramCount = 0;

    // Text search
    if (q.trim()) {
      paramCount++;
      whereConditions.push(`(p.title ILIKE $${paramCount} OR p.overview ILIKE $${paramCount})`);
      queryParams.push(`%${q.trim()}%`);
    }

    // Destination filter (from search form)
    if (destination && destination_type) {
      if (destination_type === 'city') {
        // For city destinations, filter by region/country/city name
        paramCount++;
        whereConditions.push(`(
          LOWER(r.name) LIKE LOWER($${paramCount}) OR
          LOWER(c.name) LIKE LOWER($${paramCount}) OR
          LOWER(ci.name) LIKE LOWER($${paramCount}) OR
          LOWER(p.title) LIKE LOWER($${paramCount})
        )`);
        const destinationName = destination.split(',')[0].trim(); // Extract city name from "Dubai, United Arab Emirates"
        queryParams.push(`%${destinationName}%`);
      } else if (destination_type === 'country') {
        paramCount++;
        whereConditions.push(`LOWER(c.name) LIKE LOWER($${paramCount})`);
        queryParams.push(`%${destination}%`);
      } else if (destination_type === 'region') {
        paramCount++;
        whereConditions.push(`LOWER(r.name) LIKE LOWER($${paramCount})`);
        queryParams.push(`%${destination}%`);
      }
    }

    // Region/Country/City filters (for direct filtering)
    if (region_id) {
      paramCount++;
      whereConditions.push(`p.region_id = $${paramCount}`);
      queryParams.push(parseInt(region_id));
    }

    if (country_id) {
      paramCount++;
      whereConditions.push(`p.country_id = $${paramCount}`);
      queryParams.push(parseInt(country_id));
    }

    if (city_id) {
      paramCount++;
      whereConditions.push(`p.city_id = $${paramCount}`);
      queryParams.push(parseInt(city_id));
    }

    // Category filter
    if (category) {
      paramCount++;
      whereConditions.push(`p.category = $${paramCount}`);
      queryParams.push(category);
    }

    // Tags filter
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim());
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM package_tags pt 
        WHERE pt.package_id = p.id 
        AND pt.tag = ANY($${paramCount})
      )`);
      queryParams.push(tagList);
    }

    // Price range filter (based on from_price)
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

    // Departure city filter
    if (departure_city) {
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM package_departures pd 
        WHERE pd.package_id = p.id 
        AND pd.departure_city_code = $${paramCount}
        AND pd.is_active = TRUE 
        AND pd.departure_date >= CURRENT_DATE
        AND pd.available_seats > 0
      )`);
      queryParams.push(departure_city.toUpperCase());
    }

    // Month filter
    if (month) {
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM package_departures pd 
        WHERE pd.package_id = p.id 
        AND DATE_TRUNC('month', pd.departure_date) = $${paramCount}::date
        AND pd.is_active = TRUE 
        AND pd.departure_date >= CURRENT_DATE
        AND pd.available_seats > 0
      )`);
      queryParams.push(`${month}-01`);
    }

    // Build ORDER BY clause
    let orderBy = "p.created_at DESC";
    switch (sort) {
      case "price_low":
        orderBy = "from_price ASC NULLS LAST, p.title ASC";
        break;
      case "price_high":
        orderBy = "from_price DESC NULLS LAST, p.title ASC";
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
    const limit = Math.min(parseInt(page_size), 50); // Max 50 items per page
    const offset = (parseInt(page) - 1) * limit;

    // Add pagination parameters
    paramCount++;
    const limitParam = paramCount;
    queryParams.push(limit);

    paramCount++;
    const offsetParam = paramCount;
    queryParams.push(offset);

    // Main query using the listing view
    const mainQuery = `
      SELECT 
        p.*,
        r.name as region_name,
        c.name as country_name,
        ci.name as city_name,
        next_departure_date,
        from_price,
        available_departures_count,
        (
          SELECT json_agg(pt.tag)
          FROM package_tags pt 
          WHERE pt.package_id = p.id
        ) as tags,
        (
          SELECT json_agg(
            json_build_object(
              'url', pm.url,
              'type', pm.type,
              'alt_text', pm.alt_text
            )
            ORDER BY pm.sort_order
          )
          FROM package_media pm 
          WHERE pm.package_id = p.id AND pm.type = 'image'
          LIMIT 3
        ) as images
      FROM v_packages_listing p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM v_packages_listing p
      WHERE ${whereConditions.join(' AND ')}
    `;

    // Execute queries
    const [mainResult, countResult] = await Promise.all([
      pool.query(mainQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset
    ]);

    const packages = mainResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Get facets for filtering
    const facetsQuery = `
      SELECT 
        json_build_object(
          'regions', (
            SELECT json_object_agg(r.name, region_counts.count)
            FROM (
              SELECT p.region_id, COUNT(*) as count
              FROM v_packages_listing p
              GROUP BY p.region_id
              HAVING COUNT(*) > 0
            ) region_counts
            JOIN regions r ON r.id = region_counts.region_id
          ),
          'categories', (
            SELECT json_object_agg(p.category, COUNT(*))
            FROM v_packages_listing p
            WHERE p.category IS NOT NULL
            GROUP BY p.category
            HAVING COUNT(*) > 0
          ),
          'tags', (
            SELECT json_object_agg(pt.tag, COUNT(*))
            FROM package_tags pt
            JOIN v_packages_listing p ON p.id = pt.package_id
            GROUP BY pt.tag
            HAVING COUNT(*) > 2
            ORDER BY COUNT(*) DESC
            LIMIT 20
          ),
          'price_ranges', (
            SELECT json_build_object(
              'min', MIN(p.base_price_pp),
              'max', MAX(p.base_price_pp),
              'avg', ROUND(AVG(p.base_price_pp), 0)
            )
            FROM v_packages_listing p
          )
        ) as facets
    `;

    const facetsResult = await pool.query(facetsQuery);
    const facets = facetsResult.rows[0].facets || {};

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
          has_prev: parseInt(page) > 1
        },
        facets,
        filters: {
          q, region_id, country_id, city_id, category, tags,
          price_min, price_max, duration_min, duration_max,
          departure_city, month, sort
        }
      }
    });

  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch packages",
      message: error.message
    });
  }
});

/**
 * GET /api/packages/:slug
 * Get package details by slug
 */
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const query = `
      SELECT * FROM v_package_details
      WHERE slug = $1 AND status = 'active'
    `;

    const result = await pool.query(query, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Package not found"
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
        is_guaranteed, early_bird_discount, early_bird_deadline,
        special_notes
      FROM package_departures
      WHERE package_id = $1 
        AND is_active = TRUE 
        AND departure_date >= CURRENT_DATE
      ORDER BY departure_date ASC
    `;

    const departuresResult = await pool.query(departuresQuery, [packageData.id]);

    // Get reviews summary
    const reviewsQuery = `
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 2) as average_rating,
        COUNT(*) FILTER (WHERE rating = 5) as five_star,
        COUNT(*) FILTER (WHERE rating = 4) as four_star,
        COUNT(*) FILTER (WHERE rating = 3) as three_star,
        COUNT(*) FILTER (WHERE rating = 2) as two_star,
        COUNT(*) FILTER (WHERE rating = 1) as one_star
      FROM package_reviews
      WHERE package_id = $1 AND is_approved = TRUE
    `;

    const reviewsResult = await pool.query(reviewsQuery, [packageData.id]);

    // Get recent reviews
    const recentReviewsQuery = `
      SELECT 
        rating, title, review_text, reviewer_name,
        reviewer_location, travel_date, traveler_type,
        value_for_money, itinerary_rating, accommodation_rating,
        created_at
      FROM package_reviews
      WHERE package_id = $1 AND is_approved = TRUE
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const recentReviewsResult = await pool.query(recentReviewsQuery, [packageData.id]);

    // Format response
    const response = {
      ...packageData,
      departures: departuresResult.rows,
      reviews_summary: reviewsResult.rows[0],
      recent_reviews: recentReviewsResult.rows
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching package details:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch package details",
      message: error.message
    });
  }
});

/**
 * GET /api/packages/:slug/departures
 * Get available departures for a package
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
        error: "Package not found"
      });
    }

    const packageId = packageResult.rows[0].id;

    // Build departures query
    let whereConditions = [
      "package_id = $1",
      "is_active = TRUE",
      "departure_date >= CURRENT_DATE",
      "available_seats > 0"
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
        is_guaranteed, early_bird_discount, early_bird_deadline,
        special_notes
      FROM package_departures
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY departure_date ASC
    `;

    const result = await pool.query(departuresQuery, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching departures:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch departures",
      message: error.message
    });
  }
});

/**
 * POST /api/packages/:slug/enquire
 * Submit enquiry for a package
 */
router.post("/:slug/enquire", async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, email, phone, departure_id, message, adults, children } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and phone are required"
      });
    }

    // Get package details
    const packageQuery = `
      SELECT id, title FROM packages 
      WHERE slug = $1 AND status = 'active'
    `;
    const packageResult = await pool.query(packageQuery, [slug]);

    if (packageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Package not found"
      });
    }

    const packageData = packageResult.rows[0];

    // Get departure details if provided
    let departureData = null;
    if (departure_id) {
      const departureQuery = `
        SELECT departure_city_name, departure_date, price_per_person
        FROM package_departures 
        WHERE id = $1 AND package_id = $2
      `;
      const departureResult = await pool.query(departureQuery, [departure_id, packageData.id]);
      if (departureResult.rows.length > 0) {
        departureData = departureResult.rows[0];
      }
    }

    // Store enquiry (you might want to create an enquiries table)
    const enquiryData = {
      package_id: packageData.id,
      package_title: packageData.title,
      departure_id,
      departure_details: departureData,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      adults_count: adults || 1,
      children_count: children || 0,
      message: message || '',
      created_at: new Date()
    };

    // For now, just log the enquiry (implement your preferred storage/notification method)
    console.log('Package Enquiry Received:', enquiryData);

    // Here you would typically:
    // 1. Store in database
    // 2. Send email notification to sales team
    // 3. Send confirmation email to customer
    // 4. Add to CRM system

    res.json({
      success: true,
      message: "Thank you for your enquiry. Our team will contact you shortly.",
      data: {
        package_title: packageData.title,
        enquiry_ref: `ENQ${Date.now()}`
      }
    });

  } catch (error) {
    console.error('Error submitting enquiry:', error);
    res.status(500).json({
      success: false,
      error: "Failed to submit enquiry",
      message: error.message
    });
  }
});

/**
 * GET /api/destinations
 * Get hierarchical destination structure for menus
 */
router.get("/destinations", async (req, res) => {
  try {
    const query = `
      SELECT tree FROM v_destination_hierarchy
      LIMIT 1
    `;

    const result = await pool.query(query);
    
    const destinations = result.rows[0]?.tree || [];

    res.json({
      success: true,
      data: destinations
    });

  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch destinations",
      message: error.message
    });
  }
});

/**
 * GET /api/packages/featured
 * Get featured packages for homepage
 */
router.get("/featured", async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const query = `
      SELECT 
        p.*,
        r.name as region_name,
        c.name as country_name,
        next_departure_date,
        from_price,
        (
          SELECT json_agg(pt.tag)
          FROM package_tags pt 
          WHERE pt.package_id = p.id
          LIMIT 5
        ) as tags,
        (
          SELECT url
          FROM package_media pm 
          WHERE pm.package_id = p.id AND pm.type = 'image'
          ORDER BY pm.sort_order
          LIMIT 1
        ) as featured_image
      FROM v_packages_listing p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      WHERE p.is_featured = TRUE
      ORDER BY p.rating DESC, p.review_count DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [parseInt(limit)]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching featured packages:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch featured packages",
      message: error.message
    });
  }
});

module.exports = router;
