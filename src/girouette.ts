import { ApplicationService, HttpRouterService } from '@adonisjs/core/types'
import { Autoloader } from './autoloader.js'
import { Logger } from '@adonisjs/core/logger'
import { REFLECT_ROUTES_KEY } from './constants.js'
import { Route } from '@adonisjs/http-server'

export type GirouetteOptions = {
  controllersPath: string
}

type ControllerModule = {
  controller: FunctionConstructor
  path: string
}

export class Girouette {
  #app: ApplicationService
  #router: HttpRouterService
  #logger: Logger
  #autoloader: Autoloader

  cache = new Map<string, Route[]>()

  constructor(
    app: ApplicationService,
    router: HttpRouterService,
    logger: Logger,
    options: GirouetteOptions
  ) {
    this.#app = app
    this.#router = router
    this.#logger = logger
    this.#autoloader = new Autoloader({
      path: options.controllersPath,
      suffixes: ['controller'],
    })
  }

  async load() {
    this.#autoloader.on('added', ({ module, path }) => {
      const { default: Controller } = module
      this.updateControllerRoutes(Controller, path)
    })

    this.#autoloader.on('updated', ({ module, path }) => {
      const { default: Controller } = module
      this.updateControllerRoutes(Controller, path)
    })

    await this.#autoloader.autoload()
  }

  updateControllerRoutes(Controller: FunctionConstructor, path: string) {
    const routes = this.#createControllerRoutes(Controller)
    this.cache.set(path, routes)
    this.reload()
  }

  reload() {
    for (const routes of this.cache.values()) {
      for (const route of routes) {
        this.#router.pushToRoutes(route)
      }
    }

    this.#router.commit()
  }

  #createControllerRoutes(Controller: FunctionConstructor) {
    const meta = Reflect.getMetadata(REFLECT_ROUTES_KEY, Controller)
    if (!meta) return []

    const routes = Object.entries(meta).map(([method, route]) =>
      this.#createRoute(Controller, method, route)
    )

    return routes
  }

  #createRoute(Controller: FunctionConstructor, method: string, route: any) {
    return new Route(this.#app, [], {
      pattern: route.pattern,
      methods: [route.method],
      handler: [Controller, method as any],
      globalMatchers: {},
    })
  }
}
