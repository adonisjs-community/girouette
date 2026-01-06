import { GroupMetadata, GroupMetadataStorage, RouteMetadataStorage } from '../metadata/main.ts'

/**
 * The Group decorator allows you to configure route groups with names and prefixes.
 *
 * @param options Configuration object for the group
 *
 * @example
 * ```ts
 * // Using name and prefix
 * @Group({ name: 'admin', prefix: '/admin' })
 * export default class AdminController {}
 *
 * // Using just a name
 * @Group({ name: 'admin' })
 * export default class AdminController {}
 *
 * // Using just a prefix
 * @Group({ prefix: '/admin' })
 * export default class AdminController {}
 * ```
 */
export function Group(options: GroupMetadata): ClassDecorator {
  return function (target) {
    GroupMetadataStorage.defineMetadata(target, options)
  }
}

/**
 * The GroupDomain decorator allows you to restrict all routes within a controller
 * to a specific domain.
 *
 * @param domain Domain to restrict routes to
 *
 * @example
 * ```ts
 * @GroupDomain('admin.example.com')
 * export default class AdminController {
 *   @Get('/admin/dashboard')
 *   index() {
 *     // Only accessible via admin.example.com
 *   }
 * }
 * ```
 */
export const GroupDomain = (domain: string) => {
  return (target: Function, propertyKey?: string | symbol) => {
    if (propertyKey) {
      RouteMetadataStorage.mergeMetadata(target.prototype, { domain }, propertyKey)
    } else {
      GroupMetadataStorage.mergeMetadata(target, { domain })
    }
  }
}
