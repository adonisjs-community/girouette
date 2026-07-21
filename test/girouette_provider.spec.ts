import 'reflect-metadata'
import { test } from '@japa/runner'
import { IgnitorFactory } from '@adonisjs/core/factories'
import {
  HTTP_METHODS,
  RESOURCE_METHODS,
  extractRoutesList,
  extractMethodFromHandler,
} from './test_utils.js'
import type { ApplicationService } from '@adonisjs/core/types'
import { LazyImport } from '@adonisjs/core/types/common'
import { Girouette } from '../src/girouette.ts'

async function createTestApp() {
  const ignitor = new IgnitorFactory()
    .withCoreProviders()
    .withCoreConfig()
    .create(new URL('./', import.meta.url))

  const app = ignitor.createApp('web')
  await app.init()
  await app.boot()

  return app
}

async function setupRoutes(
  app: ApplicationService,
  controllers: LazyImport<Function>[]
): Promise<ReturnType<typeof extractRoutesList>> {
  const router = await app.container.make('router')
  const logger = await app.container.make('logger')

  const girouette = new Girouette(router, logger)
  await girouette.controllers(controllers)

  router.commit()

  return extractRoutesList(router.toJSON())
}

test.group('GirouetteProvider - Group Routes', () => {
  test('should register "group" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, [() => import('./controllers/group/posts_controller.js')])

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
    assert.isTrue(routes.every((r) => r.name.startsWith('posts.')))
    assert.isTrue(routes.every((r) => r.domain === 'admin.example.com'))
  })

  test('should register "group_middleware" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, [
      () => import('./controllers/group_middleware/posts_controller.js'),
    ])

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
  })
})

test.group('GirouetteProvider - Method Routes', () => {
  test('should register "methods" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, [
      () => import('./controllers/methods/posts_controller.js'),
    ])

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
    assert.isTrue(routes.every((r) => r.methods.every((m) => HTTP_METHODS.includes(m))))
  })

  test('should register "route_middleware" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, [
      () => import('./controllers/route_middleware/posts_controller.js'),
    ])

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
  })

  test('should register "where" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, [() => import('./controllers/where/posts_controller.js')])

    assert.isAbove(routes.length, 0, 'Should have at least one route')
    const slugMatcher = (routes[0].matchers.slug as any).match as RegExp

    assert.isFalse(new RegExp(slugMatcher).test('foo~~12312'))
    assert.isTrue(new RegExp(slugMatcher).test('333'))
  })
})

test.group('GirouetteProvider - Resource Routes', () => {
  test('should register "resource" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, [
      () => import('./controllers/resource/posts_controller.js'),
    ])

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
    assert.isTrue(routes.every((r) => r.name.startsWith('posts.')))
    assert.isFalse(routes.some((r) => r.name.startsWith('posts.posts.')))
    assert.isTrue(routes.every((r) => r.methods.every((m) => HTTP_METHODS.includes(m))))

    const controllerMethods = routes.map((r) => extractMethodFromHandler(r.handler))
    assert.isTrue(controllerMethods.every((m) => RESOURCE_METHODS.includes(m.toLowerCase())))
  })

  test('should combine "resource" routes with a "group"', async ({ assert }) => {
    const app = await createTestApp()

    const routes = await setupRoutes(app, [
      () => import('./controllers/resource_group/posts_controller.js'),
    ])

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/api/v1/posts')))
    assert.isTrue(routes.every((r) => r.name.startsWith('api.v1.posts.')))
    assert.isFalse(routes.some((r) => r.name.startsWith('api.v1.posts.posts.')))
  })

  test('should combine "resource" routes with a prefix-only "group"', async ({ assert }) => {
    const app = await createTestApp()

    const routes = await setupRoutes(app, [
      () => import('./controllers/resource_group_prefix/posts_controller.js'),
    ])

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/api/posts')))
    assert.isTrue(routes.every((r) => r.name.startsWith('posts.')))
    assert.isFalse(routes.some((r) => r.name.startsWith('posts.posts.')))
  })

  test('should rename "resource" params', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, [
      () => import('./controllers/resource_params/posts_controller.js'),
      () => import('./controllers/resource_params/posts_comments_controller.js'),
    ])

    const routesWithParams = routes.filter((r) => r.pattern.includes(':'))

    assert.isTrue(routes.length > 0)
    assert.isTrue(routesWithParams.every((r) => r.pattern.startsWith('/posts')))
    assert.isTrue(routesWithParams.some((r) => r.pattern.includes(':post')))

    const routesWithCommentId = routes.filter((r) => r.pattern.includes('comments/:'))
    assert.isTrue(routesWithCommentId.every((r) => r.pattern.includes(':comment')))
  })

  test('should register "resource_middleware" routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, [
      () => import('./controllers/resource_middleware/posts_controller.js'),
    ])

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.every((r) => r.pattern.startsWith('/posts')))
    assert.isTrue(routes.every((r) => r.methods.every((m) => HTTP_METHODS.includes(m))))

    const controllerMethods = routes.map((r) => extractMethodFromHandler(r.handler))
    assert.isTrue(controllerMethods.every((m) => RESOURCE_METHODS.includes(m.toLowerCase())))
  })
})

test.group('GirouetteProvider - Resource Filtering', () => {
  test('should not register non "api-only" resource routes', async ({ assert }) => {
    const app = await createTestApp()
    const routes = await setupRoutes(app, [
      () => import('./controllers/resource_api_only/posts_controller.js'),
    ])

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
    const routes = await setupRoutes(app, [
      () => import('./controllers/resource_only/posts_controller.js'),
    ])

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
    const routes = await setupRoutes(app, [
      () => import('./controllers/resource_except/posts_controller.js'),
    ])

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
    const routes = await setupRoutes(app, [
      () => import('./controllers/custom_regex/post_controller_domain.js'),
    ])

    assert.isTrue(routes.length > 0)
    assert.isTrue(routes.some((r) => r.name === 'posts.custom_regex.index'))
  })
})
