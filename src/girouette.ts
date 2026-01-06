import { LazyImport } from '@adonisjs/core/types/common'
import { GirouetteRoute, OneOrMore } from './types.ts'
import {
  REFLECT_GROUP_DOMAIN_KEY,
  REFLECT_GROUP_KEY,
  REFLECT_GROUP_MIDDLEWARE_KEY,
} from './constants.ts'
import { MiddlewareFn, ParsedNamedMiddleware } from '@adonisjs/core/types/http'
import { isHotHookMessage } from './utils.ts'
import { HttpRouterService } from '@adonisjs/core/types'
import { GroupMetadata } from './metadata/main.ts'
import { RouterLoader } from './router_loader.ts'
import { Logger } from '@adonisjs/core/logger'

export class Girouette {
  #controllers: LazyImport<Function>[] = []
  #router: HttpRouterService

  #loader: RouterLoader

  constructor(router: HttpRouterService, logger: Logger) {
    this.#router = router
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
   * @param path - absolute path to the directory to watch
   */
  hmr(path: string) {
    process.on('message', (message) => {
      if (!isHotHookMessage(message)) return

      if (message.type === 'hot-hook:file-changed') {
        if (message.path.startsWith(path)) {
          this.reload()
        }
      }
    })
  }

  async boot() {
    console.log('boot', this.#controllers)
  }

  async reload() {
    for (const controllerImport of this.#controllers) {
      const shouldReload = await this.#loader.reload(controllerImport)
      console.log('should reload', shouldReload)
    }
  }

  #collectSingleRoute(controller: FunctionConstructor, methodName: string, route: GirouetteRoute) {
    const group = this.#getControllerMetadata<GroupMetadata>(REFLECT_GROUP_KEY, controller)
    const groupMiddleware = this.#getControllerMetadata<
      OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
    >(REFLECT_GROUP_MIDDLEWARE_KEY, controller)
    const groupDomain = this.#getControllerMetadata<string>(REFLECT_GROUP_DOMAIN_KEY, controller)

    console.log(groupDomain)

    // const finalRoute = this.#applyGroupConfiguration(route, methodName, group, groupMiddleware)

    // Get or create controller variable
    // const controllerVar = this.#getControllerVar(controller.importUrl)

    // Build route line
    // let routeLine = `router.route('${finalRoute.pattern}', ['${finalRoute.method}'], [${controllerVar}, '${methodName}'])`

    // Add route name
    // if (finalRoute.name) {
    //   routeLine += `.as('${finalRoute.name}')`
    // }

    // Add where clauses
    // if (finalRoute.where?.length) {
    //   for (const { key, matcher } of finalRoute.where) {
    //     const matcherStr = matcher instanceof RegExp ? matcher.toString() : `'${matcher}'`
    //     routeLine += `.where('${key}', ${matcherStr})`
    //   }
    // }

    // Add middleware
    // if (finalRoute.middleware?.length) {
    //   for (const m of finalRoute.middleware) {
    //     const middlewareStr = this.#serializeMiddleware(m)
    //     routeLine += `.use(${middlewareStr})`
    //   }
    // }

    // Add domain
    // if (groupDomain) {
    //   routeLine += `.domain('${groupDomain}')`
    // }
    //
    // this.#routeLines.push(routeLine)
  }

  #getControllerMetadata<T>(key: string, controllerClass: FunctionConstructor): T | undefined {
    return Reflect.getMetadata(key, controllerClass)
  }
}
