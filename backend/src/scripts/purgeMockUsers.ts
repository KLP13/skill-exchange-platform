import pool from "../config/db";

async function purgeMockUsers() {
  try {
    const mockEmails = [
      "priya.sharma@vitstudent.ac.in",
      "rahul.verma@vitstudent.ac.in",
      "sneha.reddy@vitstudent.ac.in",
      "arjun.mehta@vitstudent.ac.in",
      "ananya.rao@vitstudent.ac.in",
      "karthik.kumar@vitstudent.ac.in",
    ];

    const res = await pool.query(
      "DELETE FROM users WHERE email = ANY($1::text[]) RETURNING id, email, full_name;",
      [mockEmails]
    );

    console.log(`Deleted ${res.rowCount} mock users from PostgreSQL:`);
    res.rows.forEach((r) => console.log(` - ${r.full_name} (${r.email})`));

    await pool.query("DELETE FROM email_verifications WHERE email = 'alex.turner@gmail.com';");

    const remaining = await pool.query("SELECT id, email, full_name FROM users;");
    console.log(`Remaining real users in database: ${remaining.rowCount}`);
    remaining.rows.forEach((r) => console.log(` - ${r.full_name} (${r.email})`));
  } catch (error) {
    console.error("Failed to purge mock users:", error);
  } finally {
    await pool.end();
  }
}

purgeMockUsers();
