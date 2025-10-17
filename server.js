import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: "postgres://postgres.iznxrukdqbrcxjzhvwyk:ZHITafYu6WJqNqjJ@aws-0-us-west-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Webhook running on port ${PORT}`));

