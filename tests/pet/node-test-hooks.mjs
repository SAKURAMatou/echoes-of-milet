import { register } from 'node:module'

// Enables Node's built-in TS runner to load source that uses the Vite "@/*"
// alias and extensionless ESM imports. No external test framework is used.
register(new URL('./node-test-loader.mjs', import.meta.url), import.meta.url)
