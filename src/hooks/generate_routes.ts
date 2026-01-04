import { watch } from 'node:fs'
import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { staticRouteDetector } from '../static_route_parser.js'

/**
 * Assembler hook for Girouette + Tuyau integration
 *
 * Watches controller files and triggers full reload when routes change.
 * This allows HMR to work for controller logic changes while forcing
 * full reload only when route definitions change.
 *
 * @example
 * ```ts
 * // In your adonisrc.ts
 * import { generateGirouetteRoutes } from '@adonisjs-community/girouette/hooks'
 * import { generateRegistry } from '@tuyau/core/hooks'
 *
 * export default defineConfig({
 *   hooks: {
 *     init: [
 *       generateGirouetteRoutes(), // Watches for route changes
 *       generateRegistry(),        // Generates Tuyau types
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
    async run(devServer: any, _hooks: any) {
      const appRoot = devServer.appRoot || process.cwd()
      const controllersPath = join(appRoot, 'app')

      console.log('[Girouette] Setting up HMR route change detector...')

      // Watch controller files for changes
      const watcher = watch(controllersPath, { recursive: true }, async (_eventType, filename) => {
        if (!filename || !filename.includes('controller')) {
          return
        }

        const fullPath = join(controllersPath, filename)

        try {
          // Statically parse route decorators (no import needed!)
          const routesChanged = await staticRouteDetector.didRoutesChange(fullPath)

          if (routesChanged) {
            console.log(`[Girouette] ⚠️  Routes changed in ${filename}, triggering full reload...`)
            // Touch routes.ts to trigger full reload
            const routesPath = join(appRoot, 'start', 'routes.ts')
            const content = await readFile(routesPath, 'utf-8')
            await writeFile(routesPath, content, 'utf-8') // Touch file (same content, new timestamp)
          } else {
            console.log(`[Girouette] ✓ Routes unchanged in ${filename}, HMR will proceed`)
          }
        } catch (error) {
          // Ignore errors (file might be deleted, syntax error, etc.)
        }
      })

      // Cleanup on exit
      process.on('exit', () => watcher.close())
    },
  }
}
