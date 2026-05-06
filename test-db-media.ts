import { db } from './lib/db';
import { siteSettings } from './lib/db/schema';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function check() {
  const results = await db.select().from(siteSettings);
  console.log(results.filter(r => r.key.includes('conference_venue')));
  process.exit(0);
}
check();
