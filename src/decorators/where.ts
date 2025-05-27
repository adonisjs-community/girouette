import { RouteMatcher } from '@adonisjs/core/types/http'
import { getControllerMeta, setControllerMeta } from '../metadata_store.js'

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
 * import { Where } from '@softwarecitadel/girouette'
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
 * import { Where } from '@softwarecitadel/girouette'
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
    const routes = getControllerMeta(target.constructor, 'routes') || {}
    if (!routes[propertyKey]) {
      routes[propertyKey] = {}
    }
    if (!routes[propertyKey].where) {
      routes[propertyKey].where = []
    }
    routes[propertyKey].where.push({ key, matcher })
    setControllerMeta(target.constructor, 'routes', routes)
  }
}
