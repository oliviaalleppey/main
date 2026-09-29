import { register } from 'node:module';

// lib/db throws at import time without a connection string. Nothing under test
// talks to a database; this only lets modules that import it load. A real
// DATABASE_URL in the environment is deliberately overridden so a test can never
// reach production by accident.
process.env.DATABASE_URL = 'postgres://test:test@127.0.0.1:1/unit-tests-never-connect';
process.env.RESEND_API_KEY = '';

register('./resolve.mjs', import.meta.url);
