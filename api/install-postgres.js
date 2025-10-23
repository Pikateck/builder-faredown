﻿/**
 * Install PostgreSQL dependency for Faredown API
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

async function installPostgreSQL() {
  console.log("ðŸ“¦ Installing PostgreSQL driver (pg)...");

  return new Promise((resolve, reject) => {
    exec("npm install pg", { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error("âŒ Failed to install PostgreSQL driver:", error);
        reject(error);
        return;
      }

      console.log("âœ… PostgreSQL driver installed successfully");
      console.log(stdout);

      // Check if pg is now available
      try {
        require("pg");
        console.log("âœ… PostgreSQL driver is working");
        resolve();
      } catch (err) {
        console.error("âŒ PostgreSQL driver not working:", err);
        reject(err);
      }
    });
  });
}

// Run installation
if (require.main === module) {
  installPostgreSQL()
    .then(() => {
      console.log("ðŸŽ‰ PostgreSQL setup complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("ðŸ’¥ Installation failed:", error);
      process.exit(1);
    });
}

export default { installPostgreSQL };
