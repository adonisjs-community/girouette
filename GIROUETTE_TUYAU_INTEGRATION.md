# Girouette + Tuyau Integration for AdonisJS v7

## Problem Summary

Girouette routes defined with decorators are not generating proper TypeScript types in `.adonisjs/client/registry/schema.d.ts`. All response types show as `unknown` and body types as `{}`.

**Root Cause**: Girouette registers routes at **runtime** (during the `start()` lifecycle), but Tuyau's `generateRegistry()` needs route information during the **assembler's codegen phase** (before runtime).

## Current Behavior

Generated `schema.d.ts` shows:

```typescript
'workload.plans.store': {
  methods: ["POST"]
  pattern: '/workload-plans'
  types: {
    body: {}              // Should be: ExtractBody<InferInput<typeof createWorkloadPlanValidator>>
    paramsTuple: []
    params: {}
    query: {}
    response: unknown     // Should be: Awaited<ReturnType<WorkloadPlansController['store']>>
  }
}
```

## How Tuyau Works

### 1. Assembler Hook Integration

Tuyau's `generateRegistry()` hook integrates with AdonisJS's assembler via:

- `routesScanning`: Called before routes are scanned
- `routesScanned`: Called after routes are scanned with full route metadata

### 2. Type Extraction Process

**Step 1: Controller Scanning**

```javascript
await this.#inspectControllerSpecifier(route.handler.importExpression, route.handler.method)
```

**Step 2: Validator Extraction**
Looks for patterns in controller methods:

- `request.validateUsing(validatorReference)`
- `vine.validate(validatorReference)`
- `validatorReference.validate(request.all())`

**Step 3: Request Type Generation**

```javascript
{
  type: `InferInput<(typeof import('${validator.import.specifier}')${validatorExport})${namespace}>`,
  imports: [`import { InferInput } from '@vinejs/vine/types'`]
}
```

**Step 4: Response Type Generation**

```javascript
route.response = {
  type: `Awaited<ReturnType<import('${controller.import.specifier}').default['${controller.method}']>>`,
  imports: [],
}
```

**Step 5: Body and Query Type Separation**

```javascript
// For GET/HEAD requests
{ bodyType: "{}", queryType: `ExtractQueryForGet<${requestType}>` }

// For POST/PUT/PATCH/DELETE
{
  bodyType: `ExtractBody<${requestType}>`,
  queryType: `ExtractQuery<${requestType}>`
}
```

### 3. Generated Files

Three files in `.adonisjs/client/registry/`:

**A. `index.ts`** - Runtime registry with route metadata
**B. `schema.d.ts`** - Type definitions with inferred types
**C. `tree.d.ts`** - Hierarchical API structure

## Solution: Modify Girouette to Write Route Metadata During Runtime

Since controllers can't be imported during codegen, the solution is to:

1. **Let Girouette register routes at runtime** (as it currently does)
2. **Write route metadata to a file** that Tuyau can read during codegen
3. **Create a codegen hook** that reads this metadata and provides it to Tuyau

### Implementation Plan

#### 1. Modify GirouetteProvider to Write Route Metadata

**File**: `providers/girouette_provider.ts`

Add a method to write route metadata after registering routes:

```typescript
async start() {
  // ... existing route registration code ...

  await this.#scanControllersDirectory(this.#controllersPath)
  await this.#router.commit()

  // NEW: Write route metadata for Tuyau
  await this.#writeRouteMetadata()
}

async #writeRouteMetadata() {
  const routes = this.#router.toJSON()
  const metadataPath = join(this.app.appRoot.pathname, '.adonisjs/girouette_routes.json')

  await writeFile(metadataPath, JSON.stringify(routes, null, 2))
}
```

#### 2. Create Codegen Hook in Girouette Package

**File**: `src/hooks/generate_routes.ts`

```typescript
import type { AssemblerHookHandler } from '@adonisjs/core/types/app'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import 'reflect-metadata'
import {
  REFLECT_ROUTES_KEY,
  REFLECT_GROUP_KEY,
  REFLECT_GROUP_MIDDLEWARE_KEY,
  REFLECT_GROUP_DOMAIN_KEY,
  REFLECT_RESOURCE_NAME_KEY,
  REFLECT_RESOURCE_MIDDLEWARE_KEY,
  REFLECT_RESOURCE_ONLY_KEY,
  REFLECT_RESOURCE_EXCEPT_KEY,
  REFLECT_RESOURCE_API_ONLY_KEY,
  REFLECT_RESOURCE_PARAMS_KEY,
} from '../constants.js'

/**
 * Assembler hook that scans Girouette controllers and registers routes
 * during the codegen phase, making them available to Tuyau
 */
export function generateGirouetteRoutes(): AssemblerHookHandler {
  return async (app) => {
    const router = await app.container.make('router')
    const config = app.config.get('girouette')
    const controllersPath = join(app.appRoot.pathname, 'app')

    // Scan and register all Girouette routes
    await scanAndRegisterRoutes(router, controllersPath, config, app)

    // Commit routes so they're available to Tuyau
    await router.commit()
  }
}

async function scanAndRegisterRoutes(router, directory, config, app) {
  const files = await readdir(directory, { withFileTypes: true })

  for (const file of files) {
    const fullPath = join(directory, file.name)

    if (file.isDirectory()) {
      await scanAndRegisterRoutes(router, fullPath, config, app)
      continue
    }

    if (isControllerFile(file.name, config)) {
      await processControllerFile(fullPath, router, app)
    }
  }
}

function isControllerFile(fileName, config) {
  if (!config?.controllersGlob) {
    return fileName.endsWith('_controller.ts') || fileName.endsWith('_controller.js')
  }
  return config.controllersGlob.test(fileName)
}

async function processControllerFile(filePath, router, app) {
  try {
    const path = pathToFileURL(filePath)
    const module = await import(path.href)
    const controller = module.default

    if (!controller) return

    // Register decorated routes
    registerControllerRoutes(controller, path, router, app)

    // Register resource routes
    registerResourceRoutes(controller, path, router, app)
  } catch (error) {
    console.error('[Girouette] Error processing controller file:', filePath, error)
  }
}

function registerControllerRoutes(controller, importUrl, router, app) {
  const routes = Reflect.getMetadata(REFLECT_ROUTES_KEY, controller)
  if (!routes) return

  const group = Reflect.getMetadata(REFLECT_GROUP_KEY, controller)
  const groupMiddleware = Reflect.getMetadata(REFLECT_GROUP_MIDDLEWARE_KEY, controller)
  const groupDomain = Reflect.getMetadata(REFLECT_GROUP_DOMAIN_KEY, controller)

  for (const methodName in routes) {
    const route = routes[methodName]
    const finalRoute = applyGroupConfiguration(route, methodName, group, groupMiddleware)
    const relativePath = getControllerReference(importUrl, app)

    const adonisRoute = router.route(
      finalRoute.pattern,
      [finalRoute.method],
      `./${relativePath}.${methodName}`
    )

    configureRoute(adonisRoute, finalRoute, groupDomain)
  }
}

function registerResourceRoutes(controller, importUrl, router, app) {
  const resourceName = Reflect.getMetadata(REFLECT_RESOURCE_NAME_KEY, controller)
  if (!resourceName) return

  const relativePath = getControllerReference(importUrl, app)
  const resource = router.resource(resourceName, `./${relativePath}`)

  // Configure resource
  const resourceParams = Reflect.getMetadata(REFLECT_RESOURCE_PARAMS_KEY, controller)
  if (resourceParams) {
    resource.params(resourceParams)
  }

  const apiOnly = Reflect.getMetadata(REFLECT_RESOURCE_API_ONLY_KEY, controller)
  if (apiOnly) {
    resource.apiOnly()
  }

  const only = Reflect.getMetadata(REFLECT_RESOURCE_ONLY_KEY, controller)
  if (only) {
    resource.only(only)
  }

  const except = Reflect.getMetadata(REFLECT_RESOURCE_EXCEPT_KEY, controller)
  if (except) {
    resource.except(except)
  }

  const resourceMiddleware = Reflect.getMetadata(REFLECT_RESOURCE_MIDDLEWARE_KEY, controller)
  if (resourceMiddleware) {
    for (const { actions, middleware } of resourceMiddleware) {
      resource.middleware(actions, middleware)
    }
  }
}

function applyGroupConfiguration(route, methodName, group, groupMiddleware) {
  if (!group && !groupMiddleware) return route

  return {
    ...route,
    pattern: group?.prefix ? prefixRoutePattern(route.pattern, group.prefix) : route.pattern,
    name: group?.name
      ? prefixRouteName(route.name, group.name, methodName)
      : route.name || methodName,
    middleware: mergeMiddleware(route.middleware, groupMiddleware),
  }
}

function prefixRoutePattern(pattern, prefix) {
  const cleanPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`
  const cleanPattern = pattern.startsWith('/') ? pattern.slice(1) : pattern
  return `${cleanPrefix}/${cleanPattern}`
}

function prefixRouteName(name, prefix, methodName) {
  const routeName = name || methodName
  return routeName.startsWith(`${prefix}.`) ? routeName : `${prefix}.${routeName}`
}

function mergeMiddleware(routeMiddleware, groupMiddleware) {
  if (!groupMiddleware) return [...(routeMiddleware || [])]
  const groupArray = Array.isArray(groupMiddleware) ? groupMiddleware : [groupMiddleware]
  return [...groupArray, ...(routeMiddleware || [])]
}

function configureRoute(adonisRoute, route, domain) {
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

function getControllerReference(importUrl, app) {
  const { relative } = await import('node:path/posix')
  return relative(app.appRoot.pathname, importUrl.pathname).replace(/\.ts$/, '.js')
}
```

#### 2. Export the Hook

**File**: `index.ts` (add to existing exports)

```typescript
export { generateGirouetteRoutes } from './src/hooks/generate_routes.js'
```

#### 3. Update Package Exports

**File**: `package.json`

```json
{
  "exports": {
    ".": "./build/index.js",
    "./hooks": "./build/src/hooks/generate_routes.js",
    "./providers/girouette_provider": "./build/providers/girouette_provider.js",
    "./types": "./build/src/types.js"
  }
}
```

### Usage in User Projects

**File**: `adonisrc.ts`

```typescript
import { defineConfig } from '@adonisjs/core/app'
import { generateRegistry } from '@tuyau/core/hooks'
import { generateGirouetteRoutes } from '@adonisjs-community/girouette/hooks'

export default defineConfig({
  hooks: {
    init: [
      generateGirouetteRoutes(), // Register Girouette routes FIRST
      generateRegistry(), // Then generate Tuyau types
      indexEntities({
        // ... existing config
      }),
    ],
  },
  providers: [
    // ... other providers
    () => import('@adonisjs-community/girouette/girouette_provider'),
  ],
})
```

## Temporary Workaround - NOT POSSIBLE

**After testing, a workaround in the user project is NOT possible** because:

1. **Controllers have runtime dependencies**: Controllers import files like `start/kernel.ts` which depend on runtime services (`server.errorHandler()`, `router.use()`, etc.) that don't exist during the codegen phase.

2. **Router not available during `routesScanning`**: The `routesScanner` object doesn't expose a `router` property during the `routesScanning` hook.

3. **Timing issue**: Girouette's decorator metadata can only be read after importing the controller modules, but importing them during codegen fails due to runtime dependencies.

**Attempted approaches that failed**:

- ❌ Running GirouetteProvider during `routesScanning` hook → `app.container` undefined
- ❌ Manually scanning controllers during codegen → Controllers fail to import due to runtime dependencies
- ❌ Using `routesCommitted` hook → Too late, Tuyau has already scanned

**Conclusion**: This MUST be fixed in the Girouette package itself, not in user projects.

**File**: `apps/api/adonisrc.ts`

```typescript
import { registerGirouetteRoutes } from './bin/girouette_routes_hook.js'

export default defineConfig({
  hooks: {
    init: [
      registerGirouetteRoutes(), // Add this BEFORE generateRegistry()
      generateRegistry(),
      indexEntities({
        // ... existing config
      }),
    ],
  },
})
```

## Testing Plan

1. Implement the hook in Girouette package
2. Publish a new pre-release version (e.g., `0.1.6-next.3`)
3. Update opale project to use the new version
4. Run `node ace build` to trigger codegen
5. Verify `.adonisjs/client/registry/schema.d.ts` has proper types:

- Body types should reference validators
- Response types should reference controller return types

6. Test type-safe API calls from the frontend

## Expected Result

After implementation, `schema.d.ts` should show:

```typescript
'workload.plans.store': {
  methods: ["POST"]
  pattern: '/workload-plans'
  types: {
    body: ExtractBody<InferInput<typeof import('#workload/validators/workload_plan').createWorkloadPlanValidator>>
    paramsTuple: []
    params: {}
    query: ExtractQuery<InferInput<typeof import('#workload/validators/workload_plan').createWorkloadPlanValidator>>
    response: Awaited<ReturnType<import('#workload/controllers/workload_plans_controller').default['store']>>
  }
}
```

## Key Files in Girouette Package

- `src/hooks/generate_routes.ts` - New assembler hook (to be created)
- `providers/girouette_provider.ts` - Existing runtime provider (keep as-is)
- `src/constants.ts` - Reflection metadata keys (already exists)
- `index.ts` - Main export file (update to export new hook)
- `package.json` - Update exports field

## References

- Girouette provider: `/node_modules/@adonisjs-community/girouette/build/providers/girouette_provider.js`
- Tuyau generateRegistry: `/node_modules/@tuyau/core/build/backend/generate_registry.js`
- AdonisJS assembler: `/node_modules/@adonisjs/assembler/build/main-BeV45LeF.js`

## Next Steps for Girouette Package

As the maintainer of Girouette, you need to implement the following in the package:

### Option 1: Metadata File Approach (Recommended)

1. **Modify `GirouetteProvider`** to write route metadata after registration
2. **Create codegen hook** that reads the metadata file and registers routes with the router during `routesScanning`
3. **Handle circular dependency**: The provider writes metadata, the hook reads it

### Option 2: Dual Registration (Simpler)

1. **Create a codegen hook** that registers routes WITHOUT importing controllers
2. **Use static analysis** or **decorator metadata caching** to avoid importing controllers
3. **Keep the runtime provider** for actual route execution

### Recommended Implementation (Option 1)

**Step 1**: Modify `providers/girouette_provider.ts`

```typescript
import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'

async start() {
  // ... existing code ...
  await this.#scanControllersDirectory(this.#controllersPath)
  await this.#router.commit()

  // Write metadata for codegen
  await this.#writeRouteMetadata()
}

async #writeRouteMetadata() {
  const routes = this.#router.toJSON()
  const metadataPath = join(this.app.appRoot.pathname, '.adonisjs/girouette_routes.json')

  await mkdir(dirname(metadataPath), { recursive: true })
  await writeFile(metadataPath, JSON.stringify(routes, null, 2))
}
```

**Step 2**: Create `src/hooks/codegen.ts`

```typescript
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export function generateGirouetteTypes() {
  return {
    async run(_parent: any, hooks: any) {
      hooks.add('routesScanning', async (devServer: any, routesScanner: any) => {
        try {
          const metadataPath = join(devServer.cwdPath, '.adonisjs/girouette_routes.json')
          const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'))

          // Register routes from metadata
          for (const route of metadata.routes) {
            const adonisRoute = routesScanner.router.route(
              route.pattern,
              route.methods,
              route.handler
            )

            if (route.name) adonisRoute.as(route.name)
            // ... configure other route properties
          }
        } catch (error) {
          // Metadata file doesn't exist yet (first run)
          console.warn(
            '[Girouette] No route metadata found, types will be generated after first server start'
          )
        }
      })
    },
  }
}
```

**Step 3**: Export the hook

```typescript
// index.ts
export { generateGirouetteTypes } from './src/hooks/codegen.js'
```

**Step 4**: Update package.json exports

```json
{
  "exports": {
    ".": "./build/index.js",
    "./hooks": "./build/src/hooks/codegen.js",
    "./providers/girouette_provider": "./build/providers/girouette_provider.js"
  }
}
```

**Step 5**: Document usage

Users would configure it as:

```typescript
import { generateGirouetteTypes } from '@adonisjs-community/girouette/hooks'
import { generateRegistry } from '@tuyau/core/hooks'

export default defineConfig({
  hooks: {
    init: [
      generateGirouetteTypes(), // Read Girouette metadata
      generateRegistry(), // Generate Tuyau types
    ],
  },
  providers: [
    () => import('@adonisjs-community/girouette/girouette_provider'), // Runtime registration
  ],
})
```

## Testing the Implementation

1. Implement the changes in Girouette package
2. Build the package: `npm run build`
3. Link locally: `npm link`
4. In opale project: `npm link @adonisjs-community/girouette`
5. Add the hook to `adonisrc.ts`
6. Run `node ace serve --hmr`
7. Check `.adonisjs/client/registry/schema.d.ts` for proper types
8. Verify types in frontend code

## Alternative: Wait for Official Support

Since Girouette is in pre-release for v7, you could also:

1. Open an issue in the Girouette repository
2. Propose this integration
3. Wait for official implementation
4. Use explicit return types in controllers as a temporary measure (though TypeScript infers them anyway)
