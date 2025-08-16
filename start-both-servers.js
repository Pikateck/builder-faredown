import { spawn } from "child_process";

// Start both frontend dev server and API server
console.log("🚀 Starting Faredown frontend and API servers...");

// Start API server on port 3001
console.log("🔧 Starting API server on port 3001...");
const apiServer = spawn("node", ["api/server.js"], {
  stdio: "pipe",
  shell: true,
  env: {
    ...process.env,
    PORT: "3001",
    NODE_ENV: "development"
  }
});

apiServer.stdout.on("data", (data) => {
  console.log(`[API] ${data.toString().trim()}`);
});

apiServer.stderr.on("data", (data) => {
  console.error(`[API ERROR] ${data.toString().trim()}`);
});

// Start frontend dev server on port 8080
console.log("📱 Starting frontend dev server on port 8080...");
const frontendServer = spawn("npm", ["run", "dev"], {
  stdio: "pipe",
  shell: true,
  env: {
    ...process.env,
    API_SERVER_URL: "http://localhost:3001"
  }
});

frontendServer.stdout.on("data", (data) => {
  console.log(`[FRONTEND] ${data.toString().trim()}`);
});

frontendServer.stderr.on("data", (data) => {
  console.error(`[FRONTEND ERROR] ${data.toString().trim()}`);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down servers...");
  apiServer.kill();
  frontendServer.kill();
  process.exit(0);
});

console.log("✅ Both servers starting...");
console.log("📱 Frontend: http://localhost:8080");
console.log("🔧 API: http://localhost:3001");
console.log("🔗 API calls are proxied from frontend to API server");
