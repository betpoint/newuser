import express from "express";
import fetch from "node-fetch";
import pkg from "pg";
import cors from "cors"; // ✅ import cors

const { Pool } = pkg;

const app = express();
app.use(express.json());

// ✅ Enable CORS for all origins (required for Glide WebView)
app.use(cors());

// ------------------ Postgres config ------------------
const pool = new Pool({
  connectionString:
    "postgres://postgres.iznxrukdqbrcxjzhvwyk:ZHITafYu6WJqNqjJ@aws-0-us-west-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false }, // validate SSL certificate
});

// ------------------ OneSignal config ------------------
const ONE_SIGNAL_APP_ID = "ba021ecc-a1b5-4900-b9d1-7c60c0ba955f";
const ONE_SIGNAL_REST_API_KEY =
  "os_v2_app_xibb5tfbwveqboorprqmbouvl4wiembbq3huur4f46qilts2nkkbiemosz6jsvhik4kgmjqhg46q66lngabntbbih7g3bvt7bhv75qy";

// ------------------ Fetch OneSignal players ------------------
async function fetchPlayers() {
  const response = await fetch(
    `https://onesignal.com/api/v1/players?app_id=${ONE_SIGNAL_APP_ID}`,
    {
      headers: {
        Authorization: `Basic ${ONE_SIGNAL_REST_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch players: ${response.statusText}`);
  }

  const data = await response.json();
  return data.players || [];
}

// ------------------ POST /webhook → link a single device ------------------
app.post("/webhook", async (req, res) => {
  const { row_id, email } = req.body;

  if (!row_id || !email) {
    return res
      .status(400)
      .json({ success: false, error: "row_id and email are required" });
  }

  try {
    await pool.query(
      `INSERT INTO users (row_id, email)
       VALUES ($1, $2)
       ON CONFLICT (row_id)
       DO UPDATE SET email = EXCLUDED.email`,
      [row_id, email]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------ GET /sync-onesignal → sync all OneSignal players ------------------
app.get("/sync-onesignal", async (req, res) => {
  try {
    const players = await fetchPlayers();
    let inserted = 0,
      updated = 0;

    for (const player of players) {
      const id = player.id;
      const email = player.email || null;
      if (!id) continue;

      const result = await pool.query(
        `INSERT INTO users (row_id, email)
         VALUES ($1, $2)
         ON CONFLICT (row_id)
         DO UPDATE SET email = EXCLUDED.email`,
        [id, email]
      );

      if (result.rowCount > 0) inserted++;
      else updated++;
    }

    res.json({ success: true, inserted, updated });
  } catch (err) {
    console.error("❌ Sync failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------ Start server ------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

