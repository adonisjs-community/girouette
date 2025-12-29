import {
  type MiddlewareFn,
  type OneOrMore,
  type ParsedNamedMiddleware,
} from '@adonisjs/core/types/http'
import { REFLECT_GROUP_MIDDLEWARE_KEY } from '../constants.js'

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
  return (target: any) => {
    Reflect.defineMetadata(REFLECT_GROUP_MIDDLEWARE_KEY, middleware, target)
  }
}
