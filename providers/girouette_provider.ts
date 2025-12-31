import 'reflect-metadata'
import type { ApplicationService, HttpRouterService, LoggerService } from '@adonisjs/core/types'
import { join } from 'node:path'
import { relative as posixRelative } from 'node:path/posix'
import { readdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { MiddlewareFn, ParsedNamedMiddleware, ResourceActionNames } from '@adonisjs/core/types/http'
import {
  REFLECT_RESOURCE_MIDDLEWARE_KEY,
  REFLECT_RESOURCE_NAME_KEY,
  REFLECT_ROUTES_KEY,
  REFLECT_GROUP_KEY,
  REFLECT_GROUP_MIDDLEWARE_KEY,
  REFLECT_GROUP_DOMAIN_KEY,
  REFLECT_RESOURCE_ONLY_KEY,
  REFLECT_RESOURCE_EXCEPT_KEY,
  REFLECT_RESOURCE_API_ONLY_KEY,
  REFLECT_RESOURCE_PARAMS_KEY,
} from '../src/constants.js'
import { RouteResource, Route } from '@adonisjs/core/http'
import {
  ControllerToProcess,
  GirouetteConfig,
  GirouetteRoute,
  GroupMetadata,
  MiddlewareConfig,
  OneOrMore,
} from '../src/types.js'
import { cwd } from 'node:process'

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
 *   () => import('@adonisjs-community/girouette/providers/girouette_provider')
 * ]
 * ```
 */
export default class GirouetteProvider {
  #router: HttpRouterService | null = null
  #logger: LoggerService | null = null
  #controllersPath: string = join(cwd(), 'app')
  #config: GirouetteConfig | null = null

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
    if (!this.#router) {
      this.#router = await this.app.container.make('router')
    }
    if (!this.#logger) {
      this.#logger = await this.app.container.make('logger')
    }
    if (!this.#config) {
      this.#config = this.app.config.get('girouette')
    }
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
  #isControllerFile(fileName: string) {
    if (!this.#config?.controllersGlob) {
      return fileName.endsWith('_controller.ts') || fileName.endsWith('_controller.js')
    }
    return this.#config?.controllersGlob.test(fileName)
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
      this.#logger?.error({ error, filePath }, '[Girouette] Error processing controller file')
    }
  }

  /**
   * Registers all decorated routes from a controller
   */
  #registerControllerRoutes(controller: ControllerToProcess) {
    const routes = this.#getControllerMetadata<Record<string, GirouetteRoute>>(
      REFLECT_ROUTES_KEY,
      controller.controller.default
    )
    if (!routes) return

    for (const methodName in routes) {
      this.#registerSingleRoute(controller, methodName, routes[methodName])
    }
  }

  /**
   * Registers a single route with the AdonisJS router, applying any group configurations
   */
  #registerSingleRoute(controller: ControllerToProcess, methodName: string, route: GirouetteRoute) {
    const group = this.#getControllerMetadata<GroupMetadata>(
      REFLECT_GROUP_KEY,
      controller.controller.default
    )
    const groupMiddleware = this.#getControllerMetadata<
      OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
    >(REFLECT_GROUP_MIDDLEWARE_KEY, controller.controller.default)
    const groupDomain = this.#getControllerMetadata<string>(
      REFLECT_GROUP_DOMAIN_KEY,
      controller.controller.default
    )

    const finalRoute = this.#applyGroupConfiguration(route, methodName, group, groupMiddleware)
    const adonisRoute = this.#createRoute(finalRoute, controller, methodName)
    this.#configureRoute(adonisRoute, finalRoute, groupDomain)
  }

  /**
   * Applies group configuration to a route
   */
  #applyGroupConfiguration(
    route: GirouetteRoute,
    methodName: string,
    group?: GroupMetadata,
    groupMiddleware?: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
  ) {
    if (!group && !groupMiddleware) return route

    return {
      ...route,
      pattern: group?.prefix
        ? this.#prefixRoutePattern(route.pattern, group.prefix)
        : route.pattern,
      name: group?.name
        ? this.#prefixRouteName(route.name, group.name, methodName)
        : route.name || methodName,
      middleware: this.#mergeMiddleware(route.middleware, groupMiddleware),
    }
  }

  /**
   * Prefixes a route pattern with a group prefix
   */
  #prefixRoutePattern(pattern: string, prefix: string) {
    const cleanPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`
    const cleanPattern = pattern.startsWith('/') ? pattern.slice(1) : pattern
    return `${cleanPrefix}/${cleanPattern}`
  }

  /**
   * Prefixes a route name with a group prefix
   * If no explicit name is provided, uses the methodName as fallback
   */
  #prefixRouteName(name: string | undefined, prefix: string, methodName: string) {
    const routeName = name || methodName
    return routeName.startsWith(`${prefix}.`) ? routeName : `${prefix}.${routeName}`
  }

  /**
   * Merges route-specific middleware with group middleware
   */
  #mergeMiddleware(
    routeMiddleware: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>[],
    groupMiddleware?: OneOrMore<MiddlewareFn | ParsedNamedMiddleware>
  ) {
    if (!groupMiddleware) return [...(routeMiddleware || [])]

    const groupArray = Array.isArray(groupMiddleware) ? groupMiddleware : [groupMiddleware]
    return [...groupArray, ...(routeMiddleware || [])]
  }

  /**
   * Creates a new route in the AdonisJS router
   */
  #createRoute(route: GirouetteRoute, controller: ControllerToProcess, methodName: string) {
    const relativePath = this.#getControllerReference(controller.importUrl)
    return this.#router!.route(route.pattern, [route.method], `./${relativePath}.${methodName}`)
  }

  /**
   * Configures a route with its name, constraints, middleware and domain
   */
  #configureRoute(adonisRoute: Route, route: GirouetteRoute, domain?: string) {
    if (route.name) {
      adonisRoute.as(route.name)
    }

    if (route.where?.length) {
      for (const { key, matcher } of route.where) {
        adonisRoute.where(key, matcher)
      }
    }

    if (route.middleware?.length) {
      for (const m of route.middleware) {
        adonisRoute.use(m)
      }
    }

    if (domain) {
      adonisRoute.domain(domain)
    }
  }

  /**
   * Registers resource routes for a controller
   */
  #registerResourceRoutes(controller: ControllerToProcess) {
    const resourceName = this.#getControllerMetadata<string>(
      REFLECT_RESOURCE_NAME_KEY,
      controller.controller.default
    )
    if (!resourceName) return

    try {
      const relativePath = this.#getControllerReference(controller.importUrl)
      const resource = this.#router!.resource(resourceName, `./${relativePath}`)
      this.#configureResource(resource, controller)
    } catch (error) {
      this.#logger?.error(
        { error, resourceName, controllerPath: controller.importUrl.pathname },
        '[Girouette] Error registering resource routes'
      )
    }
  }

  /**
   * Configures a resource with its name and middleware
   */
  #configureResource(resource: RouteResource, controller: ControllerToProcess) {
    const resourceParams = this.#getControllerMetadata<Record<string, string>>(
      REFLECT_RESOURCE_PARAMS_KEY,
      controller.controller.default
    )
    if (resourceParams) {
      resource.params(resourceParams)
    }

    this.#defineResourceActions(resource, controller)

    const resourceMiddleware = this.#getControllerMetadata<MiddlewareConfig[]>(
      REFLECT_RESOURCE_MIDDLEWARE_KEY,
      controller.controller.default
    )
    if (resourceMiddleware) {
      for (const { actions, middleware } of resourceMiddleware) {
        resource.middleware(actions, middleware)
      }
    }
  }

  /**
   * Defines resource actions using apiOnly, only, and except
   */
  #defineResourceActions(resource: RouteResource, controller: ControllerToProcess) {
    const apiOnly = this.#getControllerMetadata<boolean>(
      REFLECT_RESOURCE_API_ONLY_KEY,
      controller.controller.default
    )
    if (apiOnly) {
      resource.apiOnly()
    }

    const only = this.#getControllerMetadata<ResourceActionNames[]>(
      REFLECT_RESOURCE_ONLY_KEY,
      controller.controller.default
    )
    if (only) {
      resource.only(only)
    }

    const except = this.#getControllerMetadata<ResourceActionNames[]>(
      REFLECT_RESOURCE_EXCEPT_KEY,
      controller.controller.default
    )
    if (except) {
      resource.except(except)
    }
  }

  /**
   * Safely reads metadata from a controller class
   */
  #getControllerMetadata<T>(key: string, controllerClass: FunctionConstructor): T | undefined {
    return Reflect.getMetadata(key, controllerClass)
  }

  /**
   * Converts controller import URL to relative reference path
   */
  #getControllerReference(importUrl: URL): string {
    return posixRelative(this.app.appRoot.pathname, importUrl.pathname).replace(/\.ts$/, '.js')
  }
}
