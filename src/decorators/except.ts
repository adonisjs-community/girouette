import { ResourceActionNames } from '@adonisjs/core/types/http'
import { ResourceMetadataStorage } from '../metadata/main.ts'
import { Constructor } from '../types.ts'

/**
 * The `@Except` decorator specifies which CRUD methods should be excluded from the resource.
 *
 * @param names The CRUD methods to exclude from the resource
 *
 * @example
 * ```ts
 * @Resource('posts')
 * @Except(['create', 'show'])
 * export default class PostsController {
 *   // Generates routes:
 *   // GET    /posts          (posts.index)
 *   // POST   /posts          (posts.store)
 *   // GET    /posts/:id/edit (posts.edit)
 *   // PUT    /posts/:id      (posts.update)
 *   // DELETE /posts/:id      (posts.destroy)
 * }
 * ```
 */
export const Except = (names: ResourceActionNames[]) => {
  return <T extends Constructor>(target: T) => {
    ResourceMetadataStorage.mergeMetadata(target, { except: names })
  }
}
