import { MiddlewareFn, ParsedNamedMiddleware } from '@adonisjs/core/types/http'
import { RouteMetadataStorage } from '../metadata/main.ts'
import { OneOrMore } from '../types.ts'

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
  return (target: any, propertyKey: string) => {
    const existing = RouteMetadataStorage.getMetadata(target, propertyKey)
    const existingMiddleware = existing?.middlewares ?? []

    RouteMetadataStorage.mergeMetadata(
      target,
      { middlewares: [...existingMiddleware, middleware] },
      propertyKey
    )
  }
}
