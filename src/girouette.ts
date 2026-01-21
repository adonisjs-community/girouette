import { LazyImport } from '@adonisjs/core/types/common'
import { isHotHookMessage } from './utils.ts'
import { HttpRouterService } from '@adonisjs/core/types'
import { RouterLoader } from './router_loader.ts'
import { Logger } from '@adonisjs/core/logger'

export class Girouette {
  #controllers: LazyImport<Function>[] = []
  #loader: RouterLoader

  constructor(router: HttpRouterService, logger: Logger) {
    this.#loader = new RouterLoader(router, logger)
  }

  async controllers(controllers: LazyImport<Function>[]) {
    this.#controllers.push(...controllers)

    for (const controllerImport of controllers) {
      await this.#loader.load(controllerImport)
    }
  }

  /**
   * Starts listening to hot-hook to reload server
   * when files are changed.
   *
   * Only registers the listener if running with an IPC channel available.
   *
   * @param path - absolute path to the directory to watch
   */
  hmr(path: string) {
    if (!process.send) return

    process.on('message', (message) => {
      if (!isHotHookMessage(message)) return

      if (message.type === 'hot-hook:file-changed') {
        if (message.path.startsWith(path)) {
          this.reload(message.path)
        }
      }
    })
  }

  async boot() {}

  /**
   * Check all controllers for route changes and trigger a full reload if needed.
   *
   * @param changedPath - The path of the file that changed (used in the reload message)
   * @returns `true` if a full reload was triggered, `false` otherwise
   */
  async reload(changedPath?: string): Promise<boolean> {
    let needsFullReload = false

    for (const controllerImport of this.#controllers) {
      const hasChanged = await this.#loader.reload(controllerImport)
      if (hasChanged) {
        needsFullReload = true
      }
    }

    if (needsFullReload && process.send) {
      process.send({
        type: 'hot-hook:full-reload',
        path: changedPath ?? 'unknown',
      })
    }

    return needsFullReload
  }
}
