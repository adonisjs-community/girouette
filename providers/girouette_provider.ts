import 'reflect-metadata'
import type { ApplicationService } from '@adonisjs/core/types'
import { Girouette } from '../src/girouette.ts'

/**
 * The GirouetteProvider is responsible for generating a routes.ts file from decorated controllers.
 * It scans the application's controllers directory and generates a standard AdonisJS routes file.
 */
export default class GirouetteProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('girouette', async (resolver) => {
      const router = await resolver.make('router')
      const logger = await resolver.make('logger')
      return new Girouette(router, logger.child({ service: 'girouette' }))
    })
  }

  async boot() {
    const girouette = await this.app.container.make('girouette')
    await girouette.boot()
  }

  /**
   * Applies group configuration to a route
   */
  // #applyGroupConfiguration(
  //   route: GirouetteRoute,
  //   methodName: string,
  //   group?: GroupMetadata,
  //   groupMiddleware?: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
  // ) {
  //   if (!group && !groupMiddleware) return route
  //
  //   return {
  //     ...route,
  //     pattern: group?.prefix
  //       ? this.#prefixRoutePattern(route.pattern, group.prefix)
  //       : route.pattern,
  //     name: group?.name
  //       ? this.#prefixRouteName(route.name, group.name, methodName)
  //       : route.name || methodName,
  //     middleware: this.#mergeMiddleware(route.middleware, groupMiddleware),
  //   }
  // }

  // #prefixRoutePattern(pattern: string, prefix: string) {
  //   const cleanPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`
  //   const cleanPattern = pattern.startsWith('/') ? pattern.slice(1) : pattern
  //   return `${cleanPrefix}/${cleanPattern}`
  // }
  //
  // #prefixRouteName(name: string | undefined, prefix: string, methodName: string) {
  //   const routeName = name || methodName
  //   return routeName.startsWith(`${prefix}.`) ? routeName : `${prefix}.${routeName}`
  // }
  //
  // #mergeMiddleware(
  //   routeMiddleware: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>[],
  //   groupMiddleware?: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
  // ) {
  //   if (!groupMiddleware) return [...(routeMiddleware || [])]
  //
  //   const groupArray = Array.isArray(groupMiddleware) ? groupMiddleware : [groupMiddleware]
  //   return [...groupArray, ...(routeMiddleware || [])]
  // }
}

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    girouette: Girouette
  }
}
