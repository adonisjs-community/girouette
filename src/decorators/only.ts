import { ResourceActionNames } from '@adonisjs/core/types/http'
import { ResourceMetadataStorage } from '../metadata/main.ts'
import { Constructor } from '../types.ts'

/**
 * The `@Only` decorator specifies which CRUD methods should be included in the resource.
 *
 * @param names The CRUD methods to include in the resource
 *
 * @example
 * ```ts
 * @Resource('posts')
 * @Only(['index', 'show'])
 * export default class PostsController {
 *   // Generates routes:
 *   // GET    /posts          (posts.index)
 *   // GET    /posts/:id      (posts.show)
 * }
 * ```
 */
export const Only = (names: ResourceActionNames[]) => {
  return <T extends Constructor>(target: T) => {
    ResourceMetadataStorage.mergeMetadata(target, { only: names })
  }
}
