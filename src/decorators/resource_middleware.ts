import { MiddlewareFn, ParsedNamedMiddleware, ResourceActionNames } from '@adonisjs/core/types/http'
import { OneOrMore } from '@poppinss/utils/types'
import { REFLECT_RESOURCE_MIDDLEWARE_KEY } from '../constants.js'

/**
 * The ResourceMiddleware decorator applies middleware to specific resource actions.
 *
 * @param actions Resource actions to protect ('*' for all actions)
 * @param middleware Middleware to apply to the actions
 *
 * @example
 * ```ts
 * // Protect all resource actions
 * @Resource('/users')
 * @ResourceMiddleware('*', [middleware.auth()])
 * export default class UsersController {
 *   // All methods protected by auth middleware
 * }
 *
 * // Protect specific actions
 * @Resource('/posts')
 * @ResourceMiddleware(['store', 'update', 'destroy'], [middleware.auth()])
 * export default class PostsController {
 *   // Only write operations are protected
 * }
 * ```
 */
export const ResourceMiddleware = (
  actions: ResourceActionNames | '*' | ResourceActionNames[],
  middleware: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
) => {
  return (target: any) => {
    const resourceMiddleware = Reflect.getMetadata(REFLECT_RESOURCE_MIDDLEWARE_KEY, target) || []
    resourceMiddleware.push({ actions, middleware })
    Reflect.defineMetadata(REFLECT_RESOURCE_MIDDLEWARE_KEY, resourceMiddleware, target)
  }
}
