import deepmerge from 'deepmerge'

export function createMetadataStorage<T extends object>(key: symbol | string, defaultMetadata?: T) {
  function defineMetadata(object: object, metadata: T, propertyKey?: string | symbol) {
    if (propertyKey) {
      Reflect.defineMetadata(key, metadata, object, propertyKey)
    } else {
      Reflect.defineMetadata(key, metadata, object)
    }
  }

  function getMetadata(
    object: object,
    propertyKey?: string | symbol,
    withParent = false
  ): T | undefined {
    if (propertyKey) {
      let metadata = Reflect.getMetadata(key, object, propertyKey) ?? defaultMetadata

      if (withParent) {
        const existing = getMetadata(object.constructor)
        metadata = existing ? deepmerge(existing, metadata) : metadata
      }

      return metadata
    } else {
      return Reflect.getMetadata(key, object) ?? defaultMetadata
    }
  }

  function mergeMetadata(object: object, metadata: Partial<T>, propertyKey?: string | symbol): T {
    const existing = getMetadata(object, propertyKey)
    const merged = (existing ? deepmerge(existing, metadata) : metadata) as T
    defineMetadata(object, merged, propertyKey)
    return merged
  }

  return {
    defineMetadata,
    getMetadata,
    mergeMetadata,
  }
}
