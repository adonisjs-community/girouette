import { MiddlewareFn, ParsedNamedMiddleware } from '@adonisjs/core/types/http'
import { GroupMetadataStorage } from '../metadata/main.ts'
import { Constructor, OneOrMore } from '../types.ts'

/**
 * The GroupMiddleware decorator allows you to apply middleware to all routes within
 * a controller.
 *
 * @param middleware Middleware to apply to all routes
 *
 * @example
 * ```ts
 * @GroupMiddleware([middleware.auth()])
 * export default class AdminController {
 *   @Get('/dashboard')
 *   index() {}
 * }
 * ```
 */
export const GroupMiddleware = (middleware: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>) => {
  return <T extends Constructor>(target: T) => {
    GroupMetadataStorage.mergeMetadata(target, { middlewares: middleware })
  }
}
