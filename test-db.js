require('@next/env').loadEnvConfig(process.cwd());

const { db } = require('./lib/db');
const { siteSettings } = require('./lib/db/schema');

async function check() {
  const results = await db.select().from(siteSettings);
  console.log(JSON.stringify(results.filter(r => r.key.includes('conference')), null, 2));
  process.exit(0);
}
check();
