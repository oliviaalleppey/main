require('@next/env').loadEnvConfig(process.cwd());
const { Pool } = require('@neondatabase/serverless');
async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query("SELECT * FROM site_settings WHERE key LIKE '%conference%';");
  console.log(JSON.stringify(rows, null, 2));
  process.exit();
}
test();
