import { MiddlewareFn, OneOrMore, ParsedNamedMiddleware } from '@adonisjs/core/types/http'
import { getControllerMeta, setControllerMeta } from '../metadata_store.js'

/**
 * The RouteMiddleware decorator applies middleware to a specific route.
 *
 * @param middleware Middleware to apply to the route
 *
 * @example
 * ```ts
 * @Get('/profile')
 * @RouteMiddleware([middleware.auth()])
 * async show() {
 *   // Protected by auth middleware
 * }
 * ```
 */
export const RouteMiddleware = (middleware: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>) => {
  return (target: any, key: string) => {
    const routes = getControllerMeta(target.constructor, 'routes') || {}

    if (!routes[key]) {
      routes[key] = {}
    }
    if (!routes[key].middleware) {
      routes[key].middleware = []
    }
    routes[key].middleware.push(middleware)
    setControllerMeta(target.constructor, 'routes', routes)
  }
}
