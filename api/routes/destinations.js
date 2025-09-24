/**
 * Destinations API Routes
 * Handles regions, countries, cities hierarchy for packages
 * Provides both public and admin endpoints
 */

const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const csvParser = require("csv-parser");
const multer = require("multer");
const fs = require("fs");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Multer setup for CSV uploads
const upload = multer({ dest: 'uploads/' });

// Basic admin authentication middleware
const requireAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.query.admin_key;
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({
      success: false,
      error: "Admin authentication required"
    });
  }
  next();
};

/**
 * GET /api/destinations/hierarchy
 * Get complete destination hierarchy for menus
 */
router.get("/hierarchy", async (req, res) => {
  try {
    const query = `
      WITH RECURSIVE region_tree AS (
        -- Root regions (no parent)
        SELECT 
          id, name, parent_id, level, sort_order,
          slug, description, is_active,
          ARRAY[id] as path,
          0 as depth
        FROM regions 
        WHERE parent_id IS NULL AND is_active = TRUE
        
        UNION ALL
        
        -- Child regions
        SELECT 
          r.id, r.name, r.parent_id, r.level, r.sort_order,
          r.slug, r.description, r.is_active,
          rt.path || r.id,
          rt.depth + 1
        FROM regions r
        INNER JOIN region_tree rt ON r.parent_id = rt.id
        WHERE r.is_active = TRUE AND rt.depth < 5
      )
      SELECT 
        rt.*,
        (
          SELECT json_agg(
            json_build_object(
              'id', c.id,
              'name', c.name,
              'iso_code', c.iso_code,
              'currency', c.currency,
              'calling_code', c.calling_code,
              'cities', (
                SELECT json_agg(
                  json_build_object(
                    'id', ci.id,
                    'name', ci.name,
                    'code', ci.code,
                    'latitude', ci.latitude,
                    'longitude', ci.longitude
                  )
                  ORDER BY ci.name
                )
                FROM cities ci 
                WHERE ci.country_id = c.id AND ci.is_active = TRUE
              )
            )
            ORDER BY c.name
          )
          FROM countries c
          WHERE c.region_id = rt.id
        ) as countries
      FROM region_tree rt
      ORDER BY rt.level, rt.sort_order, rt.name
    `;

    const result = await pool.query(query);

    // Build hierarchical structure
    const hierarchy = {};
    const regions = result.rows;

    // Create a map for quick lookup
    const regionMap = {};
    regions.forEach(region => {
      regionMap[region.id] = {
        ...region,
        children: []
      };
    });

    // Build the tree structure
    const rootRegions = [];
    regions.forEach(region => {
      if (region.parent_id === null) {
        rootRegions.push(regionMap[region.id]);
      } else {
        const parent = regionMap[region.parent_id];
        if (parent) {
          parent.children.push(regionMap[region.id]);
        }
      }
    });

    res.json({
      success: true,
      data: rootRegions
    });

  } catch (error) {
    console.error('Error fetching destination hierarchy:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch destination hierarchy",
      message: error.message
    });
  }
});

/**
 * GET /api/destinations/regions
 * Get all regions with optional filtering and search
 */
router.get("/regions", async (req, res) => {
  try {
    const { parent_id, level, active_only = true, q } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (parent_id) {
      paramCount++;
      whereConditions.push(`parent_id = $${paramCount}`);
      queryParams.push(parent_id === 'null' ? null : parseInt(parent_id));
    }

    if (level) {
      paramCount++;
      whereConditions.push(`level = $${paramCount}`);
      queryParams.push(parseInt(level));
    }

    if (q) {
      paramCount++;
      whereConditions.push(`name ILIKE $${paramCount}`);
      queryParams.push(`%${q}%`);
    }

    if (active_only === 'true') {
      whereConditions.push('is_active = TRUE');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        r.*,
        pr.name as parent_name,
        (
          SELECT COUNT(*)
          FROM regions cr
          WHERE cr.parent_id = r.id AND cr.is_active = TRUE
        ) as children_count,
        (
          SELECT COUNT(*)
          FROM countries c
          WHERE c.region_id = r.id
        ) as countries_count
      FROM regions r
      LEFT JOIN regions pr ON r.parent_id = pr.id
      ${whereClause}
      ORDER BY r.level, r.sort_order, r.name
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        items: result.rows.map(row => ({
          id: row.id,
          name: row.name,
          level: row.level,
          parent_id: row.parent_id,
          sort_order: row.sort_order
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch regions",
      message: error.message
    });
  }
});

/**
 * GET /api/destinations/countries
 * Get countries with optional region filtering
 */
router.get("/countries", async (req, res) => {
  try {
    const { region_id, active_only = true } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (region_id) {
      paramCount++;
      whereConditions.push(`c.region_id = $${paramCount}`);
      queryParams.push(parseInt(region_id));
    }

    // Countries table doesn't have is_active column, skip this filter

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        c.*,
        r.name as region_name,
        (
          SELECT COUNT(*)
          FROM cities ci
          WHERE ci.country_id = c.id AND ci.is_active = TRUE
        ) as cities_count
      FROM countries c
      LEFT JOIN regions r ON c.region_id = r.id
      ${whereClause}
      ORDER BY c.name
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch countries",
      message: error.message
    });
  }
});

/**
 * GET /api/destinations/regions/:regionId/cities
 * Get cities for a specific region (as requested in user specs)
 */
router.get("/regions/:regionId/cities", async (req, res) => {
  try {
    const { regionId } = req.params;
    const { q, limit = 50 } = req.query;

    let whereConditions = ['ci.is_active = TRUE'];
    let queryParams = [regionId];
    let paramCount = 1;

    // Add search filter if provided
    if (q) {
      paramCount++;
      whereConditions.push(`ci.name ILIKE $${paramCount}`);
      queryParams.push(`%${q}%`);
    }

    // Include cities that belong to countries under this region OR cities directly attached to this region
    whereConditions.push(`(co.region_id = $1 OR ci.region_id = $1)`);

    const query = `
      SELECT
        ci.id, ci.name, ci.code,
        jsonb_build_object(
          'id', co.id,
          'name', co.name,
          'iso', co.iso_code
        ) as country
      FROM cities ci
      JOIN countries co ON co.id = ci.country_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ci.name
      LIMIT $${paramCount + 1}
    `;

    queryParams.push(parseInt(limit));

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      region_id: regionId,
      data: {
        items: result.rows
      }
    });

  } catch (error) {
    console.error('Error fetching cities for region:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cities for region",
      message: error.message
    });
  }
});

/**
 * GET /api/destinations/cities
 * Get cities with optional country/region filtering
 */
router.get("/cities", async (req, res) => {
  try {
    const { country_id, region_id, active_only = true, search } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (country_id) {
      paramCount++;
      whereConditions.push(`ci.country_id = $${paramCount}`);
      queryParams.push(parseInt(country_id));
    }

    if (region_id) {
      paramCount++;
      whereConditions.push(`ci.region_id = $${paramCount}`);
      queryParams.push(parseInt(region_id));
    }

    if (search) {
      paramCount++;
      whereConditions.push(`ci.name ILIKE $${paramCount}`);
      queryParams.push(`%${search}%`);
    }

    if (active_only === 'true') {
      whereConditions.push('ci.is_active = TRUE');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        ci.*,
        c.name as country_name,
        c.iso_code as country_code,
        r.name as region_name
      FROM cities ci
      LEFT JOIN countries c ON ci.country_id = c.id
      LEFT JOIN regions r ON ci.region_id = r.id
      ${whereClause}
      ORDER BY ci.name
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cities",
      message: error.message
    });
  }
});

// ====================
// ADMIN ROUTES
// ====================

/**
 * POST /admin/destinations/regions
 * Create a new region
 */
router.post("/admin/regions", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      parent_id,
      level,
      sort_order = 0,
      slug,
      description,
      is_active = true
    } = req.body;

    if (!name || !level) {
      return res.status(400).json({
        success: false,
        error: "name and level are required"
      });
    }

    const query = `
      INSERT INTO regions (name, parent_id, level, sort_order, slug, description, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      name,
      parent_id || null,
      level,
      sort_order,
      slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description,
      is_active
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Region created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating region:', error);
    
    if (error.code === '23505') {
      res.status(400).json({
        success: false,
        error: "Region with this name already exists"
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create region",
        message: error.message
      });
    }
  }
});

/**
 * POST /admin/destinations/countries
 * Create a new country
 */
router.post("/admin/countries", requireAdmin, async (req, res) => {
  try {
    const {
      iso_code,
      name,
      region_id,
      currency = 'USD',
      calling_code,
      is_active = true
    } = req.body;

    if (!iso_code || !name) {
      return res.status(400).json({
        success: false,
        error: "iso_code and name are required"
      });
    }

    const query = `
      INSERT INTO countries (iso_code, name, region_id, currency, calling_code)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      iso_code.toUpperCase(),
      name,
      region_id || null,
      currency,
      calling_code
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Country created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating country:', error);
    
    if (error.code === '23505') {
      res.status(400).json({
        success: false,
        error: "Country with this ISO code already exists"
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create country",
        message: error.message
      });
    }
  }
});

/**
 * POST /admin/destinations/cities
 * Create a new city
 */
router.post("/admin/cities", requireAdmin, async (req, res) => {
  try {
    const {
      country_id,
      region_id,
      name,
      code,
      latitude,
      longitude,
      timezone,
      is_active = true
    } = req.body;

    if (!country_id || !name) {
      return res.status(400).json({
        success: false,
        error: "country_id and name are required"
      });
    }

    const query = `
      INSERT INTO cities (country_id, region_id, name, code, latitude, longitude, timezone, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      country_id,
      region_id || null,
      name,
      code,
      latitude,
      longitude,
      timezone,
      is_active
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "City created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating city:', error);
    
    if (error.code === '23505') {
      res.status(400).json({
        success: false,
        error: "City with this name already exists in the selected country"
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to create city",
        message: error.message
      });
    }
  }
});

/**
 * POST /admin/destinations/upload
 * Bulk upload destinations from CSV
 */
router.post("/admin/upload", requireAdmin, upload.single('csv'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "CSV file is required"
      });
    }

    const results = [];
    const errors = [];
    let processedCount = 0;

    await client.query('BEGIN');

    // Parse CSV file
    const csvData = await new Promise((resolve, reject) => {
      const data = [];
      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (row) => data.push(row))
        .on('end', () => resolve(data))
        .on('error', reject);
    });

    console.log(`Processing ${csvData.length} rows from CSV`);

    for (const row of csvData) {
      try {
        processedCount++;
        
        // Expected CSV format: region_name, parent_region, level, country_name, iso_code, currency, city_name, city_code
        const {
          region_name,
          parent_region,
          level,
          country_name,
          iso_code,
          currency,
          city_name,
          city_code
        } = row;

        // Process region if provided
        if (region_name && level) {
          let parentId = null;
          if (parent_region) {
            const parentResult = await client.query(
              'SELECT id FROM regions WHERE name = $1',
              [parent_region]
            );
            if (parentResult.rows.length > 0) {
              parentId = parentResult.rows[0].id;
            }
          }

          await client.query(`
            INSERT INTO regions (name, parent_id, level, sort_order)
            VALUES ($1, $2, $3, 0)
            ON CONFLICT (name) DO NOTHING
          `, [region_name, parentId, parseInt(level)]);
        }

        // Process country if provided
        if (country_name && iso_code) {
          let regionId = null;
          if (region_name) {
            const regionResult = await client.query(
              'SELECT id FROM regions WHERE name = $1',
              [region_name]
            );
            if (regionResult.rows.length > 0) {
              regionId = regionResult.rows[0].id;
            }
          }

          await client.query(`
            INSERT INTO countries (iso_code, name, region_id, currency)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (iso_code) DO UPDATE SET
              name = EXCLUDED.name,
              region_id = EXCLUDED.region_id,
              currency = EXCLUDED.currency
          `, [iso_code.toUpperCase(), country_name, regionId, currency || 'USD']);
        }

        // Process city if provided
        if (city_name && iso_code) {
          const countryResult = await client.query(
            'SELECT id FROM countries WHERE iso_code = $1',
            [iso_code.toUpperCase()]
          );

          if (countryResult.rows.length > 0) {
            const countryId = countryResult.rows[0].id;
            
            let regionId = null;
            if (region_name) {
              const regionResult = await client.query(
                'SELECT id FROM regions WHERE name = $1',
                [region_name]
              );
              if (regionResult.rows.length > 0) {
                regionId = regionResult.rows[0].id;
              }
            }

            await client.query(`
              INSERT INTO cities (country_id, region_id, name, code)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (country_id, name) DO UPDATE SET
                region_id = EXCLUDED.region_id,
                code = EXCLUDED.code
            `, [countryId, regionId, city_name, city_code || null]);
          }
        }

        results.push({
          row: processedCount,
          status: 'success',
          data: row
        });

      } catch (error) {
        console.error(`Error processing row ${processedCount}:`, error);
        errors.push({
          row: processedCount,
          error: error.message,
          data: row
        });
      }
    }

    await client.query('COMMIT');

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: "CSV upload completed",
      data: {
        total_rows: csvData.length,
        processed_successfully: results.length,
        errors: errors.length,
        success_rate: `${Math.round((results.length / csvData.length) * 100)}%`,
        error_details: errors.slice(0, 10) // Show first 10 errors
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Error processing CSV upload:', error);
    res.status(500).json({
      success: false,
      error: "Failed to process CSV upload",
      message: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /admin/destinations/stats
 * Get destination statistics
 */
router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM regions WHERE is_active = TRUE) as active_regions,
        (SELECT COUNT(*) FROM countries) as active_countries,
        (SELECT COUNT(*) FROM cities WHERE is_active = TRUE) as active_cities,
        (SELECT COUNT(*) FROM packages WHERE region_id IS NOT NULL) as packages_with_regions,
        (SELECT COUNT(*) FROM packages WHERE country_id IS NOT NULL) as packages_with_countries,
        (SELECT COUNT(*) FROM packages WHERE city_id IS NOT NULL) as packages_with_cities
    `;

    const result = await pool.query(statsQuery);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching destination stats:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch destination statistics",
      message: error.message
    });
  }
});

module.exports = router;
