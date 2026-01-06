import { Logger } from '@adonisjs/core/logger'
import { HttpRouterService } from '@adonisjs/core/types'
import { getControllerMetadata, GroupMetadata, RouteMetadata } from './metadata/main.ts'
import { LazyImport } from '@adonisjs/core/types/common'
import { deepEqual } from './utils.ts'
import stringHelpers from '@adonisjs/core/helpers/string'

type ControllerCache = {
  group: GroupMetadata
  routes: Record<string, RouteMetadata>
}

export class RouterLoader {
  #router: HttpRouterService
  #logger: Logger
  #cache = new Map<string, ControllerCache>()

  constructor(router: HttpRouterService, logger: Logger) {
    this.#router = router
    this.#logger = logger
  }

  registerGroup(name: string, metadata: GroupMetadata, callback: () => void) {
    const group = this.#router.group(() => callback())

    group.as(metadata.name ?? stringHelpers.create(name).removeSuffix('Controller').toString())

    if (metadata.prefix) {
      group.prefix(metadata.prefix)
    }

    if (metadata.domain) {
      group.domain(metadata.domain)
    }
  }

  registerRoute(
    controllerImport: LazyImport<Function>,
    controllerName: string,
    metadata: RouteMetadata,
    propertyKey: string
  ) {
    if (!metadata.methods) {
      this.#logger.warn(
        `Could not register route for "${controllerName}#${propertyKey}: missing methods"`
      )
      return
    }

    if (!metadata.pattern) {
      this.#logger.warn(
        `Could not register route for "${controllerName}#${propertyKey}: missing pattern"`
      )
      return
    }

    const route = this.#router.route(metadata.pattern, metadata.methods, [
      controllerImport,
      propertyKey,
    ] as any)

    route.as(metadata.name ?? propertyKey)
  }

  async registerController(
    controllerImport: LazyImport<Function>,
    controllerName: string,
    group: GroupMetadata,
    routes: Record<string, RouteMetadata>
  ) {
    this.registerGroup(controllerName, group ?? {}, () => {
      for (const [propertyKey, routeMetadata] of Object.entries(routes)) {
        this.registerRoute(controllerImport, controllerName, routeMetadata, propertyKey)
      }
    })
  }

  async reload(controllerImport: LazyImport<Function>) {
    const cache = this.#cache.get(controllerImport.toString())
    if (!cache) return true

    const { default: controllerClass } = await controllerImport()
    const metadata = getControllerMetadata(controllerClass)
    if (deepEqual(cache, metadata)) return false
    return true
  }

  async load(controllerImport: LazyImport<Function>) {
    const { default: controllerClass } = await controllerImport()

    if (!controllerClass) return

    const metadata = getControllerMetadata(controllerClass)

    this.#cache.set(controllerImport.toString(), metadata)

    this.registerController(controllerImport, controllerClass.name, metadata.group, metadata.routes)
  }
}
