import type { ApplicationService, HttpRouterService, LoggerService } from '@adonisjs/core/types'
import { cwd } from 'node:process'
import { join, relative } from 'node:path'
import { readdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import {
  MiddlewareFn,
  OneOrMore,
  ParsedNamedMiddleware,
  RouteMatcher,
} from '@adonisjs/core/types/http'
import { RouteResource } from '@adonisjs/core/http'
import { getControllerMeta } from '../src/metadata_store.js'

/**
 * Represents a route configuration within the Girouette system
 */
type GirouetteRoute = {
  method: string
  pattern: string
  name: string
  where: { key: string; matcher: RouteMatcher | string | RegExp }[]
  middleware: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>[]
}

/**
 * Represent a route that should be processed
 */
type ControllerToProcess = {
  controller: any
  importUrl: URL
}

/**
 * Represents group configuration metadata
 */
type GroupMetadata = {
  name?: string
  prefix?: string
}

/**
 * The GirouetteProvider is responsible for registering all decorated routes with AdonisJS.
 * It scans the application's controllers directory and processes route decorators,
 * resource decorators, and group configurations.
 *
 * @example
 * ```ts
 * // In your adonisrc.ts
 * providers: [
 *   () => import('@adonisjs/core/providers/app_provider'),
 *   () => import('./providers/girouette_provider')
 * ]
 * ```
 */
export default class GirouetteProvider {
  #router: HttpRouterService | null = null
  #logger: LoggerService | null = null
  #controllersPath: string = join(cwd(), 'app')

  constructor(protected app: ApplicationService) {}

  /**
   * Sets the path to the controllers
   */

  set controllersPath(path: string) {
    this.#controllersPath = path
  }

  /**
   * Boot the provider when the application is ready
   */
  async boot() {
    // Provider is booted
  }

  /**
   * Starts the provider by initializing the router and registering all routes
   */
  async start() {
    this.#router = await this.app.container.make('router')
    this.#logger = await this.app.container.make('logger')
    await this.#scanControllersDirectory(this.#controllersPath)
  }

  /**
   * Recursively scans the directory for controller files and registers their routes
   */
  async #scanControllersDirectory(directory: string) {
    const files = await readdir(directory, { withFileTypes: true })

    for (const file of files) {
      const fullPath = join(directory, file.name)

      if (file.isDirectory()) {
        await this.#scanControllersDirectory(fullPath)
        continue
      }

      if (this.#isControllerFile(file.name)) {
        await this.#processControllerFile(fullPath)
      }
    }
  }

  /**
   * Checks if a file is a controller file based on its name
   */
  #isControllerFile(fileName: string): boolean {
    return fileName.endsWith('_controller.ts') || fileName.endsWith('_controller.js')
  }

  /**
   * Processes a controller file by importing it and registering its routes
   */
  async #processControllerFile(filePath: string) {
    try {
      const path = pathToFileURL(filePath)
      const controllerToProcess: ControllerToProcess = {
        controller: await import(path.href),
        importUrl: path,
      }

      this.#registerControllerRoutes(controllerToProcess)
      this.#registerResourceRoutes(controllerToProcess)
    } catch (error) {
      console.error(`[Girouette] Error processing controller file ${filePath}:`, error)
    }
  }

  /**
   * Registers all decorated routes from a controller
   */
  #registerControllerRoutes(controller: ControllerToProcess) {
    try {
      const routes = getControllerMeta(controller.controller.default, 'routes')
      if (!routes) return

      for (const methodName in routes) {
        this.#registerSingleRoute(controller, methodName, routes[methodName])
      }
    } catch (error) {
      this.#logger?.debug({ error }, '[Girouette] Error registering controller routes')
    }
  }

  /**
   * Registers a single route with the AdonisJS router, applying any group configurations
   */
  #registerSingleRoute(controller: ControllerToProcess, methodName: string, route: GirouetteRoute) {
    try {
      const group = getControllerMeta(controller.controller.default, 'group') as
        | GroupMetadata
        | undefined
      const groupMiddleware = getControllerMeta(
        controller.controller.default,
        'groupMiddleware'
      ) as OneOrMore<MiddlewareFn | ParsedNamedMiddleware> | undefined
      const groupDomain = getControllerMeta(controller.controller.default, 'groupDomain') as
        | string
        | undefined

      const finalRoute = this.#applyGroupConfiguration(route, group, groupMiddleware)
      const adonisRoute = this.#createRoute(finalRoute, controller, methodName)
      this.#configureRoute(adonisRoute, finalRoute, groupDomain)
    } catch (error) {
      this.#logger?.debug({ error }, '[Girouette] Error registering single route')
    }
  }

  /**
   * Applies group configuration to a route
   */
  #applyGroupConfiguration(
    route: GirouetteRoute,
    group?: GroupMetadata,
    groupMiddleware?: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
  ) {
    if (!group && !groupMiddleware) return route

    return {
      ...route,
      pattern: group?.prefix
        ? this.#prefixRoutePattern(route.pattern, group.prefix)
        : route.pattern,
      name: group?.name ? this.#prefixRouteName(route.name, group.name) : route.name,
      middleware: this.#mergeMiddleware(route.middleware, groupMiddleware),
    }
  }

  /**
   * Prefixes a route pattern with a group prefix
   */
  #prefixRoutePattern(pattern: string, prefix: string): string {
    const cleanPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`
    const cleanPattern = pattern.startsWith('/') ? pattern.slice(1) : pattern
    return `${cleanPrefix}/${cleanPattern}`
  }

  /**
   * Prefixes a route name with a group prefix
   */
  #prefixRouteName(name: string, prefix: string): string {
    return name ? `${prefix}.${name}` : name
  }

  /**
   * Merges route-specific middleware with group middleware
   */
  #mergeMiddleware(
    routeMiddleware: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>[],
    groupMiddleware?: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
  ) {
    const middleware = [...(routeMiddleware || [])]
    if (groupMiddleware) {
      if (Array.isArray(groupMiddleware)) {
        middleware.unshift(...groupMiddleware)
      } else {
        middleware.unshift(groupMiddleware)
      }
    }
    return middleware
  }

  /**
   * Creates a new route in the AdonisJS router
   */
  #createRoute(route: GirouetteRoute, controller: ControllerToProcess, methodName: string) {
    const relativePath = relative(this.app.appRoot.pathname, controller.importUrl.pathname)
      .replaceAll('\\', '/')
      .replace(/\.ts$/, '.js')
    return this.#router!.route(route.pattern, [route.method], `./${relativePath}.${methodName}`)
  }

  /**
   * Configures a route with its name, constraints, middleware and domain
   */
  #configureRoute(adonisRoute: any, route: GirouetteRoute, domain?: string) {
    if (route.name) {
      adonisRoute.as(route.name)
    }

    if (route.where?.length) {
      this.#applyRouteConstraints(adonisRoute, route.where)
    }

    if (route.middleware?.length) {
      this.#applyRouteMiddleware(adonisRoute, route.middleware)
    }

    if (domain) {
      adonisRoute.domain(domain)
    }
  }

  /**
   * Applies route constraints (where clauses)
   */
  #applyRouteConstraints(route: any, constraints: GirouetteRoute['where']) {
    for (const { key, matcher } of constraints) {
      route.where(key, matcher)
    }
  }

  /**
   * Applies middleware to a route
   */
  #applyRouteMiddleware(route: any, middleware: GirouetteRoute['middleware']) {
    for (const m of middleware) {
      route.use(m)
    }
  }

  /**
   * Registers resource routes for a controller
   */
  #registerResourceRoutes(controller: ControllerToProcess) {
    try {
      const resourcePattern = getControllerMeta(controller.controller.default, 'resource')
      if (!resourcePattern) return

      const relativePath = relative(this.app.appRoot.pathname, controller.importUrl.pathname)
        .replaceAll('\\', '/')
        .replace(/\.ts$/, '.js')
      const resource = this.#router!.resource(resourcePattern, `./${relativePath}`)
      this.#configureResource(resource, controller)
    } catch (error) {
      this.#logger?.debug({ error }, '[Girouette] Error registering resource routes')
    }
  }

  /**
   * Configures a resource with its name and middleware
   */
  #configureResource(resource: RouteResource, controller: ControllerToProcess) {
    try {
      const resourceName = getControllerMeta(controller.controller.default, 'resourceName')
      if (resourceName) {
        resource.as(resourceName)
      }

      const resourceMiddleware = getControllerMeta(
        controller.controller.default,
        'resourceMiddleware'
      ) as
        | {
            actions: string | string[]
            middleware: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>[]
          }[]
        | undefined
      if (resourceMiddleware) {
        this.#applyResourceMiddleware(resource, resourceMiddleware)
      }

      this.#defineResourceActions(resource, controller)
    } catch (error) {
      this.#logger?.debug({ error }, '[Girouette] Error configuring resource')
    }
  }

  /**
   * Applies middleware to resource routes
   */
  #applyResourceMiddleware(resource: any, middlewareConfig: any[]) {
    for (const { actions, middleware } of middlewareConfig) {
      resource.middleware(actions, middleware)
    }
  }

  #defineResourceActions(resource: any, controller: ControllerToProcess) {
    // const apiOnly = Reflect.getMetadata(
    //   REFLECT_RESOURCE_API_ONLY_KEY,
    //   controller.controller.default
    // )
    // if (apiOnly) {
    //   resource.apiOnly()
    // }
    //
    // const only = Reflect.getMetadata(REFLECT_RESOURCE_ONLY_KEY, controller.controller.default)
    // if (only) {
    //   resource.only(only)
    // }
    //
    // const except = Reflect.getMetadata(REFLECT_RESOURCE_EXCEPT_KEY, controller.controller.default)
    // if (except) {
    //   resource.except(except)
    // }
  }
}
