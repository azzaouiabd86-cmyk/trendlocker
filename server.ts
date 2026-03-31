import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2026-03-25.dahlia',
});

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock' });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use raw body for Stripe webhook
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
  app.use(express.json());

  // Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- 8.1 Internal API Routes ---

  // Trend Operations
  app.post("/api/trends/scan", requireAuth, async (req: any, res: any) => {
    const { vertical, geo } = req.body;
    const uid = req.user.uid;

    try {
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();
      if ((userData?.apiCreditsRemaining || 0) <= 0) {
        return res.status(403).json({ error: 'Insufficient credits' });
      }

      // Call Gemini API
      const prompt = `Generate 3 trending topics for the ${vertical} vertical in ${geo}. Return JSON array of objects with trendName, trendDescription, viralityScore (0-100), searchVolumeDelta, socialVelocity, sourcePlatform, suggestedLeadMagnets (array of strings), vertical, geoTarget.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const trends = JSON.parse(response.text || '[]');

      // Atomically decrement credit and save result
      const batch = db.batch();
      batch.update(userRef, {
        apiCreditsRemaining: admin.firestore.FieldValue.increment(-1)
      });

      const scanId = Math.random().toString(36).substring(7);
      const scanRef = db.collection('trend_snapshots').doc(scanId);
      batch.set(scanRef, {
        userId: uid,
        vertical,
        geoTarget: geo,
        trends,
        createdAt: new Date().toISOString()
      });

      await batch.commit();

      res.json({ 
        success: true, 
        message: `Scan completed for ${vertical} in ${geo}`,
        scanId,
        data: trends
      });
    } catch (error) {
      console.error('Error generating trends:', error);
      res.status(500).json({ error: 'Failed to generate trends' });
    }
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
  
  app.post("/api/user/deduct-credit", requireAuth, async (req: any, res: any) => {
    const uid = req.user.uid;
    try {
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();
      if ((userData?.apiCreditsRemaining || 0) <= 0) {
        return res.status(403).json({ error: 'Insufficient credits' });
      }

      await userRef.update({
        apiCreditsRemaining: admin.firestore.FieldValue.increment(-1)
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deducting credit:', error);
      res.status(500).json({ error: 'Failed to deduct credit' });
    }
  });

  app.post("/api/admin/assign-claim", requireAuth, async (req: any, res: any) => {
    const email = req.user.email;
    const uid = req.user.uid;
    
    // Only allow the specific user email to claim admin rights
    if (email === 'azzaouiabd86@gmail.com') {
      try {
        await admin.auth().setCustomUserClaims(uid, { admin: true });
        res.json({ success: true, message: 'Admin claim assigned successfully. Please log out and log back in.' });
      } catch (error) {
        console.error('Error assigning admin claim:', error);
        res.status(500).json({ error: 'Failed to assign admin claim' });
      }
    } else {
      res.status(403).json({ error: 'Unauthorized' });
    }
  });

  app.post("/api/billing/checkout", requireAuth, async (req: any, res: any) => {
    const { planId } = req.body;
    const uid = req.user.uid;
    const email = req.user.email;

    try {
      const prices: Record<string, string> = {
        pro: process.env.STRIPE_PRICE_PRO || 'price_mock_pro',
        agency: process.env.STRIPE_PRICE_AGENCY || 'price_mock_agency'
      };

      const priceId = prices[planId];
      if (!priceId) {
        return res.status(400).json({ error: 'Invalid plan' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/dashboard/usage?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/pricing`,
        customer_email: email,
        client_reference_id: uid,
        metadata: {
          planId,
          uid
        }
      });

      res.json({ success: true, url: session.url });
    } catch (error) {
      console.error('Stripe checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  app.post("/api/billing/portal", (req, res) => res.json({ success: true, url: "" }));
  
  app.post("/api/webhooks/stripe", async (req: any, res: any) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock');
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.client_reference_id;
      const planId = session.metadata?.planId;

      if (uid && planId) {
        const newCredits = planId === 'agency' ? 5000 : planId === 'pro' ? 500 : 15;
        await db.collection('users').doc(uid).update({
          subscriptionTier: planId,
          apiCreditsRemaining: newCredits,
          updatedAt: new Date().toISOString()
        });
      }
    }

    res.json({ received: true });
  });

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
