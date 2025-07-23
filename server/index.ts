import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Proxy health check to main API server or provide fallback
  app.get("/health", async (_req, res) => {
    try {
      // Try to proxy to main API server
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        const data = await response.json();
        res.json(data);
      } else {
        throw new Error('Main API server not responding');
      }
    } catch (error) {
      // Fallback response when main API server is not available
      res.json({
        status: "fallback",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: "development",
        services: {
          database: "offline",
          cache: "connected",
          external_apis: "fallback",
        },
        message: "Main API server not available, using development fallback"
      });
    }
  });

  return app;
}
