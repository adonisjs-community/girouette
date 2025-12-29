import { REFLECT_RESOURCE_EXCEPT_KEY } from '../constants.js'
import { type ResourceActionNames } from '@adonisjs/core/types/http'

/**
 * The `@Except` decorator specifies which CRUD methods should be excluded from the resource.
 *
 * @param names The CRUD methods to exclude from the resource
 *
 * @example
 * ```ts
 * @Resource('/posts', 'blog.posts')
 * @Except(['create', 'show'])
 * export default class PostsController {
 *   // Generates routes:
 *   // GET    /posts          (blog.posts.index)
 *   // POST   /posts          (blog.posts.store)
 *   // GET    /posts/:id/edit (blog.posts.edit)
 *   // PUT    /posts/:id      (blog.posts.update)
 *   // DELETE /posts/:id      (blog.posts.destroy)
 * }
 * ```
 */
export const Except = (names: ResourceActionNames[]) => {
  return (target: any) => {
    Reflect.defineMetadata(REFLECT_RESOURCE_EXCEPT_KEY, names, target)
  }
}
