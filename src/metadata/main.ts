import { createMetadataStorage } from './factory.ts'

export type RouteMetadata = {
  name?: string
  pattern?: string
  methods?: string[]
  domain?: string
}

export const RouteMetadataKey = Symbol('girouette.routes')
export const RouteMetadataStorage = createMetadataStorage<RouteMetadata>(RouteMetadataKey)

export type GroupMetadata = {
  name?: string
  prefix?: string
  domain?: string
}

export const GroupMetadataKey = Symbol('girouette.group')
export const GroupMetadataStorage = createMetadataStorage<GroupMetadata>(GroupMetadataKey)

export type ControllerMetadata = {
  group: GroupMetadata
  routes: Record<string, RouteMetadata>
}

export function getControllerMetadata(controllerClass: Function): ControllerMetadata {
  const group = GroupMetadataStorage.getMetadata(controllerClass)
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
  }
}
