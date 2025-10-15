const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const searchId = process.argv[2];

  try {
    await client.connect();

    const searchResult = await client.query(
      "SELECT COUNT(*)::int AS count FROM hotel_searches WHERE id = $1",
      [searchId],
    );

    const inventoryResult = await client.query(
      "SELECT COUNT(*)::int AS count FROM hotels_inventory_master WHERE search_id = $1",
      [searchId],
    );

    console.log(
      JSON.stringify(
        {
          hotel_searches: searchResult.rows[0].count,
          hotels_inventory_master: inventoryResult.rows[0].count,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error('Query failure', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
