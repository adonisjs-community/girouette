import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

/**
 * Statically parses route decorators from a controller file
 * without executing it (no runtime dependencies needed)
 */
export async function parseRouteDecorators(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf-8')

  // Extract all route-related decorators
  const decoratorPatterns = [
    /@Get\s*\([^)]*\)/g,
    /@Post\s*\([^)]*\)/g,
    /@Put\s*\([^)]*\)/g,
    /@Patch\s*\([^)]*\)/g,
    /@Delete\s*\([^)]*\)/g,
    /@Resource\s*\([^)]*\)/g,
    /@Group\s*\([^)]*\)/g,
    /@Middleware\s*\([^)]*\)/g,
    /@Where\s*\([^)]*\)/g,
  ]

  const decorators: string[] = []

  for (const pattern of decoratorPatterns) {
    const matches = content.matchAll(pattern)
    for (const match of matches) {
      decorators.push(match[0])
    }
  }

  // Sort for consistent hashing
  decorators.sort()

  // Return hash of all route decorators
  const decoratorString = decorators.join('\n')
  return createHash('sha256').update(decoratorString).digest('hex')
}

/**
 * HMR Route Change Detector using static parsing
 */
export class StaticRouteDetector {
  private routeHashes: Map<string, string> = new Map()

  async didRoutesChange(filePath: string): Promise<boolean> {
    const currentHash = await parseRouteDecorators(filePath)
    const previousHash = this.routeHashes.get(filePath)

    console.log('[StaticRouteDetector DEBUG]', {
      filePath,
      currentHash: currentHash.substring(0, 8),
      previousHash: previousHash ? previousHash.substring(0, 8) : 'none',
      changed: previousHash ? currentHash !== previousHash : false,
    })

    // Update cache
    this.routeHashes.set(filePath, currentHash)

    // First time seeing this file
    if (!previousHash) {
      return false
    }

    // Compare hashes
    return currentHash !== previousHash
  }

  clear() {
    this.routeHashes.clear()
  }
}

export const staticRouteDetector = new StaticRouteDetector()
