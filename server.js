import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Webhook route
app.post("/webhook", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    await pool.query("INSERT INTO users (email) VALUES ($1)", [email]);
    res.json({ success: true });
  } catch (err) {
    console.error("DB insert error:", err);
    res.status(500).json({ error: "Database insert failed" });
  }
});

// Start server
app.listen(3000, () => console.log("✅ Webhook running on port 3000"));
