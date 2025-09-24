/**
 * Admin Packages API Routes
 * Handles all admin operations for packages - CRUD, bulk operations, reporting
 * Requires admin authentication
 */

const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const multer = require("multer");
const path = require("path");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Basic admin authentication middleware (replace with your auth system)
const requireAdmin = (req, res, next) => {
  // For now, simple check - replace with your actual admin auth
  const adminKey = req.headers['x-admin-key'] || req.query.admin_key;
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({
      success: false,
      error: "Admin authentication required"
    });
  }
  next();
};

// Apply admin auth to all routes
router.use(requireAdmin);

// Helper function to generate slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * GET /admin/packages
 * List all packages with admin details
 */
router.get("/", async (req, res) => {
  try {
    const {
      status,
      region_id,
      country_id,
      category,
      search,
      sort = "created_at",
      order = "desc",
      page = 1,
      page_size = 20
    } = req.query;

    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereConditions.push(`p.status = $${paramCount}`);
      queryParams.push(status);
    }

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

    if (category) {
      paramCount++;
      whereConditions.push(`p.category = $${paramCount}`);
      queryParams.push(category);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(p.title ILIKE $${paramCount} OR p.overview ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort field
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'status', 'base_price_pp', 'duration_days'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Calculate pagination
    const limit = Math.min(parseInt(page_size), 100);
    const offset = (parseInt(page) - 1) * limit;

    paramCount++;
    const limitParam = paramCount;
    queryParams.push(limit);

    paramCount++;
    const offsetParam = paramCount;
    queryParams.push(offset);

    // Main query
    const query = `
      SELECT 
        p.*,
        r.name as region_name,
        c.name as country_name,
        ci.name as city_name,
        (
          SELECT COUNT(*) 
          FROM package_departures pd 
          WHERE pd.package_id = p.id AND pd.is_active = TRUE
        ) as total_departures,
        (
          SELECT COUNT(*) 
          FROM package_departures pd 
          WHERE pd.package_id = p.id 
            AND pd.is_active = TRUE 
            AND pd.departure_date >= CURRENT_DATE
        ) as upcoming_departures,
        (
          SELECT COUNT(*) 
          FROM package_bookings pb 
          WHERE pb.package_id = p.id
        ) as total_bookings,
        (
          SELECT COALESCE(SUM(pb.final_amount), 0)
          FROM package_bookings pb 
          WHERE pb.package_id = p.id 
            AND pb.booking_status = 'confirmed'
        ) as total_revenue
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      ${whereClause}
      ORDER BY p.${sortField} ${sortOrder}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM packages p
      ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    const packages = result.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

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
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin packages:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch packages",
      message: error.message
    });
  }
});

/**
 * POST /admin/packages
 * Create a new package
 */
router.post("/", async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      title,
      region_id,
      country_id,
      city_id,
      duration_days,
      duration_nights,
      overview,
      description,
      base_price_pp,
      currency = 'INR',
      category,
      package_type = 'fixed',
      themes = [],
      inclusions = [],
      exclusions = [],
      highlights = [],
      terms_conditions,
      cancellation_policy,
      hero_image_url,
      gallery_images = [],
      video_url,
      seo_meta_title,
      seo_meta_description,
      is_featured = false,
      visa_required = false,
      passport_required = true,
      minimum_age = 0,
      maximum_group_size = 50,
      status = 'draft'
    } = req.body;

    // Validate required fields
    if (!title || !duration_days || !duration_nights || !base_price_pp) {
      return res.status(400).json({
        success: false,
        error: "Title, duration_days, duration_nights, and base_price_pp are required"
      });
    }

    // Generate slug
    const slug = generateSlug(title);

    // Check if slug already exists
    const slugCheck = await client.query('SELECT id FROM packages WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "A package with this title already exists"
      });
    }

    // Insert package
    const packageQuery = `
      INSERT INTO packages (
        slug, title, region_id, country_id, city_id,
        duration_days, duration_nights, overview, description,
        base_price_pp, currency, category, package_type, themes,
        inclusions, exclusions, highlights, terms_conditions,
        cancellation_policy, hero_image_url, gallery_images, video_url,
        seo_meta_title, seo_meta_description, is_featured,
        visa_required, passport_required, minimum_age, maximum_group_size,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
        $27, $28, $29, $30, $31
      )
      RETURNING *
    `;

    const packageValues = [
      slug, title, region_id || null, country_id || null, city_id || null,
      duration_days, duration_nights, overview, description,
      base_price_pp, currency, category, package_type, JSON.stringify(themes),
      JSON.stringify(inclusions), JSON.stringify(exclusions), JSON.stringify(highlights),
      terms_conditions, cancellation_policy, hero_image_url, JSON.stringify(gallery_images),
      video_url, seo_meta_title, seo_meta_description, is_featured,
      visa_required, passport_required, minimum_age, maximum_group_size, status
    ];

    const packageResult = await client.query(packageQuery, packageValues);
    const newPackage = packageResult.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: newPackage
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating package:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({
        success: false,
        error: "Package with this slug already exists"
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create package",
        message: error.message
      });
    }
  } finally {
    client.release();
  }
});

/**
 * GET /admin/packages/:id
 * Get package details for editing
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.*,
        r.name as region_name,
        c.name as country_name,
        ci.name as city_name,
        (
          SELECT json_agg(
            json_build_object(
              'day_number', pid.day_number,
              'title', pid.title,
              'description', pid.description,
              'cities', pid.cities,
              'meals_included', pid.meals_included,
              'accommodation', pid.accommodation,
              'activities', pid.activities,
              'transport', pid.transport
            )
            ORDER BY pid.day_number
          )
          FROM package_itinerary_days pid 
          WHERE pid.package_id = p.id
        ) as itinerary,
        (
          SELECT json_agg(
            json_build_object(
              'id', pd.id,
              'departure_city_code', pd.departure_city_code,
              'departure_city_name', pd.departure_city_name,
              'departure_date', pd.departure_date,
              'return_date', pd.return_date,
              'price_per_person', pd.price_per_person,
              'total_seats', pd.total_seats,
              'booked_seats', pd.booked_seats,
              'is_active', pd.is_active,
              'is_guaranteed', pd.is_guaranteed
            )
            ORDER BY pd.departure_date
          )
          FROM package_departures pd 
          WHERE pd.package_id = p.id
        ) as departures,
        (
          SELECT json_agg(pt.tag)
          FROM package_tags pt 
          WHERE pt.package_id = p.id
        ) as tags
      FROM packages p
      LEFT JOIN regions r ON p.region_id = r.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN cities ci ON p.city_id = ci.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Package not found"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
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
 * PUT /admin/packages/:id
 * Update package
 */
router.put("/:id", async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const updateData = req.body;

    // Check if package exists
    const existingPackage = await client.query('SELECT * FROM packages WHERE id = $1', [parseInt(id)]);
    if (existingPackage.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Package not found"
      });
    }

    // Build dynamic update query
    const allowedFields = [
      'title', 'region_id', 'country_id', 'city_id', 'duration_days', 'duration_nights',
      'overview', 'description', 'base_price_pp', 'currency', 'category', 'package_type',
      'themes', 'inclusions', 'exclusions', 'highlights', 'terms_conditions',
      'cancellation_policy', 'hero_image_url', 'gallery_images', 'video_url',
      'seo_meta_title', 'seo_meta_description', 'is_featured', 'visa_required',
      'passport_required', 'minimum_age', 'maximum_group_size', 'status'
    ];

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    Object.keys(updateData).forEach(field => {
      if (allowedFields.includes(field) && updateData[field] !== undefined) {
        paramCount++;
        updateFields.push(`${field} = $${paramCount}`);
        
        // Handle JSON fields
        if (['themes', 'inclusions', 'exclusions', 'highlights', 'gallery_images'].includes(field)) {
          updateValues.push(JSON.stringify(updateData[field]));
        } else {
          updateValues.push(updateData[field]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid fields to update"
      });
    }

    // Update slug if title changed
    if (updateData.title && updateData.title !== existingPackage.rows[0].title) {
      const newSlug = generateSlug(updateData.title);
      paramCount++;
      updateFields.push(`slug = $${paramCount}`);
      updateValues.push(newSlug);
    }

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    // Add ID parameter
    paramCount++;
    updateValues.push(parseInt(id));

    const updateQuery = `
      UPDATE packages 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(updateQuery, updateValues);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Package updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating package:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update package",
      message: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * DELETE /admin/packages/:id
 * Archive package (soft delete)
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE packages 
      SET status = 'archived', updated_at = NOW()
      WHERE id = $1
      RETURNING id, title, status
    `;

    const result = await pool.query(query, [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Package not found"
      });
    }

    res.json({
      success: true,
      message: "Package archived successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error archiving package:', error);
    res.status(500).json({
      success: false,
      error: "Failed to archive package",
      message: error.message
    });
  }
});

/**
 * POST /admin/packages/:id/departures
 * Add departure to package
 */
router.post("/:id/departures", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      departure_city_code,
      departure_city_name,
      departure_date,
      return_date,
      total_seats,
      price_per_person,
      single_supplement = 0,
      child_price,
      infant_price = 0,
      currency = 'INR',
      is_guaranteed = false,
      early_bird_discount = 0,
      early_bird_deadline,
      special_notes
    } = req.body;

    // Validate required fields
    if (!departure_city_code || !departure_city_name || !departure_date || !total_seats || !price_per_person) {
      return res.status(400).json({
        success: false,
        error: "Required fields: departure_city_code, departure_city_name, departure_date, total_seats, price_per_person"
      });
    }

    const query = `
      INSERT INTO package_departures (
        package_id, departure_city_code, departure_city_name,
        departure_date, return_date, total_seats, price_per_person,
        single_supplement, child_price, infant_price, currency,
        is_guaranteed, early_bird_discount, early_bird_deadline,
        special_notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING *
    `;

    const values = [
      parseInt(id), departure_city_code, departure_city_name,
      departure_date, return_date, total_seats, price_per_person,
      single_supplement, child_price, infant_price, currency,
      is_guaranteed, early_bird_discount, early_bird_deadline,
      special_notes
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Departure added successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error adding departure:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({
        success: false,
        error: "Departure for this city and date already exists"
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to add departure",
        message: error.message
      });
    }
  }
});

/**
 * POST /admin/packages/:id/itinerary
 * Add or update itinerary day
 */
router.post("/:id/itinerary", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      day_number,
      title,
      description,
      cities,
      meals_included,
      accommodation,
      activities = [],
      transport
    } = req.body;

    // Validate required fields
    if (!day_number || !title) {
      return res.status(400).json({
        success: false,
        error: "day_number and title are required"
      });
    }

    const query = `
      INSERT INTO package_itinerary_days (
        package_id, day_number, title, description, cities,
        meals_included, accommodation, activities, transport
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      ON CONFLICT (package_id, day_number)
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        cities = EXCLUDED.cities,
        meals_included = EXCLUDED.meals_included,
        accommodation = EXCLUDED.accommodation,
        activities = EXCLUDED.activities,
        transport = EXCLUDED.transport,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      parseInt(id), day_number, title, description, cities,
      meals_included, accommodation, JSON.stringify(activities), transport
    ];

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: "Itinerary day saved successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error saving itinerary day:', error);
    res.status(500).json({
      success: false,
      error: "Failed to save itinerary day",
      message: error.message
    });
  }
});

/**
 * GET /admin/packages/stats
 * Get packages statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_packages,
        COUNT(*) FILTER (WHERE status = 'active') as active_packages,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_packages,
        COUNT(*) FILTER (WHERE status = 'archived') as archived_packages,
        COUNT(*) FILTER (WHERE is_featured = true) as featured_packages,
        ROUND(AVG(base_price_pp), 0) as avg_price,
        MIN(base_price_pp) as min_price,
        MAX(base_price_pp) as max_price
      FROM packages
    `;

    const departureStatsQuery = `
      SELECT 
        COUNT(*) as total_departures,
        COUNT(*) FILTER (WHERE departure_date >= CURRENT_DATE) as upcoming_departures,
        COUNT(*) FILTER (WHERE is_guaranteed = true) as guaranteed_departures,
        SUM(total_seats) as total_seats,
        SUM(booked_seats) as booked_seats
      FROM package_departures pd
      JOIN packages p ON p.id = pd.package_id
      WHERE p.status = 'active' AND pd.is_active = true
    `;

    const bookingStatsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'confirmed') as confirmed_bookings,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        ROUND(AVG(final_amount), 0) as avg_booking_value
      FROM package_bookings
    `;

    const [packageStats, departureStats, bookingStats] = await Promise.all([
      pool.query(statsQuery),
      pool.query(departureStatsQuery),
      pool.query(bookingStatsQuery)
    ]);

    res.json({
      success: true,
      data: {
        packages: packageStats.rows[0],
        departures: departureStats.rows[0],
        bookings: bookingStats.rows[0]
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
      message: error.message
    });
  }
});

module.exports = router;
