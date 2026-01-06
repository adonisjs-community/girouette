import type {
  MiddlewareFn,
  ParsedNamedMiddleware,
  RouteMatcher,
  ResourceActionNames,
} from '@adonisjs/core/types/http'

/**
 * Represents a value that can be either a single item or an array of items
 */
export type OneOrMore<T> = T | T[]

export interface GirouetteConfig {
  controllersGlob: RegExp
}

/**
 * Represents a route configuration within the Girouette system
 */
export type GirouetteRoute = {
  name?: string
  methods: string[]
  pattern: string
  where: { key: string; matcher: RouteMatcher | string | RegExp }[]
  middleware: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
  propertyKey: string
}

/**
 * Represents middleware configuration for resource routes
 */
export type MiddlewareConfig = {
  actions: OneOrMore<ResourceActionNames> | '*'
  middleware: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
}

/**
 * Represent a route that should be processed
 */
export type ControllerToProcess = {
  controller: { default: FunctionConstructor }
  importUrl: URL
}

/**
 * Represents group configuration metadata
 */
export type GroupMetadata = {
  name?: string
  prefix?: string
}
