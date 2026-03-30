import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- 8.1 Internal API Routes ---

  // Trend Operations
  app.post("/api/trends/scan", async (req, res) => {
    const { vertical, geo } = req.body;
    // In a real app, this would call SerpAPI, TikTok, etc.
    res.json({ 
      success: true, 
      message: `Scan initiated for ${vertical} in ${geo}`,
      scanId: Math.random().toString(36).substring(7)
    });
  });
  app.get("/api/trends/feed", (req, res) => res.json({ success: true, data: [] }));
  app.get("/api/trends/:id", (req, res) => res.json({ success: true, data: {} }));

  // Generation Operations
  app.post("/api/generate/scripts", (req, res) => res.json({ success: true }));
  app.post("/api/generate/landing-page", (req, res) => res.json({ success: true }));
  app.post("/api/generate/cta", (req, res) => res.json({ success: true }));
  app.post("/api/generate/full-campaign", (req, res) => res.json({ success: true }));

  // Campaign Operations
  app.get("/api/campaigns", (req, res) => res.json({ success: true, data: [] }));
  app.post("/api/campaigns", (req, res) => res.json({ success: true }));
  app.get("/api/campaigns/:id", (req, res) => res.json({ success: true, data: {} }));
  app.delete("/api/campaigns/:id", (req, res) => res.json({ success: true }));
  app.patch("/api/campaigns/:id", (req, res) => res.json({ success: true }));

  // User & Billing
  app.get("/api/user/usage", (req, res) => res.json({ success: true, data: {} }));
  app.get("/api/user/credits", (req, res) => res.json({ success: true, credits: 50 }));
  app.post("/api/billing/checkout", (req, res) => res.json({ success: true, url: "" }));
  app.post("/api/billing/portal", (req, res) => res.json({ success: true, url: "" }));
  app.post("/api/webhooks/stripe", (req, res) => res.json({ received: true }));

  // Export
  app.post("/api/export/pdf", (req, res) => res.json({ success: true }));
  app.post("/api/export/html", (req, res) => res.json({ success: true }));
  app.get("/api/export/json/:id", (req, res) => res.json({ success: true, data: {} }));

  // --- 8.2 Public API (Agency Tier) ---
  const requireApiKey = (req: any, res: any, next: any) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || !apiKey.startsWith('tlk_')) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing X-API-Key" });
    }
    next();
  };

  app.post("/api/v1/trends/scan", requireApiKey, (req, res) => res.json({ success: true }));
  app.post("/api/v1/generate", requireApiKey, (req, res) => res.json({ success: true }));
  app.get("/api/v1/campaigns", requireApiKey, (req, res) => res.json({ success: true, data: [] }));
  app.get("/api/v1/usage", requireApiKey, (req, res) => res.json({ success: true, data: {} }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
