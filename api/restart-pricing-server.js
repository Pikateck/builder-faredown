/**
 * Restart Pricing Server
 */

const { spawn } = require("child_process");

async function restartServer() {
  console.log("🔄 Restarting pricing server...");

  try {
    // Kill existing pricing server processes
    console.log("🛑 Stopping existing pricing servers...");
    const killProcess = spawn("pkill", ["-f", "pricing-server"], {
      stdio: "inherit",
    });

    killProcess.on("close", (code) => {
      console.log("✅ Old servers stopped");

      // Wait a moment then start new server
      setTimeout(() => {
        console.log("🚀 Starting new pricing server...");
        const newServer = spawn("npm", ["run", "start:pricing"], {
          stdio: "inherit",
          detached: true,
        });

        newServer.unref();

        setTimeout(() => {
          console.log("✅ Server should be running now");
          process.exit(0);
        }, 2000);
      }, 1000);
    });
  } catch (error) {
    console.error("❌ Error restarting server:", error);

    // Try direct start
    console.log("🚀 Trying direct start...");
    const newServer = spawn("npm", ["run", "start:pricing"], {
      stdio: "inherit",
      detached: true,
    });

    newServer.unref();
    process.exit(0);
  }
}

restartServer();
