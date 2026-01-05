import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { staticRouteDetector } from '../static_route_parser.js'
import { DevServer } from '@adonisjs/assembler'

/**
 * Assembler hook for Girouette + Tuyau integration
 *
 * Registers fileChanged, fileAdded, and fileRemoved hooks to detect route changes
 * and trigger full reload when needed, while allowing HMR for controller logic changes.
 *
 * When routes change, this hook touches .girouette/routes_registry.ts to trigger
 * a server reload. This file is outside hot-hook boundaries so it doesn't break HMR.
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
 *       generateGirouetteRoutes(), // Detects route changes
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
    async run(devServer: DevServer & { appRoot: string }, hooks: any) {
      const appRoot = devServer.appRoot || process.cwd()
      const routesPath = join(appRoot, 'start', 'routes.ts')

      /**
       * Helper function to trigger full reload by touching start/routes.ts
       * This file is watched by hot-hook and will trigger a server restart
       */
      async function triggerFullReload(reason: string) {
        console.log(`[Girouette] ⚠️  ${reason}, triggering full reload...`)
        try {
          // Read the routes file
          const { readFile: readFileSync } = await import('node:fs/promises')
          const content = await readFileSync(routesPath, 'utf-8')
          // Write it back (same content, new timestamp)
          await writeFile(routesPath, content, 'utf-8')
          console.log('[Girouette] ✓ Reload triggered')
        } catch (error) {
          console.error('[Girouette] Failed to trigger reload:', error)
        }
      }

      console.log('[Girouette] Setting up route change detector...')

      // Initialize the route detector cache with current state of all controllers
      // This ensures the first edit after server start is properly detected
      const initializeRouteCache = async (dir: string, readdir: any): Promise<void> => {
        const entries = await readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = join(dir, entry.name)
          if (entry.isDirectory()) {
            await initializeRouteCache(fullPath, readdir)
          } else if (entry.name.includes('controller')) {
            // Initialize the cache for this controller
            await staticRouteDetector.didRoutesChange(fullPath)
          }
        }
      }

      try {
        const { readdir } = await import('node:fs/promises')
        const controllersPath = join(appRoot, 'app')
        await initializeRouteCache(controllersPath, readdir)
        console.log('[Girouette] ✓ Route detector cache initialized')
      } catch (error) {
        console.error('[Girouette] Failed to initialize route detector cache:', error)
      }

      // Hook: fileChanged - Detect route decorator changes in existing controllers
      hooks.add(
        'fileChanged',
        async (
          relativePath: string,
          absolutePath: string,
          info: {
            source: 'hot-hook' | 'watcher'
            hotReloaded: boolean
            fullReload: boolean
          }
        ) => {
          // Only process controller files
          if (!relativePath.includes('controller')) {
            return
          }

          try {
            // Check if routes changed using static parsing (no import needed!)
            const routesChanged = await staticRouteDetector.didRoutesChange(absolutePath)

            if (routesChanged) {
              await triggerFullReload(`Route decorators changed in ${relativePath}`)
            } else if (info.hotReloaded) {
              console.log(`[Girouette] ✓ Controller logic changed in ${relativePath}, HMR applied`)
            }
          } catch (error) {
            // Silently ignore errors (file might be in invalid state during editing)
          }
        }
      )

      // Hook: fileAdded - New controller added
      hooks.add('fileAdded', async (relativePath: string, absolutePath: string) => {
        // Only process controller files
        if (!relativePath.includes('controller')) {
          return
        }

        try {
          // Check if the new file has route decorators
          const { parseRouteDecorators } = await import('../static_route_parser.js')
          const hash = await parseRouteDecorators(absolutePath)

          // If hash is not empty (file has decorators), trigger reload
          if (hash && hash !== 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855') {
            // Note: empty string hash is e3b0c44...
            await triggerFullReload(`New controller with routes added: ${relativePath}`)
          } else {
            console.log(`[Girouette] New controller added but no routes found: ${relativePath}`)
          }
        } catch (error) {
          // If we can't read the file, assume it has routes and trigger reload
          await triggerFullReload(`New controller added: ${relativePath}`)
        }
      })

      // Hook: fileRemoved - Controller deleted
      hooks.add('fileRemoved', async (relativePath: string, _absolutePath: string) => {
        // Only process controller files
        if (!relativePath.includes('controller')) {
          return
        }

        // When a file is removed, we can't check if it had routes
        // So we always trigger reload and clear the cache
        staticRouteDetector.clear()
        await triggerFullReload(`Controller removed: ${relativePath}`)
      })

      console.log('[Girouette] ✓ Route change detector ready')
    },
  }
}
