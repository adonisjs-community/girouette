import {
  MiddlewareFn,
  ParsedNamedMiddleware,
  ResourceActionNames,
  RouteMatcher,
} from '@adonisjs/core/types/http'
import { createMetadataStorage } from './factory.ts'
import { OneOrMore } from '../types.ts'

export type WhereConstraint = {
  key: string
  matcher: RouteMatcher | string | RegExp
}

export type RouteMetadata = {
  name?: string
  pattern?: string
  methods?: string[]
  domain?: string
  middlewares?: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>[]
  where?: WhereConstraint[]
}

export const RouteMetadataKey = Symbol('girouette.routes')
export const RouteMetadataStorage = createMetadataStorage<RouteMetadata>(RouteMetadataKey)

export type GroupMetadata = {
  name?: string
  prefix?: string
  domain?: string
  middlewares?: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
}

export const GroupMetadataKey = Symbol('girouette.group')
export const GroupMetadataStorage = createMetadataStorage<GroupMetadata>(GroupMetadataKey)

export type ResourceMiddlewareEntry = {
  actions: ResourceActionNames | '*' | ResourceActionNames[]
  middlewares: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
}

export type ResourceMetadata = {
  name: string
  params?: Record<string, string>
  only?: ResourceActionNames[]
  except?: ResourceActionNames[]
  apiOnly?: boolean
  middlewares?: ResourceMiddlewareEntry[]
}

export const ResourceMetadataKey = Symbol('girouette.resource')
export const ResourceMetadataStorage = createMetadataStorage<ResourceMetadata>(ResourceMetadataKey)

export type ControllerMetadata = {
  group: GroupMetadata
  routes: Record<string, RouteMetadata>
  resource?: ResourceMetadata
}

export function getControllerMetadata(controllerClass: Function): ControllerMetadata {
  const group = GroupMetadataStorage.getMetadata(controllerClass)
  const resource = ResourceMetadataStorage.getMetadata(controllerClass)
  const routes = Object.getOwnPropertyNames(controllerClass.prototype).reduce(
    (acc, propertyKey) => {
      const metadata = RouteMetadataStorage.getMetadata(controllerClass.prototype, propertyKey)
      if (!metadata) return acc

      return {
        ...acc,
        [propertyKey]: RouteMetadataStorage.getMetadata(controllerClass.prototype, propertyKey),
      }
    },
    {} satisfies Record<string, RouteMetadata>
  )

  return {
    group: group ?? {},
    routes,
    resource,
  }
}
