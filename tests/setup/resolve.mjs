/**
 * Module hooks for running the repo's TypeScript under Node's own test runner.
 *
 * Node runs .ts directly but does not know the project's `@/` alias or its
 * extensionless imports (`./tax`), and will not import a .json file without an
 * import attribute. Next's bundler handles all three in the app; this does the
 * same for tests, so there is no test framework to install.
 */
import { existsSync, statSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CANDIDATES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];

export async function resolve(specifier, context, nextResolve) {
    let base = null;
    if (specifier.startsWith('@/')) {
        base = path.join(ROOT, specifier.slice(2));
    } else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
        base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    }

    if (base) {
        for (const suffix of CANDIDATES) {
            const candidate = base + suffix;
            if (existsSync(candidate) && statSync(candidate).isFile()) {
                return nextResolve(pathToFileURL(candidate).href, context);
            }
        }
    }

    try {
        return await nextResolve(specifier, context);
    } catch (error) {
        // Packages without an "exports" map (next is one) cannot be imported by
        // subpath from ESM without the extension: `next/server` must be spelled
        // `next/server.js`. Bundlers add it silently; do the same here.
        const isBareSubpath = !specifier.startsWith('.') && !specifier.startsWith('/') && specifier.includes('/')
            && !path.extname(specifier);
        if (error?.code === 'ERR_MODULE_NOT_FOUND' && isBareSubpath) {
            return nextResolve(`${specifier}.js`, context);
        }
        throw error;
    }
}

export async function load(url, context, nextLoad) {
    if (url.startsWith('file:') && url.endsWith('.json')) {
        const json = readFileSync(fileURLToPath(url), 'utf8');
        return { format: 'module', source: `export default ${json};`, shortCircuit: true };
    }
    return nextLoad(url, context);
}
