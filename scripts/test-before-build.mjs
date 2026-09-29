/**
 * Runs the unit tests as the first step of `npm run build`, so a failing test
 * stops the deploy instead of shipping. Vercel runs `npm run build` for every
 * push to main; a failed build leaves the current production deployment live.
 *
 * The tests use Node's built-in runner with TypeScript type-stripping, which
 * needs Node 22.7 or later. The project does not pin a Node version, so on an
 * older one this says so loudly and lets the build continue — blocking every
 * deploy because the runner cannot start would be worse than the gap. Set the
 * project's Node version to 22.x or later in Vercel to close it.
 *
 * SKIP_TESTS=1 skips them for an emergency deploy; the build log says so.
 */
import { spawnSync } from 'node:child_process';

const [major, minor] = process.versions.node.split('.').map(Number);
const supported = major > 22 || (major === 22 && minor >= 7);

if (process.env.SKIP_TESTS === '1') {
    console.warn('\n⚠️  SKIP_TESTS=1 — unit tests skipped for this build.\n');
    process.exit(0);
}

if (!supported) {
    console.warn(
        `\n⚠️  Unit tests NOT run: Node ${process.versions.node} is older than 22.7, which the test ` +
        'runner needs. Set the Node.js version to 22.x or later in Vercel → Settings → Build and ' +
        'Deployment to have tests gate deploys.\n',
    );
    process.exit(0);
}

console.log(`Running unit tests before build (Node ${process.versions.node})…`);
const result = spawnSync('npm', ['test', '--silent'], { stdio: 'inherit', shell: process.platform === 'win32' });

if (result.status !== 0) {
    console.error('\n✖ Unit tests failed — build stopped, nothing deployed. Run `npm test` locally to see why.\n');
    process.exit(result.status ?? 1);
}
console.log('✔ Unit tests passed.\n');
