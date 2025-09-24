const { Pool } = require("pg");

async function checkCities() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Check cities for Europe region (id=2)
    console.log("Checking cities for Europe region (id=2)...");

    const directCities = await pool.query(`
      SELECT COUNT(*) FROM cities WHERE region_id = 2
    `);
    console.log(
      "Cities directly in Europe region:",
      directCities.rows[0].count,
    );

    const countriesInEurope = await pool.query(`
      SELECT COUNT(*) FROM countries WHERE region_id = 2
    `);
    console.log("Countries in Europe region:", countriesInEurope.rows[0].count);

    if (parseInt(countriesInEurope.rows[0].count) > 0) {
      const citiesViaCountries = await pool.query(`
        SELECT COUNT(*) FROM cities ci
        JOIN countries co ON co.id = ci.country_id
        WHERE co.region_id = 2
      `);
      console.log(
        "Cities via countries in Europe:",
        citiesViaCountries.rows[0].count,
      );
    }

    // Show some sample data
    const sampleData = await pool.query(`
      SELECT ci.name as city_name, co.name as country_name, ci.region_id, co.region_id as country_region_id
      FROM cities ci
      LEFT JOIN countries co ON co.id = ci.country_id
      LIMIT 5
    `);

    console.log("\nSample cities data:");
    sampleData.rows.forEach((row) => {
      console.log(
        `- ${row.city_name} in ${row.country_name || "Unknown"} (city region_id: ${row.region_id}, country region_id: ${row.country_region_id})`,
      );
    });
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkCities();
