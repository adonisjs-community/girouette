import { MiddlewareFn, ParsedNamedMiddleware, ResourceActionNames } from '@adonisjs/core/types/http'
import { Constructor, OneOrMore } from '../types.ts'
import { ResourceMetadataStorage } from '../metadata/main.ts'

/**
 * The ResourceMiddleware decorator applies middleware to specific resource actions.
 *
 * @param actions Resource actions to protect ('*' for all actions)
 * @param middleware Middleware to apply to the actions
 *
 * @example
 * ```ts
 * // Protect all resource actions
 * @Resource('users')
 * @ResourceMiddleware('*', [middleware.auth()])
 * export default class UsersController {
 *   // All methods protected by auth middleware
 * }
 *
 * // Protect specific actions
 * @Resource('posts')
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
  return <T extends Constructor>(target: T) => {
    const existing = ResourceMetadataStorage.getMetadata(target)
    const existingMiddleware = existing?.middlewares ?? []

    ResourceMetadataStorage.mergeMetadata(target, {
      middlewares: [...existingMiddleware, { actions, middlewares: middleware }],
    })
  }
}
