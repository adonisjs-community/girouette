import 'reflect-metadata'
import { test } from '@japa/runner'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { TestUtilsFactory } from '@adonisjs/core/factories'
import { HTTP_METHODS, RESOURCE_METHODS, extractRoutesList } from './utils.js'
import type { ApplicationService, HttpRouterService } from '@adonisjs/core/types'

const BASE_PATH = join(cwd(), 'test/controllers')

async function createTestApp() {
  const testFactory = new TestUtilsFactory()
  const testUtils = testFactory.create(new URL('../', import.meta.url))
  await testUtils.app.init()
  await testUtils.app.boot()
  return testUtils.app
}

async function setupRoutes(app: ApplicationService, controllersPath: string) {
  const module = await import('../providers/girouette_provider.js')
  const GirouetteProvider = module.default
  const router = (await app.container.make('router')) as HttpRouterService

  const provider = new GirouetteProvider(app)
  provider.controllersPath = controllersPath
  await provider.start()
  router.commit()

  return extractRoutesList(router.toJSON())
}

test.group('GirouetteProvider - Group Routes', () => {
  test('should register "group" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, `${BASE_PATH}/group`)

    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
    assert.isTrue(routes.every((r) => r.name.startsWith('posts.')))
    assert.isTrue(routes.every((r) => r.domain === 'admin.example.com'))
  })

  test('should register "group_middleware" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, `${BASE_PATH}/group_middleware`)

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
  })
})

test.group('GirouetteProvider - Method Routes', () => {
  test('should register "methods" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, `${BASE_PATH}/methods`)

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
    assert.isTrue(routes.every((r) => r.methods.every((m) => HTTP_METHODS.includes(m))))
  })

  test('should register "route_middleware" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, `${BASE_PATH}/route_middleware`)

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
  })

  test('should register "where" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, `${BASE_PATH}/where`)

    assert.isAbove(routes.length, 0, 'Should have at least one route')
    const slugMatcher = (routes[0].matchers.slug as any).match as RegExp

    assert.isFalse(new RegExp(slugMatcher).test('foo~~12312'))
    assert.isTrue(new RegExp(slugMatcher).test('333'))
  })
})

test.group('GirouetteProvider - Resource Routes', () => {
  test('should register "resource" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, `${BASE_PATH}/resource`)

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
    assert.isTrue(routes.every((r) => r.methods.every((m) => HTTP_METHODS.includes(m))))

    const controllerMethods: string[] = routes.map(
      (r) => ((r.handler as any).reference as string).split('.').pop() as string
    )
    assert.isTrue(controllerMethods.every((m) => RESOURCE_METHODS.includes(m.toLowerCase())))
  })

  test('should rename "resource" params', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, `${BASE_PATH}/resource_params`)

    const routesWithParams = routes.filter((r) => r.pattern.includes(':'))

    assert.isTrue(routes.length > 0)
    assert.isTrue(routesWithParams.every((r) => r.pattern.startsWith('/posts')))
    assert.isTrue(routesWithParams.every((r) => r.pattern.includes(':post')))

    const routesWithCommentId = routes.filter((r) => r.pattern.includes('comments/:'))
    assert.isTrue(routesWithCommentId.every((r) => r.pattern.includes(':comment')))
  })

  test('should register "resource_middleware" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, `${BASE_PATH}/resource_middleware`)

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
    assert.isTrue(routes.every((r) => r.methods.every((m) => HTTP_METHODS.includes(m))))

    const controllerMethods: string[] = routes.map(
      (r) => ((r.handler as any).reference as string).split('.').pop() as string
    )
    assert.isTrue(controllerMethods.every((m) => RESOURCE_METHODS.includes(m.toLowerCase())))
  })
})

test.group('GirouetteProvider - Resource Filtering', () => {
  test('should not register non "api-only" resource routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, `${BASE_PATH}/resource_api_only`)

    assert.isTrue(routes.length > 0)

    assert.isFalse(routes.some((r) => r.name?.endsWith('.create')))
    assert.isFalse(routes.some((r) => r.name?.endsWith('.edit')))

    assert.isTrue(routes.some((r) => r.name?.endsWith('.index')))
    assert.isTrue(routes.some((r) => r.name?.endsWith('.store')))
    assert.isTrue(routes.some((r) => r.name?.endsWith('.show')))
    assert.isTrue(routes.some((r) => r.name?.endsWith('.update')))
    assert.isTrue(routes.some((r) => r.name?.endsWith('.destroy')))
  })

  test('should register specified "only" resource routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, `${BASE_PATH}/resource_only`)

    assert.isTrue(routes.length > 0)

    assert.isTrue(routes.some((r) => r.name?.endsWith('.update')))
    assert.isTrue(routes.some((r) => r.name?.endsWith('.destroy')))

    assert.isFalse(routes.some((r) => r.name?.endsWith('.index')))
    assert.isFalse(routes.some((r) => r.name?.endsWith('.store')))
    assert.isFalse(routes.some((r) => r.name?.endsWith('.show')))
    assert.isFalse(routes.some((r) => r.name?.endsWith('.edit')))
    assert.isFalse(routes.some((r) => r.name?.endsWith('.create')))
  })

  test('should not register "except" resource routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, `${BASE_PATH}/resource_except`)

    assert.isTrue(routes.length > 0)

    assert.isFalse(routes.some((r) => r.name?.endsWith('.create')))
    assert.isFalse(routes.some((r) => r.name?.endsWith('.show')))

    assert.isTrue(routes.some((r) => r.name?.endsWith('.index')))
    assert.isTrue(routes.some((r) => r.name?.endsWith('.store')))
    assert.isTrue(routes.some((r) => r.name?.endsWith('.destroy')))
    assert.isTrue(routes.some((r) => r.name?.endsWith('.edit')))
    assert.isTrue(routes.some((r) => r.name?.endsWith('.update')))
  })
})

test.group('GirouetteProvider - Config', () => {
  test('should scan controllers with custom regex config', async ({ assert }) => {
    const app = await createTestApp()
    app.config.set('girouette', {
      controllersGlob: /_controller_domain\.(ts|js)$/,
    })

    const routes = await setupRoutes(app, `${BASE_PATH}/custom_regex`)

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.some((r) => r.name === 'posts.custom_regex.index'))
  })
})
