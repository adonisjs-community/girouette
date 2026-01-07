import { RouteMatcher } from '@adonisjs/core/types/http'
import { RouteMetadataStorage } from '../metadata/main.ts'

/**
 * Decorator for defining route constraints in AdonisJS v6
 * This decorator allows you to add constraints to route parameters,
 * ensuring that the parameter matches a specific pattern before the route is matched.
 *
 * @param key The name of the route parameter to constrain
 * @param matcher The constraint to apply. Can be a string, RegExp, or a custom RouteMatcher function
 * @returns A decorator function
 *
 * @example
 * // In an AdonisJS v6 controller:
 * import { Where } from '@adonisjs-community/girouette'
 *
 * class UsersController {
 *   @Get('/users/:id')
 *   @Where('id', /^\d+$/)
 *   async show({ params }: HttpContext) {
 *     // This route will only match if the 'id' parameter consists of one or more digits
 *   }
 * }
 *
 * @example
 * // Using a custom RouteMatcher function:
 * import { Where } from '@adonisjs-community/girouette'
 *
 * class PostsController {
 *   @Get('/posts/:slug')
 *   @Where('slug', (value) => /^[a-z0-9-]+$/.test(value))
 *   async show({ params }: HttpContext) {
 *     // This route will only match if the 'slug' parameter consists of lowercase letters, numbers, and hyphens
 *   }
 * }
 */
export const Where = (key: string, matcher: RouteMatcher | string | RegExp) => {
  return (target: any, propertyKey: string) => {
    const existing = RouteMetadataStorage.getMetadata(target, propertyKey)
    const existingWhere = existing?.where ?? []

    RouteMetadataStorage.mergeMetadata(
      target,
      { where: [...existingWhere, { key, matcher }] },
      propertyKey
    )
  }
}
