import { REFLECT_RESOURCE_NAME_KEY, REFLECT_RESOURCE_PARAMS_KEY } from '../constants.js'

type ResourceOptions =
  | {
      name: string
      params?: { [resource: string]: string }
    }
  | string

/**
 * The Resource decorator automatically defines RESTful routes for a controller.
 *
 * @param options - The options for the resource routes.
 * @param options.name - The name of the resource, used for route naming and as resource identifier.
 * @param options.params - The parameters to rename in the resource routes.
 *
 * @example
 * ```ts
 * // Simple resource with custom pattern
 * @Resource({ name: 'posts', params: { posts: 'post_id' } })
 * export default class PostsController {
 *   // Generates routes:
 *   // GET    /posts               (posts.index)
 *   // GET    /posts/create        (posts.create)
 *   // POST   /posts               (posts.store)
 *   // GET    /posts/:post_id       (posts.show)
 *   // GET    /posts/:post_id/edit  (posts.edit)
 *   // PUT    /posts/:post_id       (posts.update)
 *   // DELETE /posts/:post_id       (posts.destroy)
 * }
 * ```
 * @example
 * ```ts
 * // Nested resource
 * @Resource({name: 'posts.comments', params: { posts: 'post', comments: 'comment' }})
 * export default class PostsCommentsController {
 *   // Generates routes:
 *   // GET    /posts/:post/comments                (posts.comments.index)
 *   // GET    /posts/:post/comments/create         (posts.comments.create)
 *   // POST   /posts/:post/comments                (posts.comments.store)
 *   // GET    /posts/:post/comments/:comment       (posts.comments.show)
 *   // GET    /posts/:post/comments/:comment/edit  (posts.comments.edit)
 *   // PUT    /posts/:post/comments/:comment       (posts.comments.update)
 *   // DELETE /posts/:post/comments/:comment       (posts.comments.destroy)
 * }
 * ```
 * @example
 * ```ts
 * // String shorthand for simple resources
 * @Resource('/posts')
 * export default class PostsController {
 *   // Generates routes:
 *   // GET    /posts               (posts.index)
 *   // GET    /posts/create        (posts.create)
 *   // POST   /posts               (posts.store)
 *   // GET    /posts/:id           (posts.show)
 *   // GET    /posts/:id/edit      (posts.edit)
 *   // PUT    /posts/:id           (posts.update)
 *   // DELETE /posts/:id           (posts.destroy)
 * }
 * ```
 */
export const Resource = (options: ResourceOptions) => {
  return (target: any) => {
    if (typeof options === 'string') {
      options = { name: options }
    }

    Reflect.defineMetadata(REFLECT_RESOURCE_NAME_KEY, options.name, target)

    if (options.params) {
      Reflect.defineMetadata(REFLECT_RESOURCE_PARAMS_KEY, options.params, target)
    }
  }
}
