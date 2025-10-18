import express from "express";
import fetch from "node-fetch";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

// ✅ Direct Postgres connection (Supabase)
const pool = new Pool({
  connectionString:
    "postgresql://postgres:ZHITafYu6WJqNqjJ@db.iznxrukdqbrcxjzhvwyk.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

// ✅ OneSignal configuration
const ONE_SIGNAL_APP_ID = "ba021ecc-a1b5-4900-b9d1-7c60c0ba955f";
const ONE_SIGNAL_REST_API_KEY =
  "os_v2_app_xibb5tfbwveqboorprqmbouvl4wiembbq3huur4f46qilts2nkkbiemosz6jsvhik4kgmjqhg46q66lngabntbbih7g3bvt7bhv75qy"; // your REST key

// ✅ Function to fetch players from OneSignal
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

// ✅ Route to trigger sync manually
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

// ✅ Start server (Render listens on port 10000)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`✅ OneSignal sync server running on port ${PORT}`)
);

