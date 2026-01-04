import { createHash } from 'node:crypto'

/**
 * HMR Route Change Detector
 *
 * Detects if route definitions changed during HMR to determine
 * if a full reload is needed instead of hot module replacement.
 */
export class HMRRouteDetector {
  private routeHashes: Map<string, string> = new Map()

  /**
   * Scans a controller and returns its route hash
   */
  getControllerRouteHash(controllerClass: any): string {
    const routes = Reflect.getMetadata('girouette:routes', controllerClass)
    const resourceName = Reflect.getMetadata('girouette:resource:name', controllerClass)

    // Serialize route definitions
    const routeData = {
      routes: routes || {},
      resource: resourceName || null,
    }

    const routeJson = JSON.stringify(routeData, null, 0)
    return createHash('sha256').update(routeJson).digest('hex')
  }

  /**
   * Check if routes changed for a controller
   * Returns true if routes changed (needs full reload)
   */
  didRoutesChange(controllerPath: string, controllerClass: any): boolean {
    const currentHash = this.getControllerRouteHash(controllerClass)
    const previousHash = this.routeHashes.get(controllerPath)

    // Update cache
    this.routeHashes.set(controllerPath, currentHash)

    // First time seeing this controller
    if (!previousHash) {
      return false
    }

    // Compare hashes
    return currentHash !== previousHash
  }

  /**
   * Clear all cached hashes (on full restart)
   */
  clear() {
    this.routeHashes.clear()
  }
}

// Global singleton instance
export const hmrRouteDetector = new HMRRouteDetector()
