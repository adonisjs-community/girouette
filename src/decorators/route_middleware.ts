import { MiddlewareFn, ParsedNamedMiddleware } from '@adonisjs/core/types/http'
import { REFLECT_ROUTES_KEY } from '../constants.js'
import { OneOrMore } from '../types.js'

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
    const routes = Reflect.getMetadata(REFLECT_ROUTES_KEY, target.constructor) || {}
    if (!routes[key]) {
      routes[key] = {}
    }
    if (!routes[key].middleware) {
      routes[key].middleware = []
    }
    routes[key].middleware.push(middleware)
    Reflect.defineMetadata(REFLECT_ROUTES_KEY, routes, target.constructor)
  }
}
