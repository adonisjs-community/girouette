import {
  type MiddlewareFn,
  type ParsedNamedMiddleware,
  type RouteMatcher,
} from '@adonisjs/http-server/types'

export type OneOrMore<T> = T | T[]

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

export interface GirouetteConfig {
  controllersGlob: RegExp
}
