![Statements](https://img.shields.io/badge/statements-95.96%25-brightgreen.svg?style=flat)
![Branches](https://img.shields.io/badge/branches-91.57%25-brightgreen.svg?style=flat)
![Functions](https://img.shields.io/badge/functions-90.9%25-brightgreen.svg?style=flat)
![Lines](https://img.shields.io/badge/lines-95.96%25-brightgreen.svg?style=flat)

# Girouette

> Elegant decorator-based routing for AdonisJS v7

## Introduction

Girouette provides a beautiful, fluent API for defining your AdonisJS routes using decorators. By bringing route definitions closer to your controller methods, Girouette makes your application's routing more intuitive and maintainable.

## Installation

You can install Girouette via the AdonisJS CLI:

```bash
node ace add @adonisjs-community/girouette
```

## Configuration

To manually generate the configuration file, you can run:

```bash
node ace configure @adonisjs-community/girouette
```

By convention, Girouette will recursively scan all files in the `./app` folder that end with `_controller.ts`. You can change this behavior by modifying the `controllersGlob` regex in the configuration file.

## Basic Routing

After installation, you can start using decorators to define your routes.

Import the decorators you need in your controller:

```typescript
import {
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Any,
  Middleware,
  ResourceMiddleware,
  GroupMiddleware,
  Resource,
  Where,
  Group,
  GroupDomain,
} from '@adonisjs-community/girouette'
import { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  @Get('/users')
  async index({ response }: HttpContext) {
    // Handle GET request
  }

  @Post('/users')
  async store({ request }: HttpContext) {
    // Handle POST request
  }
}
```

## Route Groups

Girouette provides several decorators for grouping routes:

```typescript
import { Group, GroupMiddleware, GroupDomain } from '@adonisjs-community/girouette'
import { middleware } from '#start/kernel'

@Group({ name: 'admin', prefix: '/admin' }) // Name prefix and URL prefix
@GroupMiddleware([middleware.auth()]) // Shared middleware
@GroupDomain('admin.example.com') // Domain restriction
export default class AdminController {
  @Get('/dashboard', 'admin.dashboard') // Final URL: /admin/dashboard
  async index() {
    // Route name: admin.dashboard
    // Protected by auth middleware
    // Only accessible via admin.example.com
  }
}
```

The `@Group` decorator accepts a configuration object with the following options:

```typescript
// Just a name prefix
@Group({ name: 'api' })
export class ApiController {}

// Just a URL prefix
@Group({ prefix: '/api' })
export class ApiController {}

// Both at once
@Group({ name: 'api', prefix: '/api/v1' })
export class ApiController {}
```

## Route Middleware

You can protect your routes using middleware through the `Middleware` decorator:

```typescript
import { Get, Middleware } from '@adonisjs-community/girouette'
import { middleware } from '#start/kernel'

export default class UsersController {
  @Get('/profile')
  @Middleware([middleware.auth()])
  async show({ auth }: HttpContext) {
    // Only authenticated users can access this route
  }
}
```

## Resource Controllers

For RESTful resources, Girouette provides a `Resource` decorator that automatically defines conventional routes:

```typescript
import { Resource } from '@adonisjs-community/girouette'

@Resource('posts')
export default class PostsController {
  async index() {} // GET /posts
  async create() {} // GET /posts/create
  async store() {} // POST /posts
  async show() {} // GET /posts/:id
  async edit() {} // GET /posts/:id/edit
  async update() {} // PUT/PATCH /posts/:id
  async destroy() {} // DELETE /posts/:id
}
```

<br>

You can also rename the resource parameters:

```typescript
import { Resource } from '@adonisjs-community/girouette'

@Resource({ name: 'articles', params: { articles: 'slug' } })
export default class ArticlesController {
  async index() {} // GET /articles
  async create() {} // GET /articles/create
  async store() {} // POST /articles
  async show({ params }: HttpContext) {} // GET /articles/:slug
  async edit({ params }: HttpContext) {} // GET /articles/:slug/edit
  async update({ params }: HttpContext) {} // PUT/PATCH /articles/:slug
  async destroy({ params }: HttpContext) {} // DELETE /articles/:slug
}
```

<br>

Or create a nested resource:

```typescript
import { Resource } from '@adonisjs-community/girouette'

@Resource({ name: 'user.posts', params: { users: 'userId', posts: 'postId' } })
export default class UserPostsController {
  async index({ params }: HttpContext) {} // GET /users/:userId/posts
  async create({ params }: HttpContext) {} // GET /users/:userId/posts/create
  async store({ params }: HttpContext) {} // POST /users/:userId/posts
  async show({ params }: HttpContext) {} // GET /users/:userId/posts/:postId
  async edit({ params }: HttpContext) {} // GET /users/:userId/posts/:postId/edit
  async update({ params }: HttpContext) {} // PUT/PATCH /users/:userId/posts/:postId
  async destroy({ params }: HttpContext) {} // DELETE /users/:userId/posts/:postId
}
```

## Route Constraints

Use the `Where` decorator to add constraints to your route parameters:

```typescript
import { Get, Where } from '@adonisjs-community/girouette'

export default class PostsController {
  @Get('/posts/:slug')
  @Where('slug', /^[a-z0-9-]+$/)
  async show({ params }: HttpContext) {
    // Only matches if slug contains lowercase letters, numbers, and hyphens
  }
}
```

## Available Decorators

### HTTP Methods

- `@Get(pattern: string, name?: string)`
- `@Post(pattern: string, name?: string)`
- `@Put(pattern: string, name?: string)`
- `@Patch(pattern: string, name?: string)`
- `@Delete(pattern: string, name?: string)`
- `@Any(pattern: string, name?: string)`

### Route Configuration

- `@Group(name?: string)` - Define optional route name prefix
- `@GroupDomain(domain: string)` - Restrict routes to a specific domain
- `@GroupMiddleware(middleware: Middleware[])` - Apply middleware to all routes
- `@Middleware(middleware: Middleware[])` - Apply middleware to a single route
- `@Resource({name: string, params?: { [resource: string]: string } })` - Create RESTful resource routes
- `@ResourceMiddleware(actions: string | string[], middleware: Middleware[])` - Apply middleware to resource actions
- `@Where(param: string, matcher: string | RegExp | Function)` - Add route parameter constraints

### Resource Actions

- `@Pick(actions: string | string[])` - Include only specified actions in a resource
- `@Except(actions: string | string[])` - Exclude specified actions from a resource
- `@ApiOnly()` - Include only API actions in a resource (index, show, store, update, destroy)

## Advanced Usage

### Combining Multiple Decorators

Decorators can be combined to create sophisticated routing configurations:

```typescript
import { Get, Middleware, Where } from '@adonisjs-community/girouette'
import { middleware } from '#start/kernel'

@Group('/api')
export default class ArticlesController {
  @Get('/articles/:id')
  @Middleware([middleware.auth()])
  @Where('id', /^\d+$/)
  async show({ params }: HttpContext) {
    // Protected route with parameter validation
  }
}
```

### Resource Middleware

Apply middleware to specific resource actions:

```typescript
import { Resource, ResourceMiddleware } from '@adonisjs-community/girouette'
import { middleware } from '#start/kernel'

@Resource('admin.posts')
@ResourceMiddleware(['store', 'update', 'destroy'], [middleware.auth()])
export default class AdminPostsController {
  // Only store, update, and destroy methods are protected
}
```

### Resource Actions Picking

You can pick specific actions to include or exclude using `@Pick`, `@Except`or `@ApiOnly`:

```typescript
import { Resource, Except } from '@adonisjs-community/girouette'

@Resource('shop.products')
@Except(['create', 'store', 'edit', 'update', 'destroy'])
export default class ProductsController {
  async index() {} // GET /products
  async show({ params }: HttpContext) {} // GET /products/:id
  // create, store, edit, update, destroy are excluded
}
```

```typescript
import { Resource, Except } from '@adonisjs-community/girouette'

@Resource('shop.products')
@ApiOnly()
export default class ProductsController {
  async index() {}
  async show() {}
  async store() {}
  async update() {}
  async destroy() {}
  // 'create' and 'edit' are automatically excluded, as they are not part of
  // API actions but are only used for web form rendering purposes
}
```

## Tuyau Integration (Type-safe API Client)

Girouette fully supports [Tuyau](https://tuyau.dev), AdonisJS's type-safe API client generator. To enable type generation for your Girouette routes, you need to register the `generateGirouetteRoutes` hook in your `adonisrc.ts` file **before** the Tuyau `generateRegistry` hook:

```typescript
import { defineConfig } from '@adonisjs/core/app'
import { generateRegistry } from '@tuyau/core/hooks'
import { generateGirouetteRoutes } from '@adonisjs-community/girouette/hooks'

export default defineConfig({
  hooks: {
    init: [
      generateGirouetteRoutes(), // Register Girouette routes FIRST
      generateRegistry(), // Then generate Tuyau types
    ],
  },
  providers: [
    // ... other providers
    () => import('@adonisjs-community/girouette/girouette_provider'),
  ],
})
```

This hook scans your controllers during the codegen phase and registers routes with the AdonisJS router, allowing Tuyau to properly infer request and response types from your controller methods and validators.

### How it works

1. **When the dev server starts**:
   - The dev server child process initializes the AdonisJS application
   - The `GirouetteProvider` scans your controllers and registers routes with the router
   - Tuyau's `routesScanning` hook runs and finds all registered routes
   - Tuyau analyzes the routes and generates TypeScript types

2. **At runtime**:
   - The same routes registered by the provider handle incoming requests

The `generateGirouetteRoutes()` hook ensures compatibility with Tuyau by documenting the integration pattern. The actual route registration is handled by the `GirouetteProvider` at runtime, which means:

- Your frontend gets proper TypeScript types for API calls
- Request body types are inferred from your validators (e.g., VineJS schemas)
- Response types are inferred from your controller method return types
- No duplicate route registration or complex codegen logic needed

### Example

```typescript
// app/controllers/posts_controller.ts
import { Post } from '@adonisjs-community/girouette'
import { createPostValidator } from '#validators/post'

export default class PostsController {
  @Post('/posts', 'posts.store')
  async store({ request }: HttpContext) {
    const data = await request.validateUsing(createPostValidator)
    const post = await Post.create(data)
    return post
  }
}
```

With the hook configured, Tuyau will generate types like:

```typescript
// .adonisjs/client/registry/schema.d.ts
'posts.store': {
  methods: ["POST"]
  pattern: '/posts'
  types: {
    body: ExtractBody<InferInput<typeof createPostValidator>>
    response: Awaited<ReturnType<PostsController['store']>>
  }
}
```

## Note regarding [TC39 experimental decorators](https://github.com/microsoft/TypeScript/issues/57533#issuecomment-2762543664)

We're well aware about the uncertain future of **TC39 decorators**, which are still in experimental phase, but we are closely following the AdonisJS team's position on this topic. As of now, AdonisJS v6 is still using the experimental decorators proposal, and Girouette is built to work seamlessly with it.

## License

Girouette is open-sourced software licensed under the [MIT license](./LICENSE.md).

## Credits

All credit goes to [Alexis Bouchez](https://github.com/alexisbcz), who initiated this package. Thanks to him! It is now maintained by the AdonisJS community.
