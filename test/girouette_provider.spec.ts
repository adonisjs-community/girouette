import 'reflect-metadata'
import { test } from '@japa/runner'
import GirouetteProvider from '../providers/girouette_provider.js'
import app from '@adonisjs/core/services/app'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { HttpRouterService } from '@adonisjs/core/types'
import { HTTP_METHODS, RESOURCE_METHODS, ResourceRoute, Route, extractRoutesList } from './utils.js'
import { RouteResource } from '@adonisjs/core/http'

test.group('GirouetteProvider', async (group) => {
  let BASE_PATH = join(cwd(), 'test/controllers')

  let router: HttpRouterService

  let provider: GirouetteProvider

  group.setup(async () => {
    router = await app.container.make('router')

    provider = new GirouetteProvider(app)
  })

  test('should register "group" routes', async ({ assert }) => {
    provider.controllersPath = `${BASE_PATH}/group`

    await provider.start()

    const routes = extractRoutesList(router.toJSON())

    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))

    assert.isTrue(routes.every((r) => r.domain === 'admin.example.com'))
  })

  test('should register "group_middleware" routes', async ({ assert }) => {
    provider.controllersPath = `${BASE_PATH}/group_middleware`

    await provider.start()

    const routes = extractRoutesList(router.toJSON())

    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
  })

  test('should register "methods" routes', async ({ assert }) => {
    provider.controllersPath = `${BASE_PATH}/methods`

    await provider.start()

    const routes: Route[] = extractRoutesList(router.toJSON())

    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))

    assert.isTrue(routes.every((r) => r.methods.every((m) => HTTP_METHODS.includes(m))))
  })

  test('should register "resource" routes', async ({ assert }) => {
    provider.controllersPath = `${BASE_PATH}/resource`

    await provider.start()

    const resourceRoute = extractRoutesList(router.toJSON())[0] as unknown as ResourceRoute

    const routes: Route[] = resourceRoute.routes.map((r: any) => r.toJSON())

    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))

    assert.isTrue(routes.every((r) => r.methods.every((m) => HTTP_METHODS.includes(m))))

    const controllerMethods: string[] = routes.map(
      (i) => (i.handler.reference as any).split('.').pop() as string
    )
    assert.isTrue(controllerMethods.every((r) => RESOURCE_METHODS.includes(r.toLowerCase())))
  })

  test('should rename "resource" params', async ({ assert }) => {
    provider.controllersPath = `${BASE_PATH}/resource_params`

    await provider.start()

    const resourceRoute = extractRoutesList(router.toJSON())[0] as unknown as ResourceRoute

    const routes: Route[] = resourceRoute.routes.map((r: any) => r.toJSON())
    const routesWithParams = routes.filter((r) => r.pattern.includes(':'))

    assert.isTrue(routesWithParams.every((r) => r.pattern.startsWith('/posts')))
    assert.isTrue(routesWithParams.every((r) => r.pattern.includes(':post')))

    // Test that the comments resource ID parameter is renamed from :id to :comment
    const routesWithCommentId = routes.filter((r) => r.pattern.includes('comments/:'))
    assert.isTrue(routesWithCommentId.every((r) => r.pattern.includes(':comment')))
  })

  test('should register "resource_middleware" routes', async ({ assert }) => {
    provider.controllersPath = `${BASE_PATH}/resource_middleware`

    await provider.start()

    const resourceRoute = extractRoutesList(router.toJSON())[0] as unknown as ResourceRoute

    const routes: Route[] = resourceRoute.routes.map((r: any) => r.toJSON())

    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))

    assert.isTrue(routes.every((r) => r.methods.every((m) => HTTP_METHODS.includes(m))))

    const controllerMethods: string[] = routes.map(
      (i) => (i.handler.reference as any).split('.').pop() as string
    )
    assert.isTrue(controllerMethods.every((r) => RESOURCE_METHODS.includes(r.toLowerCase())))
  })

  test('should not register non "api-only" resource routes ', async ({ assert }) => {
    provider.controllersPath = `${BASE_PATH}/resource_api_only`

    await provider.start()

    const resource = extractRoutesList(router.toJSON())[0] as unknown as RouteResource
    const routes = resource.routes

    assert.isTrue(routes.find((route) => route.getName()?.endsWith('.create'))!.isDeleted())
    assert.isTrue(routes.find((route) => route.getName()?.endsWith('.edit'))!.isDeleted())
  })

  test('should register specified "only" resource routes', async ({ assert }) => {
    provider.controllersPath = `${BASE_PATH}/resource_only`

    await provider.start()

    const resource = extractRoutesList(router.toJSON())[0] as unknown as RouteResource
    const routes = resource.routes

    assert.isFalse(routes.find((route) => route.getName()?.endsWith('.update'))?.isDeleted())
    assert.isFalse(routes.find((route) => route.getName()?.endsWith('.destroy'))?.isDeleted())
    assert.isTrue(routes.find((route) => route.getName()?.endsWith('.index'))?.isDeleted())
    assert.isTrue(routes.find((route) => route.getName()?.endsWith('.store'))?.isDeleted())
    assert.isTrue(routes.find((route) => route.getName()?.endsWith('.show'))?.isDeleted())
    assert.isTrue(routes.find((route) => route.getName()?.endsWith('.edit'))?.isDeleted())
    assert.isTrue(routes.find((route) => route.getName()?.endsWith('.create'))?.isDeleted())
  })

  test('should not register "except" resource routes', async ({ assert }) => {
    provider.controllersPath = `${BASE_PATH}/resource_except`

    await provider.start()

    const resource = extractRoutesList(router.toJSON())[0] as unknown as RouteResource
    const routes = resource.routes

    assert.isTrue(routes.find((route) => route.getName()?.endsWith('.create'))?.isDeleted())
    assert.isTrue(routes.find((route) => route.getName()?.endsWith('.show'))?.isDeleted())
    assert.isFalse(routes.find((route) => route.getName()?.endsWith('.index'))?.isDeleted())
    assert.isFalse(routes.find((route) => route.getName()?.endsWith('.store'))?.isDeleted())
    assert.isFalse(routes.find((route) => route.getName()?.endsWith('.destroy'))?.isDeleted())
    assert.isFalse(routes.find((route) => route.getName()?.endsWith('.edit'))?.isDeleted())
    assert.isFalse(routes.find((route) => route.getName()?.endsWith('.update'))?.isDeleted())
  })

  test('should register "route_middleware" routes', async ({ assert }) => {
    provider.controllersPath = `${BASE_PATH}/route_middleware`

    await provider.start()

    const routes = extractRoutesList(router.toJSON())

    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
  })

  test('should register "where" routes', async ({ assert }) => {
    provider.controllersPath = `${BASE_PATH}/where`

    await provider.start()

    const routes: Route[] = extractRoutesList(router.toJSON())

    const slugMatcher = (routes[0].matchers.slug as any).match as RegExp

    assert.isFalse(new RegExp(slugMatcher).test('foo~~12312'))

    assert.isTrue(new RegExp(slugMatcher).test('333'))
  })

  test('should scan controllers with custom regex config', async ({ assert }) => {
    provider.controllersPath = `${BASE_PATH}/custom_regex`
    app.config.set('girouette', {
      controllersGlob: /_controller_domain\.(ts|js)$/,
    })

    await provider.start()

    const routes: Route[] = extractRoutesList(router.toJSON())

    assert.isTrue(routes.some((r) => r.name === 'posts.custom_regex.index'))
  })
})
