import pool from "../config/db";

async function testAvailability() {
  try {
    const res = await pool.query(
      "SELECT user_id, day_of_week, is_enabled, start_time, end_time FROM user_availabilities;"
    );
    console.log("Total user availability rows in DB:", res.rowCount);
    res.rows.forEach((r) => {
      console.log(` - User ${r.user_id}: ${r.day_of_week} (${r.is_enabled ? "Enabled" : "Disabled"}) ${r.start_time} - ${r.end_time}`);
    });
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    await pool.end();
  }
}

testAvailability();
