![Statements](https://img.shields.io/badge/statements-86.78%25-yellow.svg?style=flat)
![Branches](https://img.shields.io/badge/branches-87.8%25-yellow.svg?style=flat)
![Functions](https://img.shields.io/badge/functions-77.14%25-red.svg?style=flat)
![Lines](https://img.shields.io/badge/lines-86.78%25-yellow.svg?style=flat)

# Girouette

> Elegant decorator-based routing for AdonisJS v7

## Introduction

Girouette provides a beautiful, fluent API for defining your AdonisJS routes using decorators. By bringing route definitions closer to your controller methods, Girouette makes your application's routing more intuitive and maintainable.

## Documentation

The full documentation is available at [girouette.raphalr.dev](https://girouette.raphalr.dev).

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

## Tuyau Integration (Type-safe API Client)

Girouette fully supports [Tuyau](https://tuyau.julr.dev), AdonisJS's type-safe API client generator. To enable type generation for your Girouette routes, you need to register the `generateGirouetteRoutes` hook in your `adonisrc.ts` file **before** the Tuyau `generateRegistry` hook:

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
