/**
 * Assembler hook for Girouette + Tuyau integration
 *
 * NOTE: This hook is a no-op. Route generation happens at runtime via the GirouetteProvider
 * because controllers have runtime dependencies that aren't available at build time.
 *
 * @example
 * ```ts
 * // In your adonisrc.ts
 * import { generateRegistry } from '@tuyau/core/hooks'
 *
 * export default defineConfig({
 *   hooks: {
 *     init: [
 *       generateRegistry(), // Generates Tuyau types from routes
 *     ],
 *   },
 *   providers: [
 *     () => import('@adonisjs-community/girouette/providers/girouette_provider'),
 *   ],
 * })
 * ```
 */
export function generateGirouetteRoutes() {
  return {
    async run(_devServer: any, _hooks: any) {
      // No-op: Route generation happens at runtime via GirouetteProvider
      // This is because controllers have runtime dependencies (app.container, etc.)
      // that aren't available at build/hook time.
    },
  }
}
