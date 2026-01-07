import { ResourceMetadataStorage } from '../metadata/main.ts'
import { Constructor } from '../types.ts'

/**
 * The `@ApiOnly` decorator removes the routes which aren't needed for an API resource.
 * (i.e. `create`, `edit`)
 *
 * @example
 * ```ts
 * @Resource('posts')
 * @ApiOnly()
 * export default class PostsController {
 *   // Generates routes:
 *   // GET    /posts          (posts.index)
 *   // POST   /posts          (posts.store)
 *   // GET    /posts/:id      (posts.show)
 *   // PUT    /posts/:id      (posts.update)
 *   // DELETE /posts/:id      (posts.destroy)
 * }
 * ```
 */
export const ApiOnly = () => {
  return <T extends Constructor>(target: T) => {
    ResourceMetadataStorage.mergeMetadata(target, { apiOnly: true })
  }
}
