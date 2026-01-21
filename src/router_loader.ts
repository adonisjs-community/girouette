import { Logger } from '@adonisjs/core/logger'
import { HttpRouterService } from '@adonisjs/core/types'
import {
  getControllerMetadata,
  GroupMetadata,
  ResourceMetadata,
  RouteMetadata,
} from './metadata/main.ts'
import { LazyImport } from '@adonisjs/core/types/common'
import { deepEqual, prettifyGroupName } from './utils.ts'

type ControllerCache = {
  group: GroupMetadata
  routes: Record<string, RouteMetadata>
  resource?: ResourceMetadata
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

    group.as(metadata.name ?? prettifyGroupName(name))

    if (metadata.prefix) {
      group.prefix(metadata.prefix)
    }

    if (metadata.domain) {
      group.domain(metadata.domain)
    }

    if (metadata.middlewares) {
      group.use(metadata.middlewares)
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

    route.as(metadata.name)

    if (metadata.middlewares) {
      for (const middleware of metadata.middlewares) {
        route.use(middleware)
      }
    }

    if (metadata.where) {
      for (const { key, matcher } of metadata.where) {
        route.where(key, matcher)
      }
    }
  }

  registerResource(controllerImport: LazyImport<Function>, metadata: ResourceMetadata) {
    this.#logger.debug({ metadata }, 'Registering resource')

    const resource = this.#router.resource(metadata.name, controllerImport as any)

    if (metadata.params) {
      resource.params(metadata.params)
    }

    if (metadata.apiOnly) {
      resource.apiOnly()
    } else if (metadata.only) {
      resource.only(metadata.only)
    } else if (metadata.except) {
      resource.except(metadata.except)
    }

    if (metadata.middlewares) {
      for (const { actions, middlewares } of metadata.middlewares) {
        resource.use(actions, middlewares)
      }
    }
  }

  registerController(
    controllerImport: LazyImport<Function>,
    controllerName: string,
    group: GroupMetadata,
    routes: Record<string, RouteMetadata>,
    resource?: ResourceMetadata
  ) {
    if (resource) {
      this.registerResource(controllerImport, resource)
      return
    }

    this.registerGroup(controllerName, group ?? {}, () => {
      for (const [propertyKey, routeMetadata] of Object.entries(routes)) {
        this.registerRoute(controllerImport, controllerName, routeMetadata, propertyKey)
      }
    })
  }

  /**
   * Check if a controller's routes have changed and need a full server reload.
   *
   * @returns `true` if routes changed and a full reload is needed, `false` otherwise
   */
  async reload(controllerImport: LazyImport<Function>): Promise<boolean> {
    const cacheKey = controllerImport.toString()
    const cache = this.#cache.get(cacheKey)

    const { default: controllerClass } = await controllerImport()
    const metadata = getControllerMetadata(controllerClass)

    if (!cache) {
      this.#cache.set(cacheKey, metadata)
      return true
    }

    if (deepEqual(cache, metadata)) {
      return false
    }

    this.#cache.set(cacheKey, metadata)
    return true
  }

  async load(controllerImport: LazyImport<Function>) {
    const { default: controllerClass } = await controllerImport()

    if (!controllerClass) return

    const metadata = getControllerMetadata(controllerClass)

    this.#cache.set(controllerImport.toString(), metadata)

    this.registerController(
      controllerImport,
      controllerClass.name,
      metadata.group,
      metadata.routes,
      metadata.resource
    )
  }
}
