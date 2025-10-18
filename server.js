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
    // Check if row_id already exists
    const existing = await pool.query(
      "SELECT email FROM users WHERE row_id = $1",
      [row_id]
    );

    if (existing.rowCount === 0) {
      // Insert new row
      await pool.query(
        "INSERT INTO users (row_id, email) VALUES ($1, $2)",
        [row_id, email]
      );
      console.log("Inserted new user:", row_id, email);
    } else if (existing.rows[0].email !== email) {
      // Update email if different
      await pool.query(
        "UPDATE users SET email = $1 WHERE row_id = $2",
        [email, row_id]
      );
      console.log("Updated email for row_id:", row_id, email);
    } else {
      // Both same → do nothing
      console.log("No changes needed for row_id:", row_id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database operation failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Webhook running on port ${PORT}`));


