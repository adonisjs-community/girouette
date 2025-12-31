import { HttpContext } from '@adonisjs/core/http'
import { type HttpRouterService } from '@adonisjs/core/types'
import { NextFn } from '@adonisjs/core/types/http'

export const fakeMiddleware = async ({}: HttpContext, next: NextFn) => {
  next()
}

export interface Route {
  domain: string
  pattern: string
  matchers: Record<string, unknown>
  meta: Record<string, unknown>
  name: string
  handler: {
    reference: any[]
    name: string
    handle: (...args: any[]) => Promise<any>
  }
  methods: string[]
  middleware: unknown
  execute: (...args: any[]) => any
}

export function extractRoutesList(routes: ReturnType<HttpRouterService['toJSON']>) {
  return Object.values(routes).flat() as Route[]
}

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ANY', 'HEAD']

export const RESOURCE_METHODS = ['index', 'store', 'show', 'update', 'destroy', 'edit', 'create']
