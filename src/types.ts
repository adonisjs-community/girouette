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
  method: string
  pattern: string
  name: string
  where: { key: string; matcher: RouteMatcher | string | RegExp }[]
  middleware: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>[]
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
