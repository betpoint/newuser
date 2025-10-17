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
  const { email, row_id } = req.body;

  if (!email || !row_id) {
    return res.status(400).json({ error: "Email and row_id are required" });
  }

  try {
    await pool.query(
      "INSERT INTO users (email, row_id) VALUES ($1, $2)",
      [email, row_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("DB insert error:", err);
    res.status(500).json({ error: "Database insert failed" });
  }
});

// Start server
app.listen(3000, () => console.log("✅ Webhook running on port 3000"));

